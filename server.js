// server.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import Anthropic from "@anthropic-ai/sdk";
import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cors from "cors";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var prisma = new PrismaClient();
var JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_here";
var FIXED_EMAILS = [
  "karya.ai.admin@gmail.com",
  "avinashmurari3@gmail.com",
  "karya.secret.admin@gmail.com",
  "mkarthikeya24@gmail.com",
  "kbsn1170@gmail.com"
];
var anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});
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
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  } catch (e) {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});
app.post("/api/auth/register", async (req, res) => {
  const { email, password, displayName, role } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });
    if (role === "admin" || role === "employee") {
      return res.status(403).json({ error: "Cannot register as admin or employee directly." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const uid = "usr_" + Math.random().toString(36).substring(2, 11);
    const userRole = "client";
    const isApproved = false;
    const user = await prisma.user.create({
      data: {
        uid,
        email: email.toLowerCase(),
        displayName,
        role: userRole,
        isApproved,
        passwordHash: hashedPassword
      }
    });
    if (userRole === "client") {
      const nameParts = displayName?.trim().split(/\s+/) || [];
      const firstName = nameParts.slice(0, -1).join(" ") || nameParts[0] || "";
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
      await prisma.client.create({
        data: {
          uid,
          status: "pending_approval",
          applicationData: { firstName, lastName }
        }
      });
    }
    const token = jwt.sign({ uid: user.uid, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign({ uid: user.uid, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { uid: req.user.uid } });
    if (!user) return res.status(404).json({ error: "User not found" });
    let clientProfile = null;
    if (user.role === "client") {
      clientProfile = await prisma.client.findUnique({ where: { uid: user.uid } });
    }
    res.json({ user, clientProfile });
  } catch (error) {
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
    const clients = await prisma.client.findMany({ where: filter, include: { jobs: true } });
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
    const client = await prisma.client.findUnique({ where: { uid: req.params.clientId } });
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }
    const jobs = await prisma.clientJob.findMany({ where: { clientId: client.id } });
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
app.post("/api/admin/create-user", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "employee") return res.status(403).json({ error: "Forbidden" });
  const { email, displayName, role, password } = req.body;
  if (role === "admin") {
    return res.status(403).json({ error: "Admin accounts cannot be created dynamically." });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const uid = "pre_" + Math.random().toString(36).substring(2, 11);
    const user = await prisma.user.create({
      data: {
        uid,
        email: email.toLowerCase(),
        displayName,
        role,
        isApproved: true,
        passwordHash: hashedPassword
      }
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
    const hashedPassword = await bcrypt.hash(finalPassword, 10);
    const user = await prisma.user.create({
      data: {
        uid: newUid,
        email: email.toLowerCase(),
        displayName,
        role: "employee",
        isApproved: true,
        passwordHash: hashedPassword
      }
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
      where: {
        OR: [
          { uid: req.params.uid },
          { id: req.params.uid }
        ]
      }
    });
    if (userToDelete && FIXED_EMAILS.includes(userToDelete.email.toLowerCase())) {
      return res.status(403).json({ error: "Cannot delete a fixed system user." });
    }
    const client = await prisma.client.findFirst({
      where: {
        OR: [
          { uid: req.params.uid },
          { id: req.params.uid }
        ]
      }
    });
    if (!client && !userToDelete) {
      return res.status(404).json({ error: "Candidate not found" });
    }
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
      messages: [{
        role: "user",
        content: `Extract the job details from the text below. Reply with ONLY a JSON object with keys: company, title, location. If a field is not found, use null.

Text:
${text}`
      }]
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
      messages: [{
        role: "user",
        content: `Extract structured job details from the text below. Reply with ONLY a JSON object with keys: company, title, location, salary, skills (array of strings), summary (one sentence). Use null for missing fields.

Text:
${text.slice(0, 3e3)}`
      }]
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
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
    }
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })();
}
export {
  app
};
