// server.ts
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
process.on("uncaughtException", (err) => {
  console.error("[CRASH PREVENTED] uncaughtException:", err.message, err.stack);
});
process.on("unhandledRejection", (reason) => {
  console.error("[CRASH PREVENTED] unhandledRejection:", reason?.message || reason);
});
dotenv.config();
dotenv.config({ path: path.join(process.cwd(), "prisma", ".env") });
dotenv.config({ path: path.join(process.cwd(), "..", ".env") });
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var prisma = null;
var dbReady = false;
var dbAdapter = "none";
var warmingUp = false;
async function warmupNeon() {
  if (warmingUp) return;
  warmingUp = true;
  const dbUrl = process.env.DATABASE_URL;
  for (let i = 1; i <= 30; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12e3);
    try {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(dbUrl, { fetchOptions: { signal: ctrl.signal } });
      await sql`SELECT 1`;
      clearTimeout(t);
      if (prisma) {
        try {
          await withDbTimeout(prisma.$queryRaw`SELECT 1`, 12e3);
        } catch {
        }
      }
      dbReady = true;
      warmingUp = false;
      console.log(`[db] Neon warmed up \u2713 (attempt ${i})`);
      return;
    } catch {
      clearTimeout(t);
      dbReady = false;
      if (i < 30) await new Promise((r) => setTimeout(r, 4e3));
    }
  }
  warmingUp = false;
}
async function ensureAdmins() {
  if (!prisma) return;
  const admins = [
    { uid: "admin_01", email: "karya.ai.admin@gmail.com", displayName: "Karya Admin", password: "AdminPassword123!" },
    { uid: "admin_02", email: "karya.secret.admin@gmail.com", displayName: "Karya Admin 2", password: "AdminPassword123!" },
    { uid: "admin_03", email: "avinashmurari3@gmail.com", displayName: "Karya Admin 3", password: "Avinash@001" }
  ];
  for (const a of admins) {
    const passwordHash = await bcrypt.hash(a.password, 10);
    await prisma.user.upsert({
      where: { email: a.email },
      update: { passwordHash, role: "admin", isApproved: true },
      create: { uid: a.uid, email: a.email, displayName: a.displayName, role: "admin", isApproved: true, passwordHash }
    });
  }
  console.log("[db] admin accounts ensured");
}
var JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_here";
var FIXED_EMAILS = [
  "karya.ai.admin@gmail.com",
  "avinashmurari3@gmail.com",
  "karya.secret.admin@gmail.com",
  "mkarthikeya24@gmail.com",
  "kbsn1170@gmail.com"
];
var anthropic;
try {
  anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  console.log("\u2705 Anthropic initialized");
} catch (e) {
  console.error("\u274C Anthropic init failed (non-fatal):", e);
}
var transporter = process.env.EMAIL_USER ? nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
}) : null;
var authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
var app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});
var dbInitError = "";
app.get("/api/debug/db", async (_req, res) => {
  const checks = { build: "neon-v3-freshconn", prismaNull: prisma === null, dbReady, dbInitError, dbAdapter };
  if (prisma) {
    try {
      await withDbTimeout(prisma.$queryRaw`SELECT 1`, 8e3);
      checks.liveQuery = "ok";
    } catch (e) {
      checks.liveQuery = "FAIL: " + (e.message || e);
    }
  }
  res.json(checks);
});
var migrationState = { phase: "idle", counts: {}, errors: [], startedAt: null, finishedAt: null };
async function wakeNeon(neon, neonUrl) {
  for (let i = 1; i <= 40; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1e4);
    try {
      const sql = neon(neonUrl, { fetchOptions: { signal: ctrl.signal } });
      await sql`SELECT 1`;
      clearTimeout(t);
      migrationState.phase = "neon-awake";
      return true;
    } catch {
      clearTimeout(t);
      migrationState.phase = `waking-neon (${i}/40)`;
      await new Promise((r) => setTimeout(r, 4e3));
    }
  }
  return false;
}
async function runNeonMigration(neonUrl) {
  const counts = {};
  const errors = [];
  migrationState = { phase: "starting", counts, errors, startedAt: (/* @__PURE__ */ new Date()).toISOString(), finishedAt: null };
  try {
    const { neon } = await import("@neondatabase/serverless");
    migrationState.phase = "waking-neon";
    const awake = await wakeNeon(neon, neonUrl);
    if (!awake) {
      migrationState.phase = "FAILED: could not wake Neon";
      migrationState.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
      return;
    }
    const sql = neon(neonUrl);
    migrationState.phase = "copying Users";
    const users = await sql`SELECT * FROM "User"`;
    counts.users = 0;
    for (const u of users) {
      try {
        await prisma.user.upsert({
          where: { email: u.email },
          update: {
            uid: u.uid,
            role: u.role,
            displayName: u.displayName ?? null,
            passwordHash: u.passwordHash ?? null,
            assignedClients: u.assignedClients ?? void 0,
            isBanned: !!u.isBanned,
            isApproved: !!u.isApproved
          },
          create: {
            id: u.id,
            uid: u.uid,
            email: u.email,
            role: u.role,
            displayName: u.displayName ?? null,
            passwordHash: u.passwordHash ?? null,
            assignedClients: u.assignedClients ?? void 0,
            isBanned: !!u.isBanned,
            isApproved: !!u.isApproved,
            createdAt: u.createdAt ? new Date(u.createdAt) : /* @__PURE__ */ new Date()
          }
        });
        counts.users++;
      } catch (e) {
        errors.push(`user ${u.email}: ${e.message}`);
      }
    }
    migrationState.phase = "copying Clients";
    const clients = await sql`SELECT * FROM "Client"`;
    counts.clients = 0;
    for (const c of clients) {
      try {
        await prisma.client.upsert({
          where: { uid: c.uid },
          update: {
            assignedEmployeeId: c.assignedEmployeeId ?? null,
            status: c.status,
            masterResumeStorageUrl: c.masterResumeStorageUrl ?? null,
            applicationData: c.applicationData ?? void 0,
            onboardingSkipped: !!c.onboardingSkipped
          },
          create: {
            id: c.id,
            uid: c.uid,
            assignedEmployeeId: c.assignedEmployeeId ?? null,
            status: c.status,
            masterResumeStorageUrl: c.masterResumeStorageUrl ?? null,
            applicationData: c.applicationData ?? void 0,
            onboardingSkipped: !!c.onboardingSkipped,
            createdAt: c.createdAt ? new Date(c.createdAt) : /* @__PURE__ */ new Date(),
            updatedAt: c.updatedAt ? new Date(c.updatedAt) : /* @__PURE__ */ new Date()
          }
        });
        counts.clients++;
      } catch (e) {
        errors.push(`client ${c.uid}: ${e.message}`);
      }
    }
    try {
      const jobs = await sql`SELECT * FROM "ClientJob"`;
      counts.jobs = 0;
      for (const j of jobs) {
        try {
          await prisma.clientJob.upsert({
            where: { id: j.id },
            update: {},
            create: {
              id: j.id,
              clientId: j.clientId,
              company: j.company,
              role: j.role,
              status: j.status,
              appliedDate: j.appliedDate ?? null,
              jobUrl: j.jobUrl ?? null,
              location: j.location ?? null,
              salary: j.salary ?? null,
              tailoredResumeUrl: j.tailoredResumeUrl ?? null,
              createdAt: j.createdAt ? new Date(j.createdAt) : /* @__PURE__ */ new Date(),
              updatedAt: j.updatedAt ? new Date(j.updatedAt) : /* @__PURE__ */ new Date()
            }
          });
          counts.jobs++;
        } catch (e) {
          errors.push(`job ${j.id}: ${e.message}`);
        }
      }
    } catch (e) {
      errors.push("ClientJob table: " + e.message);
    }
    try {
      const rh = await sql`SELECT * FROM "ResumeHistory"`;
      counts.resumeHistory = 0;
      for (const r of rh) {
        try {
          await prisma.resumeHistory.upsert({
            where: { id: r.id },
            update: {},
            create: {
              id: r.id,
              userId: r.userId,
              resumeText: r.resumeText,
              company: r.company ?? null,
              role: r.role ?? null,
              atsScore: r.atsScore ?? null,
              jobId: r.jobId ?? null,
              createdAt: r.createdAt ? new Date(r.createdAt) : /* @__PURE__ */ new Date()
            }
          });
          counts.resumeHistory++;
        } catch (e) {
          errors.push(`resume ${r.id}: ${e.message}`);
        }
      }
    } catch (e) {
      errors.push("ResumeHistory table: " + e.message);
    }
    try {
      const pre = await sql`SELECT * FROM "PreRegistration"`;
      counts.preRegistration = 0;
      for (const p of pre) {
        try {
          await prisma.preRegistration.upsert({
            where: { email: p.email },
            update: {},
            create: {
              id: p.id,
              email: p.email,
              displayName: p.displayName ?? null,
              role: p.role,
              generatedPassword: p.generatedPassword,
              uid: p.uid ?? null,
              createdAt: p.createdAt ? new Date(p.createdAt) : /* @__PURE__ */ new Date()
            }
          });
          counts.preRegistration++;
        } catch (e) {
          errors.push(`prereg ${p.email}: ${e.message}`);
        }
      }
    } catch (e) {
      errors.push("PreRegistration table: " + e.message);
    }
    migrationState.phase = "done";
    migrationState.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
  } catch (e) {
    migrationState.phase = "FAILED: " + e.message;
    migrationState.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
  }
}
app.post("/api/admin/migrate-from-neon", async (req, res) => {
  const { secret, neonUrl } = req.body || {};
  if (!secret || secret !== process.env.SETUP_SECRET) return res.status(403).json({ error: "bad secret" });
  if (!neonUrl || !/^postgres/.test(neonUrl)) return res.status(400).json({ error: "provide neonUrl (postgresql://...)" });
  if (!prisma) return res.status(503).json({ error: "db not ready" });
  if (migrationState.phase !== "idle" && migrationState.phase !== "done" && !String(migrationState.phase).startsWith("FAILED")) {
    return res.json({ started: false, alreadyRunning: true, phase: migrationState.phase, counts: migrationState.counts });
  }
  runNeonMigration(neonUrl);
  res.json({ started: true, statusUrl: "/api/admin/migrate-status" });
});
app.get("/api/admin/migrate-status", (_req, res) => {
  res.json({
    phase: migrationState.phase,
    counts: migrationState.counts,
    errorCount: (migrationState.errors || []).length,
    errors: (migrationState.errors || []).slice(0, 20),
    startedAt: migrationState.startedAt,
    finishedAt: migrationState.finishedAt
  });
});
app.post("/api/admin/import-batch", async (req, res) => {
  const { secret, table, rows } = req.body || {};
  if (!secret || secret !== process.env.SETUP_SECRET) return res.status(403).json({ error: "bad secret" });
  if (!prisma) return res.status(503).json({ error: "db not ready" });
  if (!Array.isArray(rows)) return res.status(400).json({ error: "rows must be an array" });
  const schema = {
    User: { cols: ["id", "uid", "email", "role", "displayName", "passwordHash", "assignedClients", "isBanned", "isApproved", "createdAt"], conflict: "email", json: ["assignedClients"], bool: ["isBanned", "isApproved"], date: ["createdAt"] },
    Client: { cols: ["id", "uid", "assignedEmployeeId", "status", "masterResumeStorageUrl", "applicationData", "onboardingSkipped", "createdAt", "updatedAt"], conflict: "uid", json: ["applicationData"], bool: ["onboardingSkipped"], date: ["createdAt", "updatedAt"] },
    ClientJob: { cols: ["id", "clientId", "company", "role", "status", "appliedDate", "jobUrl", "location", "salary", "tailoredResumeUrl", "createdAt", "updatedAt"], conflict: "id", date: ["createdAt", "updatedAt"] },
    ResumeHistory: { cols: ["id", "userId", "resumeText", "company", "role", "atsScore", "jobId", "createdAt"], conflict: "id", date: ["createdAt"] },
    PreRegistration: { cols: ["id", "email", "displayName", "role", "generatedPassword", "uid", "createdAt"], conflict: "email", date: ["createdAt"] }
  };
  const def = schema[table];
  if (!def) return res.status(400).json({ error: "unknown table " + table });
  const esc = (s) => s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const lit = (col, val) => {
    if (val === null || val === void 0) return "NULL";
    if (def.bool?.includes(col)) return val ? "1" : "0";
    if (def.json?.includes(col)) return `'${esc(JSON.stringify(val))}'`;
    if (def.date?.includes(col)) {
      const d = new Date(val);
      return isNaN(+d) ? "NULL" : `'${d.toISOString().slice(0, 23).replace("T", " ")}'`;
    }
    return `'${esc(String(val))}'`;
  };
  let ok = 0;
  const errors = [];
  try {
    for (const r of rows) {
      try {
        const colSql = def.cols.map((c) => "`" + c + "`").join(",");
        const valSql = def.cols.map((c) => lit(c, r[c])).join(",");
        const upd = def.cols.filter((c) => c !== def.conflict && c !== "id").map((c) => "`" + c + "`=VALUES(`" + c + "`)").join(",");
        const sql = `INSERT INTO \`${table}\` (${colSql}) VALUES (${valSql}) ON DUPLICATE KEY UPDATE ${upd}`;
        await prisma.$executeRawUnsafe(sql);
        ok++;
      } catch (e) {
        errors.push(`${r.id || r.email}: ${e.message}`);
      }
    }
    res.json({ ok, errorCount: errors.length, errors: errors.slice(0, 10) });
  } catch (e) {
    res.status(500).json({ error: e.message, ok, errors: errors.slice(0, 10) });
  }
});
app.get("/api/debug/mysql", async (_req, res) => {
  const out = {};
  let mariadb;
  try {
    mariadb = await import("mariadb");
    mariadb = mariadb.default ?? mariadb;
  } catch (e) {
    return res.json({ importError: e.message });
  }
  const u = new URL(process.env.DATABASE_URL || "mysql://");
  const base = {
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ""),
    connectTimeout: 6e3
  };
  const fs = await import("fs");
  out.sockets = {};
  for (const p of ["/var/run/mysqld/mysqld.sock", "/run/mysqld/mysqld.sock", "/tmp/mysql.sock", "/var/lib/mysql/mysql.sock", "/var/run/mysqld/mysqld10.sock"]) {
    try {
      out.sockets[p] = fs.existsSync(p);
    } catch {
      out.sockets[p] = "err";
    }
  }
  const tryConn = async (label, cfg) => {
    const start = Date.now();
    let conn;
    try {
      conn = await mariadb.createConnection({ ...cfg, connectTimeout: 8e3 });
      await conn.query("SELECT 1");
      const readMs = Date.now() - start;
      const w = Date.now();
      const db = cfg.database;
      await conn.query(`CREATE TABLE IF NOT EXISTS \`${db}\`.\`_wtest\` (x INT PRIMARY KEY)`);
      await conn.query(`INSERT INTO \`${db}\`.\`_wtest\` (x) VALUES (1) ON DUPLICATE KEY UPDATE x=1`);
      const got = await conn.query(`SELECT x FROM \`${db}\`.\`_wtest\` WHERE x=1`);
      await conn.query(`DROP TABLE \`${db}\`.\`_wtest\``);
      out[label] = `read OK ${readMs}ms; WRITE OK ${Date.now() - w}ms (got ${JSON.stringify(got?.[0]?.x)})`;
    } catch (e) {
      out[label] = `FAIL ${Date.now() - start}ms: ${e.code || ""} ${e.message}`.slice(0, 160);
    } finally {
      try {
        if (conn) await conn.end();
      } catch {
      }
    }
  };
  const cap = (label, p) => Promise.race([p, new Promise((r) => setTimeout(() => {
    if (!out[label]) out[label] = "TIMEOUT-18s (hung)";
    r(null);
  }, 18e3))]);
  await cap("tcp_127", tryConn("tcp_127", { ...base, host: "127.0.0.1", port: 3306 }));
  for (const p of Object.keys(out.sockets)) {
    if (out.sockets[p] === true) await cap("socket_" + p, tryConn("socket_" + p, { ...base, socketPath: p }));
  }
  res.json(out);
});
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
var lastPingTouch = 0;
app.get("/api/ping", (_req, res) => {
  const t = Date.now();
  if (prisma && !warmingUp && t - lastPingTouch > 6e4) {
    lastPingTouch = t;
    withDbTimeout(prisma.$queryRaw`SELECT 1`, 9e3).then(() => {
      dbReady = true;
    }).catch(() => {
      dbReady = false;
      warmupNeon();
    });
  }
  res.json({ ok: true, dbReady });
});
app.get("/api/debug/env", (req, res) => {
  res.json({
    DATABASE_URL: process.env.DATABASE_URL ? `set (${process.env.DATABASE_URL.slice(0, 40)}...)` : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT
  });
});
app.post("/api/auth/register", async (req, res) => {
  const { email, password, displayName, role } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });
    if (role === "admin" || role === "employee") {
      return res.status(403).json({ error: "Cannot register as admin or employee directly." });
    }
    const hashedPassword = await bcrypt.hash(password, 8);
    const uid = "usr_" + Math.random().toString(36).substring(2, 11);
    const userRole = "client";
    const isApproved = false;
    const user = await prisma.user.create({
      data: { uid, email: email.toLowerCase(), displayName, role: userRole, isApproved, passwordHash: hashedPassword }
    });
    if (userRole === "client") {
      const nameParts = displayName?.trim().split(/\s+/) || [];
      const firstName = nameParts.slice(0, -1).join(" ") || nameParts[0] || "";
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
      await prisma.client.create({
        data: { uid, status: "pending_approval", applicationData: { firstName, lastName } }
      });
    }
    const token = jwt.sign({ uid: user.uid, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
var DbWarmingError = class extends Error {
  constructor() {
    super("db-warming");
  }
};
function withDbTimeout(p, ms = 15e3) {
  return Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new DbWarmingError()), ms))
  ]);
}
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!prisma) {
      warmupNeon();
      return res.status(503).json({ error: "Server waking up, please retry", warming: true });
    }
    const user = await withDbTimeout(prisma.user.findUnique({ where: { email: email.toLowerCase() } }));
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign({ uid: user.uid, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    let clientProfile = null;
    if (user.role === "client") {
      clientProfile = await withDbTimeout(prisma.client.findUnique({ where: { uid: user.uid } }));
    }
    dbReady = true;
    return res.json({ token, user, clientProfile });
  } catch (error) {
    const warming = error instanceof DbWarmingError || error.message?.includes("timeout") || error.code === "57014";
    if (warming) {
      warmupNeon();
      return res.status(503).json({ error: "Server waking up, please retry in a few seconds", warming: true });
    }
    return res.status(500).json({ error: error.message });
  }
});
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await withDbTimeout(prisma.user.findUnique({ where: { uid: req.user.uid } }));
    if (!user) return res.status(404).json({ error: "User not found" });
    let clientProfile = null;
    if (user.role === "client") {
      clientProfile = await withDbTimeout(prisma.client.findUnique({ where: { uid: user.uid } }));
    }
    dbReady = true;
    res.json({ user, clientProfile });
  } catch (error) {
    const warming = error instanceof DbWarmingError || error.message?.includes("timeout") || error.code === "57014";
    if (warming) {
      warmupNeon();
      return res.status(503).json({ error: "Server waking up, please retry", warming: true });
    }
    res.status(500).json({ error: error.message });
  }
});
app.put("/api/clients/:uid", authenticateToken, async (req, res) => {
  try {
    if (req.user.uid !== req.params.uid && req.user.role === "client") return res.status(403).json({ error: "Forbidden" });
    const { status, ...rest } = req.body;
    const updated = await prisma.client.update({
      where: { uid: req.params.uid },
      data: status ? { status, ...rest } : rest
    });
    if (status === "approved" || status === "active") {
      await prisma.user.update({ where: { uid: req.params.uid }, data: { isApproved: true } });
    } else if (status === "banned") {
      await prisma.user.update({ where: { uid: req.params.uid }, data: { isBanned: true, isApproved: false } });
    } else if (status === "pending_approval") {
      await prisma.user.update({ where: { uid: req.params.uid }, data: { isApproved: false } });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/clients", authenticateToken, async (req, res) => {
  try {
    if (req.user.role === "client") return res.status(403).json({ error: "Forbidden" });
    const filter = req.user.role === "employee" ? { assignedEmployeeId: req.user.uid } : {};
    const clients = await prisma.client.findMany({ where: filter, include: { jobs: { orderBy: { updatedAt: "desc" } } } });
    const uids = clients.map((c) => c.uid);
    const users = await prisma.user.findMany({ where: { uid: { in: uids } }, select: { uid: true, email: true, displayName: true } });
    const userMap = {};
    for (const u of users) userMap[u.uid] = u;
    const enriched = clients.map((c) => {
      const u = userMap[c.uid];
      const appData = c.applicationData || {};
      return {
        ...c,
        email: u?.email || null,
        displayName: u?.displayName || null,
        applicationData: {
          ...appData,
          firstName: appData.firstName || u?.displayName?.split(" ").slice(0, -1).join(" ") || u?.displayName || "",
          lastName: appData.lastName || (u?.displayName?.includes(" ") ? u?.displayName?.split(" ").pop() : "") || ""
        }
      };
    });
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/jobs", authenticateToken, async (req, res) => {
  try {
    const { clientId, company, role, status, appliedDate, jobUrl, location, salary, tailoredResumeUrl } = req.body;
    const job = await prisma.clientJob.create({
      data: { clientId, company, role, status: status || "Applied", appliedDate, jobUrl, location, salary, tailoredResumeUrl }
    });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/jobs/:clientId", authenticateToken, async (req, res) => {
  try {
    const identifier = req.params.clientId;
    let client = await prisma.client.findUnique({ where: { uid: identifier } });
    if (!client) client = await prisma.client.findUnique({ where: { id: identifier } });
    if (!client) return res.json([]);
    const jobs = await prisma.clientJob.findMany({ where: { clientId: client.id }, orderBy: { createdAt: "desc" } });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put("/api/jobs/:id", authenticateToken, async (req, res) => {
  try {
    const job = await prisma.clientJob.update({ where: { id: req.params.id }, data: req.body });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete("/api/jobs/:id", authenticateToken, async (req, res) => {
  try {
    await prisma.clientJob.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/setup/seed-admin", async (req, res) => {
  const { secret, email, password, displayName } = req.body;
  if (secret !== process.env.SETUP_SECRET) return res.status(403).json({ error: "Forbidden" });
  try {
    const hash = await bcrypt.hash(password, 8);
    const uid = "admin_" + Math.random().toString(36).substring(2, 6);
    const user = await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: { passwordHash: hash, role: "admin", isApproved: true },
      create: { uid, email: email.toLowerCase(), displayName: displayName || email, role: "admin", isApproved: true, passwordHash: hash }
    });
    res.json({ ok: true, uid: user.uid });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.post("/api/admin/create-user", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "employee") return res.status(403).json({ error: "Forbidden" });
  const { email, displayName, role, password } = req.body;
  if (role === "admin") return res.status(403).json({ error: "Admin accounts cannot be created dynamically." });
  try {
    const hashedPassword = await bcrypt.hash(password, 8);
    const uid = "pre_" + Math.random().toString(36).substring(2, 11);
    const user = await prisma.user.create({
      data: { uid, email: email.toLowerCase(), displayName, role, isApproved: true, passwordHash: hashedPassword }
    });
    if (role === "client") {
      await prisma.client.create({ data: { uid, status: "pending_approval" } });
    }
    res.json({ status: "success", uid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/users/counselors", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  try {
    const counselors = await prisma.user.findMany({
      where: { role: "employee" },
      select: { uid: true, email: true, displayName: true }
    });
    const allClients = await prisma.client.findMany({
      where: { assignedEmployeeId: { not: null } },
      select: { uid: true, assignedEmployeeId: true, applicationData: true }
    });
    const clientUsers = await prisma.user.findMany({
      where: { uid: { in: allClients.map((c) => c.uid) } },
      select: { uid: true, email: true, displayName: true }
    });
    const clientUserMap = {};
    for (const u of clientUsers) clientUserMap[u.uid] = u;
    const result = counselors.map((c) => {
      const assigned = allClients.filter((cl) => cl.assignedEmployeeId === c.uid).map((cl) => {
        const appData = cl.applicationData || {};
        const u = clientUserMap[cl.uid];
        return {
          uid: cl.uid,
          name: [appData.firstName, appData.lastName].filter(Boolean).join(" ") || u?.displayName || "Unknown",
          email: u?.email || null
        };
      });
      return { ...c, assignedClientsCount: assigned.length, assignedClients: assigned };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/users/counselor", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  const { email, displayName, password } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(400).json({ error: "A user with this email already exists." });
    const counselors = await prisma.user.findMany({ where: { role: "employee" } });
    let maxId = 0;
    for (const c of counselors) {
      const num = parseInt(c.uid, 10);
      if (!isNaN(num) && num > maxId) maxId = num;
    }
    const newIdNum = maxId > 0 ? maxId + 1 : 3;
    const newUid = newIdNum.toString().padStart(2, "0");
    const finalPassword = password || "Couns@" + Math.random().toString(36).substring(2, 8).toUpperCase() + newUid;
    const hashedPassword = await bcrypt.hash(finalPassword, 8);
    const user = await prisma.user.create({
      data: { uid: newUid, email: email.toLowerCase(), displayName, role: "employee", isApproved: true, passwordHash: hashedPassword }
    });
    res.json({ status: "success", uid: newUid, email: user.email, password: finalPassword, displayName: user.displayName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/admin/stats", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "employee") return res.status(403).json({ error: "Forbidden" });
  try {
    const totalUsers = await prisma.user.count();
    const totalApplications = await prisma.clientJob.count();
    const recentApplications = await prisma.clientJob.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
    res.json({ totalUsers, totalApplications, recentApplications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.delete("/api/users/:uid", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "employee") return res.status(403).json({ error: "Forbidden" });
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
    if (req.user.role === "employee") {
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/send-welcome-email", async (req, res) => {
});
app.post("/api/scrape-job", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "url is required" });
  try {
    const { default: puppeteer } = await import("puppeteer");
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15e3 });
    const html = await page.content();
    await browser.close();
    const $ = cheerio.load(html);
    $("script,style,noscript,nav,footer,header").remove();
    const text = $("body").text().replace(/\s+/g, " ").trim().slice(0, 4e3);
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{ role: "user", content: `Extract the job details from the text below. Reply with ONLY a JSON object with keys: company, title, location. If a field is not found, use null.

Text:
${text}` }]
    });
    const raw = message.content[0].text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    res.json({ company: parsed.company || null, title: parsed.title || null, location: parsed.location || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/parse-job-url", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text is required" });
  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: `Extract structured job details from the text below. Reply with ONLY a JSON object with keys: company, title, location, salary, skills (array of strings), summary (one sentence). Use null for missing fields.

Text:
${text.slice(0, 3e3)}` }]
    });
    const raw = message.content[0].text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
if (!process.env.VERCEL) {
  (async () => {
    const PORT = parseInt(process.env.PORT || "3000", 10);
    const distPath = path.join(process.cwd(), "dist");
    try {
      const { setGlobalDispatcher, Agent } = await import("undici");
      setGlobalDispatcher(new Agent({ keepAliveTimeout: 1e3, keepAliveMaxTimeout: 1e3, connect: { timeout: 1e4 } }));
      console.log("[net] undici keep-alive minimized (fresh Neon connections)");
    } catch (e) {
      console.warn("[net] undici dispatcher config skipped:", e.message);
    }
    try {
      const dbUrl = process.env.DATABASE_URL;
      console.log("[db] DATABASE_URL:", dbUrl ? dbUrl.slice(0, 30) + "..." : "NOT FOUND");
      if (!dbUrl) throw new Error("DATABASE_URL not set");
      const adapterMod = await import("@prisma/adapter-neon");
      const adapter = new adapterMod.PrismaNeonHTTP(dbUrl);
      prisma = new PrismaClient({ adapter });
      dbAdapter = "neon-http";
      console.log("[db] PrismaNeonHTTP adapter configured");
      warmupNeon();
      ensureAdmins().catch((e) => console.error("[db] ensureAdmins failed:", e.message));
    } catch (e) {
      dbInitError = e.message;
      console.error("[db] init failed, server still starting:", e.message);
    }
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(path.join(distPath, "index.html"));
    });
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`\u2705 Server running on http://localhost:${PORT}`);
      setInterval(async () => {
        if (!prisma || warmingUp) return;
        try {
          await withDbTimeout(prisma.$queryRaw`SELECT 1`, 1e4);
          dbReady = true;
        } catch {
          dbReady = false;
          warmupNeon();
        }
      }, 2 * 60 * 1e3);
    });
  })();
}
export {
  app
};
