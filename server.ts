import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";

// Prevent unhandled promise rejections from crashing the process on Hostinger
process.on('uncaughtException', (err) => {
  console.error('[CRASH PREVENTED] uncaughtException:', err.message, err.stack);
});
process.on('unhandledRejection', (reason: any) => {
  console.error('[CRASH PREVENTED] unhandledRejection:', reason?.message || reason);
});

// Load .env from both project root and prisma/ subdirectory.
dotenv.config();
dotenv.config({ path: path.join(process.cwd(), 'prisma', '.env') });
dotenv.config({ path: path.join(process.cwd(), '..', '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// wasm engine requires a driver adapter — assigned in the startup IIFE before app.listen()
let prisma: PrismaClient = null!;
let dbReady = false;
let dbAdapter = 'none';

// Wake a suspended Neon compute with a raw HTTP query that we can hard-cancel.
// A single hanging query never wakes it; firing FRESH short requests does.
// AbortController ensures abandoned attempts are actually cancelled (no leaks).
async function neonWakeAttempt(timeoutMs: number): Promise<boolean> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return false;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const { neon } = await import('@neondatabase/serverless') as any;
    const sql = neon(dbUrl, { fetchOptions: { signal: ctrl.signal } });
    await sql`SELECT 1`;
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

let warmingUp = false;
async function warmupNeon() {
  if (warmingUp) return;
  warmingUp = true;
  console.log('[db] starting Neon warmup (fresh HTTP wake attempts)...');
  // Up to ~30 attempts over a few minutes. Each attempt is a NEW request with
  // a short timeout, so a suspended compute keeps getting fresh wake signals
  // instead of one request hanging forever.
  for (let i = 1; i <= 30; i++) {
    const ok = await neonWakeAttempt(12000);
    if (ok) {
      // Compute is awake. Now prime the ACTUAL Prisma adapter connection so the
      // first real login query is fast — waking compute via a separate neon()
      // client doesn't warm Prisma's own adapter (that was the 9s-timeout bug).
      if (prisma) {
        try {
          await withDbTimeout(prisma.$queryRaw`SELECT 1`, 20000);
          console.log('[db] Prisma adapter primed ✓');
        } catch (pe: any) {
          console.warn('[db] Prisma prime slow/failed, will keep trying:', pe.message);
          dbReady = false;
          if (i < 30) { await new Promise(r => setTimeout(r, 4000)); continue; }
        }
      }
      dbReady = true;
      warmingUp = false;
      console.log(`[db] Neon warmed up ✓ (attempt ${i})`);
      return;
    }
    console.error(`[db] warmup attempt ${i}/30 did not complete (compute likely cold)`);
    dbReady = false;
    if (i < 30) await new Promise(r => setTimeout(r, 4000));
  }
  warmingUp = false;
  console.error('[db] warmup gave up — will retry on next keepalive (3 min)');
};

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_here";

const FIXED_EMAILS = [
  "karya.ai.admin@gmail.com",
  "avinashmurari3@gmail.com",
  "karya.secret.admin@gmail.com",
  "mkarthikeya24@gmail.com",
  "kbsn1170@gmail.com"
];

let anthropic: Anthropic;
try {
  anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  console.log("✅ Anthropic initialized");
} catch (e) {
  console.error("❌ Anthropic init failed (non-fatal):", e);
}

const transporter = process.env.EMAIL_USER ? nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
}) : null;

async function sendEmail(to: string, subject: string, html: string) {
  if (!transporter) return;
  try {
    await transporter.sendMail({ from: `"KARYA" <${process.env.EMAIL_USER}>`, to, subject, html });
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

export const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// ============================================================
// ALL API ROUTES
// ============================================================

// Debug: shows exactly what happened during DB init
let dbInitError = '';
app.get("/api/debug/db", async (_req, res) => {
  const checks: any = { build: 'http-v2', prismaNull: prisma === null, dbReady, dbInitError, dbAdapter };
  try { checks.adapterNeonExports = Object.keys(await import('@prisma/adapter-neon')).join(','); } catch (e: any) { checks.adapterNeonError = e.message; }
  // Live query test over the configured adapter
  if (prisma) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.liveQuery = 'ok';
    } catch (e: any) {
      checks.liveQuery = 'FAIL: ' + e.message;
    }
  }
  res.json(checks);
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Ping — responds instantly (UptimeRobot + client polling).
// warmupNeon() manages DB state; don't fire extra queries here.
app.get("/api/ping", (_req, res) => {
  res.json({ ok: true, dbReady });
});

app.get("/api/debug/env", (req, res) => {
  res.json({
    DATABASE_URL: process.env.DATABASE_URL ? `set (${process.env.DATABASE_URL.slice(0, 40)}...)` : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
  });
});

app.post("/api/auth/register", async (req, res) => {
  const { email, password, displayName, role } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });
    if (role === 'admin' || role === 'employee') {
      return res.status(403).json({ error: "Cannot register as admin or employee directly." });
    }
    const hashedPassword = await bcrypt.hash(password, 8);
    const uid = "usr_" + Math.random().toString(36).substring(2, 11);
    const userRole = 'client';
    const isApproved = false;
    const user = await prisma.user.create({
      data: { uid, email: email.toLowerCase(), displayName, role: userRole, isApproved, passwordHash: hashedPassword }
    });
    if (userRole === 'client') {
      const nameParts = displayName?.trim().split(/\s+/) || [];
      const firstName = nameParts.slice(0, -1).join(' ') || nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      await prisma.client.create({
        data: { uid, status: 'pending_approval', applicationData: { firstName, lastName } }
      });
    }
    const token = jwt.sign({ uid: user.uid, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Race a DB promise against a timeout so a cold Neon query can't hang the
// request for 90s. On timeout we kick off warmup and return a fast 503 the
// frontend retries — far better UX than a hung connection.
class DbWarmingError extends Error { constructor() { super('db-warming'); } }
function withDbTimeout<T>(p: Promise<T>, ms = 15000): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new DbWarmingError()), ms)),
  ]);
}

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!prisma) { warmupNeon(); return res.status(503).json({ error: "Server waking up, please retry", warming: true }); }
    const user = await withDbTimeout(prisma.user.findUnique({ where: { email: email.toLowerCase() } }));
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    const validPassword = await bcrypt.compare(password, (user as any).passwordHash);
    if (!validPassword) return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign({ uid: user.uid, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    let clientProfile = null;
    if ((user as any).role === 'client') {
      clientProfile = await withDbTimeout(prisma.client.findUnique({ where: { uid: (user as any).uid } }));
    }
    dbReady = true;
    return res.json({ token, user, clientProfile });
  } catch (error: any) {
    const warming = error instanceof DbWarmingError || error.message?.includes('timeout') || error.code === '57014';
    if (warming) {
      warmupNeon(); // kick a background wake so subsequent retries succeed
      return res.status(503).json({ error: "Server waking up, please retry in a few seconds", warming: true });
    }
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/auth/me", authenticateToken, async (req: any, res: any) => {
  try {
    const user = await withDbTimeout(prisma.user.findUnique({ where: { uid: req.user.uid } }));
    if (!user) return res.status(404).json({ error: "User not found" });
    let clientProfile = null;
    if (user.role === 'client') {
      clientProfile = await withDbTimeout(prisma.client.findUnique({ where: { uid: user.uid } }));
    }
    dbReady = true;
    res.json({ user, clientProfile });
  } catch (error: any) {
    const warming = error instanceof DbWarmingError || error.message?.includes('timeout') || error.code === '57014';
    if (warming) {
      warmupNeon();
      return res.status(503).json({ error: "Server waking up, please retry", warming: true });
    }
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/clients/:uid", authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.uid !== req.params.uid && req.user.role === 'client') return res.status(403).json({ error: "Forbidden" });
    const { status, ...rest } = req.body;
    const updated = await prisma.client.update({
      where: { uid: req.params.uid },
      data: status ? { status, ...rest } : rest
    });
    if (status === 'approved' || status === 'active') {
      await prisma.user.update({ where: { uid: req.params.uid }, data: { isApproved: true } });
    } else if (status === 'banned') {
      await prisma.user.update({ where: { uid: req.params.uid }, data: { isBanned: true, isApproved: false } });
    } else if (status === 'pending_approval') {
      await prisma.user.update({ where: { uid: req.params.uid }, data: { isApproved: false } });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/clients", authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role === 'client') return res.status(403).json({ error: "Forbidden" });
    const filter = req.user.role === 'employee' ? { assignedEmployeeId: req.user.uid } : {};
    const clients = await prisma.client.findMany({ where: filter, include: { jobs: { orderBy: { updatedAt: 'desc' } } } });
    const uids = clients.map((c: any) => c.uid);
    const users = await prisma.user.findMany({ where: { uid: { in: uids } }, select: { uid: true, email: true, displayName: true } });
    const userMap: Record<string, any> = {};
    for (const u of users) userMap[u.uid] = u;
    const enriched = clients.map((c: any) => {
      const u = userMap[c.uid];
      const appData = (c.applicationData as any) || {};
      return {
        ...c,
        email: u?.email || null,
        displayName: u?.displayName || null,
        applicationData: {
          ...appData,
          firstName: appData.firstName || u?.displayName?.split(' ').slice(0, -1).join(' ') || u?.displayName || '',
          lastName: appData.lastName || (u?.displayName?.includes(' ') ? u?.displayName?.split(' ').pop() : '') || '',
        }
      };
    });
    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/jobs", authenticateToken, async (req: any, res: any) => {
  try {
    const { clientId, company, role, status, appliedDate, jobUrl, location, salary, tailoredResumeUrl } = req.body;
    const job = await prisma.clientJob.create({
      data: { clientId, company, role, status: status || 'Applied', appliedDate, jobUrl, location, salary, tailoredResumeUrl }
    });
    res.json(job);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/jobs/:clientId", authenticateToken, async (req: any, res: any) => {
  try {
    const identifier = req.params.clientId;
    let client = await prisma.client.findUnique({ where: { uid: identifier } });
    if (!client) client = await prisma.client.findUnique({ where: { id: identifier } });
    if (!client) return res.json([]);
    const jobs = await prisma.clientJob.findMany({ where: { clientId: client.id }, orderBy: { createdAt: 'desc' } });
    res.json(jobs);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put("/api/jobs/:id", authenticateToken, async (req: any, res: any) => {
  try {
    const job = await prisma.clientJob.update({ where: { id: req.params.id }, data: req.body });
    res.json(job);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/jobs/:id", authenticateToken, async (req: any, res: any) => {
  try {
    await prisma.clientJob.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/setup/seed-admin", async (req: any, res: any) => {
  const { secret, email, password, displayName } = req.body;
  if (secret !== process.env.SETUP_SECRET) return res.status(403).json({ error: 'Forbidden' });
  try {
    const hash = await bcrypt.hash(password, 8);
    const uid = 'admin_' + Math.random().toString(36).substring(2, 6);
    const user = await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: { passwordHash: hash, role: 'admin', isApproved: true },
      create: { uid, email: email.toLowerCase(), displayName: displayName || email, role: 'admin', isApproved: true, passwordHash: hash },
    });
    res.json({ ok: true, uid: user.uid });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/admin/create-user", authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'admin' && req.user.role !== 'employee') return res.status(403).json({ error: "Forbidden" });
  const { email, displayName, role, password } = req.body;
  if (role === 'admin') return res.status(403).json({ error: "Admin accounts cannot be created dynamically." });
  try {
    const hashedPassword = await bcrypt.hash(password, 8);
    const uid = "pre_" + Math.random().toString(36).substring(2, 11);
    const user = await prisma.user.create({
      data: { uid, email: email.toLowerCase(), displayName, role, isApproved: true, passwordHash: hashedPassword }
    });
    if (role === 'client') {
      await prisma.client.create({ data: { uid, status: 'pending_approval' } });
    }
    res.json({ status: "success", uid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/users/counselors", authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  try {
    const counselors = await prisma.user.findMany({
      where: { role: 'employee' },
      select: { uid: true, email: true, displayName: true }
    });
    const allClients = await prisma.client.findMany({
      where: { assignedEmployeeId: { not: null } },
      select: { uid: true, assignedEmployeeId: true, applicationData: true }
    });
    const clientUsers = await prisma.user.findMany({
      where: { uid: { in: allClients.map((c: any) => c.uid) } },
      select: { uid: true, email: true, displayName: true }
    });
    const clientUserMap: Record<string, any> = {};
    for (const u of clientUsers) clientUserMap[u.uid] = u;
    const result = counselors.map((c: any) => {
      const assigned = allClients.filter((cl: any) => cl.assignedEmployeeId === c.uid).map((cl: any) => {
        const appData = (cl.applicationData as any) || {};
        const u = clientUserMap[cl.uid];
        return {
          uid: cl.uid,
          name: [appData.firstName, appData.lastName].filter(Boolean).join(' ') || u?.displayName || 'Unknown',
          email: u?.email || null
        };
      });
      return { ...c, assignedClientsCount: assigned.length, assignedClients: assigned };
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/users/counselor", authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  const { email, displayName, password } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(400).json({ error: "A user with this email already exists." });
    const counselors = await prisma.user.findMany({ where: { role: 'employee' } });
    let maxId = 0;
    for (const c of counselors) {
      const num = parseInt(c.uid, 10);
      if (!isNaN(num) && num > maxId) maxId = num;
    }
    const newIdNum = maxId > 0 ? maxId + 1 : 3;
    const newUid = newIdNum.toString().padStart(2, '0');
    const finalPassword = password || ("Couns@" + Math.random().toString(36).substring(2, 8).toUpperCase() + newUid);
    const hashedPassword = await bcrypt.hash(finalPassword, 8);
    const user = await prisma.user.create({
      data: { uid: newUid, email: email.toLowerCase(), displayName, role: 'employee', isApproved: true, passwordHash: hashedPassword }
    });
    res.json({ status: "success", uid: newUid, email: user.email, password: finalPassword, displayName: user.displayName });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/stats", authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'admin' && req.user.role !== 'employee') return res.status(403).json({ error: "Forbidden" });
  try {
    const totalUsers = await prisma.user.count();
    const totalApplications = await prisma.clientJob.count();
    const recentApplications = await prisma.clientJob.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
    res.json({ totalUsers, totalApplications, recentApplications });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/users/:uid", authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'admin' && req.user.role !== 'employee') return res.status(403).json({ error: "Forbidden" });
  try {
    const userToDelete = await prisma.user.findFirst({
      where: { OR: [{ uid: req.params.uid }, { id: req.params.uid }] }
    });
    if (userToDelete && FIXED_EMAILS.includes(userToDelete.email.toLowerCase())) {
      return res.status(403).json({ error: "Cannot delete a fixed system user." });
    }
    const client = await prisma.client.findFirst({
      where: { OR: [{ uid: req.params.uid }, { id: req.params.uid }] }
    });
    if (!client && !userToDelete) return res.status(404).json({ error: "Candidate not found" });
    if (req.user.role === 'employee') {
      if (!client || client.assignedEmployeeId !== req.user.uid) {
        return res.status(403).json({ error: "Cannot delete unassigned candidate." });
      }
    }
    if (client) {
      await prisma.clientJob.deleteMany({ where: { clientId: client.id } });
      await prisma.client.delete({ where: { id: client.id } });
    }
    if (userToDelete) {
      await prisma.user.delete({ where: { id: userToDelete.id } });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/send-welcome-email", async (req, res) => { /* implementation */ });

app.post("/api/scrape-job", async (req: any, res: any) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "url is required" });
  try {
    const { default: puppeteer } = await import("puppeteer");
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const html = await page.content();
    await browser.close();
    const $ = cheerio.load(html);
    $('script,style,noscript,nav,footer,header').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 4000);
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: `Extract the job details from the text below. Reply with ONLY a JSON object with keys: company, title, location. If a field is not found, use null.\n\nText:\n${text}` }]
    });
    const raw = (message.content[0] as any).text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    res.json({ company: parsed.company || null, title: parsed.title || null, location: parsed.location || null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/parse-job-url", async (req: any, res: any) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text is required" });
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: `Extract structured job details from the text below. Reply with ONLY a JSON object with keys: company, title, location, salary, skills (array of strings), summary (one sentence). Use null for missing fields.\n\nText:\n${text.slice(0, 3000)}` }]
    });
    const raw = (message.content[0] as any).text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// STATIC FILES LAST — after all API routes
// ============================================================
if (!process.env.VERCEL) {
  (async () => {
    const PORT = parseInt(process.env.PORT || '3000', 10);
    const distPath = path.join(process.cwd(), "dist");

    try {
      const dbUrl = process.env.DATABASE_URL;
      console.log('[db] DATABASE_URL:', dbUrl ? dbUrl.slice(0, 50) + '...' : 'NOT FOUND');
      if (!dbUrl) throw new Error('DATABASE_URL not set');

      // Use PrismaNeonHTTP — the HTTP variant that sends every query over
      // HTTPS port 443. This is the ONLY transport confirmed to reach Neon
      // from Hostinger (TCP 5432 and WebSocket are blocked). PrismaNeon (the
      // Pool/WebSocket variant) constructs without error but its queries hang.
      let adapterConfigured = false;
      const adapterMod = await import('@prisma/adapter-neon') as any;
      console.log('[db] adapter-neon exports:', Object.keys(adapterMod).join(','));

      if (adapterMod.PrismaNeonHTTP) {
        try {
          // PrismaNeonHTTP takes the CONNECTION STRING (it calls neon() internally).
          // Passing neon(url) here causes "connection string is not a valid URL".
          const adapter = new adapterMod.PrismaNeonHTTP(dbUrl);
          prisma = new PrismaClient({ adapter } as any);
          adapterConfigured = true;
          dbAdapter = 'PrismaNeonHTTP';
          console.log('[db] PrismaNeonHTTP adapter configured');
        } catch (he: any) {
          console.error('[db] PrismaNeonHTTP error:', he.message);
          dbInitError = 'neon-http: ' + he.message;
        }
      } else {
        dbInitError = 'PrismaNeonHTTP export missing; exports=' + Object.keys(adapterMod).join(',');
        console.error('[db] ' + dbInitError);
      }

      if (!adapterConfigured) {
        // Last-resort fallback: PrismaNeon (WebSocket Pool)
        try {
          const { Pool, neonConfig } = await import('@neondatabase/serverless') as any;
          const wsModule = await import('ws') as any;
          neonConfig.webSocketConstructor = wsModule.default ?? wsModule;
          const pool = new Pool({ connectionString: dbUrl });
          const adapter = new adapterMod.PrismaNeon(pool);
          prisma = new PrismaClient({ adapter } as any);
          adapterConfigured = true;
          dbAdapter = 'PrismaNeon(pool)';
          console.log('[db] PrismaNeon(pool) fallback configured');
        } catch (fe: any) {
          console.error('[db] fallback adapter error:', fe.message);
          dbInitError += ' | fallback: ' + fe.message;
        }
      }

      // Warm up Neon on startup with retries
      warmupNeon();
    } catch (e: any) {
      dbInitError = e.message;
      console.error('[db] init failed, server still starting:', e.message);
    }

    // Start listening regardless of DB state.
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);

      // Self-ping every 3 minutes keeps Hostinger process alive.
      // Also runs a direct SELECT 1 to keep Neon warm (no HTTP overhead).
      // Keepalive every 2 min (under Neon's 5-min sleep) so the DB stays warm
      // as long as the Node process is alive. Wrapped in a timeout so a cold
      // query can't hang the interval; on failure it triggers a full warmup.
      setInterval(async () => {
        if (!prisma || warmingUp) return;
        try {
          await withDbTimeout(prisma.$queryRaw`SELECT 1`, 10000);
          dbReady = true;
        } catch {
          dbReady = false;
          warmupNeon();
        }
      }, 2 * 60 * 1000);
    });
  })();
}