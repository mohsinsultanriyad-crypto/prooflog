const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const dayjs = require("dayjs");

const { adminAuth } = require("../middleware/adminAuth");
const Worker = require("../models/Worker");
const WorkerPay = require("../models/WorkerPay");
const Site = require("../models/Site");
const Assignment = require("../models/Assignment");
const WorkSession = require("../models/WorkSession");
const Leave = require("../models/Leave");
const SalaryRule = require("../models/SalaryRule");
const { computeRates, round2 } = require("../utils/salary");
const { performanceScore } = require("../utils/score");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function ymd(d = new Date()) {
  return dayjs(d).format("YYYY-MM-DD");
}

// Admin login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (String(email || "").toLowerCase() !== String(process.env.ADMIN_EMAIL || "").toLowerCase()) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const ok = await bcrypt.compare(String(password || ""), String(process.env.ADMIN_PASSWORD_HASH || ""));
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ ok: true, token });
});

// Salary rules get/set
router.get("/rules", adminAuth, async (req, res) => {
  let rules = await SalaryRule.findOne();
  if (!rules) rules = await SalaryRule.create({ standardDays: 30, standardHoursPerDay: 10, otMultiplier: 1.5, invalidLeavePenalty: 100, prorateBasic: true });
  res.json({ rules });
});

router.post("/rules", adminAuth, async (req, res) => {
  const { standardDays, standardHoursPerDay, otMultiplier, invalidLeavePenalty, prorateBasic } = req.body;
  let rules = await SalaryRule.findOne();
  if (!rules) rules = await SalaryRule.create({});
  rules.standardDays = Number(standardDays ?? rules.standardDays);
  rules.standardHoursPerDay = Number(standardHoursPerDay ?? rules.standardHoursPerDay);
  rules.otMultiplier = Number(otMultiplier ?? rules.otMultiplier);
  rules.invalidLeavePenalty = Number(invalidLeavePenalty ?? rules.invalidLeavePenalty);
  rules.prorateBasic = Boolean(prorateBasic ?? rules.prorateBasic);
  await rules.save();
  res.json({ ok: true, rules });
});

// Workers list + performance summary
router.get("/workers", adminAuth, async (req, res) => {
  const month = String(req.query.month || dayjs().format("YYYY-MM"));
  const start = dayjs(month + "-01");
  const end = start.add(1, "month");

  const workers = await Worker.find({}).sort({ createdAt: -1 });
  const rules = await SalaryRule.findOne();

  const out = [];
  for (const w of workers) {
    const pay = await WorkerPay.findOne({ workerId: w._id });
    const sessions = await WorkSession.find({ workerId: w._id, endAt: { $gte: start.toDate(), $lt: end.toDate() } });
    const leaves = await Leave.find({ workerId: w._id, date: { $gte: start.format("YYYY-MM-01"), $lt: end.format("YYYY-MM-01") } });

    const presentDates = new Set(sessions.map(s => dayjs(s.endAt).format("YYYY-MM-DD")));
    const presentDays = presentDates.size;

    const jobsCompleted = sessions.length;
    const invalidLeaves = leaves.filter(l => l.status === "APPROVED" && l.type === "INVALID").length;

    const missingProofCount = sessions.filter(s => !s.endProofUrl).length;

    const score = performanceScore({ presentDays, jobsCompleted, invalidLeaves, missingProofCount });

    out.push({
      worker: w,
      pay: { basicSalary: pay?.basicSalary || 1000 },
      performance: { presentDays, jobsCompleted, invalidLeaves, missingProofCount, score }
    });
  }

  res.json({ workers: out, rules });
});

// Update worker salary
router.post("/workers/:id/pay", adminAuth, async (req, res) => {
  const workerId = req.params.id;
  const { basicSalary } = req.body;
  let pay = await WorkerPay.findOne({ workerId });
  if (!pay) pay = await WorkerPay.create({ workerId, basicSalary: 1000 });
  pay.basicSalary = Number(basicSalary || pay.basicSalary);
  await pay.save();
  res.json({ ok: true, pay });
});

// Sites CRUD
router.get("/sites", adminAuth, async (req, res) => {
  const sites = await Site.find({}).sort({ createdAt: -1 });
  res.json({ sites });
});

router.post("/sites", adminAuth, async (req, res) => {
  const { name, city, lat, lng, radiusMeters } = req.body;
  const r = Number(radiusMeters || 150);
  const site = await Site.create({
    name: String(name || ""),
    city: String(city || ""),
    lat: Number(lat),
    lng: Number(lng),
    radiusMeters: Math.min(300, Math.max(150, r))
  });
  res.json({ ok: true, site });
});

router.post("/sites/:id", adminAuth, async (req, res) => {
  const { radiusMeters, name, city, lat, lng } = req.body;
  const site = await Site.findById(req.params.id);
  if (!site) return res.status(404).json({ error: "site not found" });

  if (radiusMeters !== undefined) {
    const r = Number(radiusMeters);
    site.radiusMeters = Math.min(300, Math.max(150, r));
  }
  if (name !== undefined) site.name = String(name);
  if (city !== undefined) site.city = String(city);
  if (lat !== undefined) site.lat = Number(lat);
  if (lng !== undefined) site.lng = Number(lng);

  await site.save();
  res.json({ ok: true, site });
});

// Assignments
router.post("/assign", adminAuth, async (req, res) => {
  const { workerId, siteId, dutyDate, notes } = req.body;
  if (!workerId || !siteId || !dutyDate) return res.status(400).json({ error: "workerId/siteId/dutyDate required" });

  const a = await Assignment.create({
    workerId,
    siteId,
    dutyDate: String(dutyDate),
    notes: String(notes || ""),
    status: "ASSIGNED"
  });

  res.json({ ok: true, assignment: a });
});

router.get("/assignments", adminAuth, async (req, res) => {
  const dutyDate = String(req.query.dutyDate || ymd());
  const list = await Assignment.find({ dutyDate }).populate("workerId").populate("siteId");
  res.json({ assignments: list });
});

// Live status (Working/Assigned/Idle/Absent)
router.get("/live", adminAuth, async (req, res) => {
  const today = ymd();

  const workers = await Worker.find({});
  const assignments = await Assignment.find({ dutyDate: today }).populate("siteId");
  const sessions = await WorkSession.find({
    startAt: { $gte: dayjs(today).toDate(), $lt: dayjs(today).add(1, "day").toDate() }
  });
  const leaves = await Leave.find({ date: today, status: "APPROVED" });

  const mapAssign = new Map();
  for (const a of assignments) mapAssign.set(String(a.workerId), a);

  const mapLeave = new Map();
  for (const l of leaves) mapLeave.set(String(l.workerId), l);

  const mapActiveSession = new Map();
  for (const s of sessions) {
    if (s.status === "STARTED") mapActiveSession.set(String(s.workerId), s);
  }

  const result = workers.map(w => {
    const leave = mapLeave.get(String(w._id));
    if (leave) return { worker: w, status: "ABSENT", detail: leave.type };

    const active = mapActiveSession.get(String(w._id));
    if (active) return { worker: w, status: "WORKING", sessionId: active._id };

    const a = mapAssign.get(String(w._id));
    if (a) {
      if (a.status === "ASSIGNED") return { worker: w, status: "ASSIGNED", site: a.siteId, notes: a.notes, assignmentId: a._id };
      if (a.status === "DONE") return { worker: w, status: "IDLE", detail: "DONE_WAITING_NEW_ASSIGNMENT" };
    }

    return { worker: w, status: "IDLE", detail: "NO_ASSIGNMENT" };
  });

  res.json({ today, result });
});

// Leaves approvals
router.get("/leaves", adminAuth, async (req, res) => {
  const status = String(req.query.status || "PENDING");
  const list = await Leave.find({ status }).populate("workerId").sort({ createdAt: -1 });
  res.json({ leaves: list });
});

router.post("/leaves/:id/approve", adminAuth, async (req, res) => {
  const l = await Leave.findById(req.params.id);
  if (!l) return res.status(404).json({ error: "leave not found" });
  l.status = "APPROVED";
  await l.save();
  res.json({ ok: true, leave: l });
});

router.post("/leaves/:id/reject", adminAuth, async (req, res) => {
  const l = await Leave.findById(req.params.id);
  if (!l) return res.status(404).json({ error: "leave not found" });
  l.status = "REJECTED";
  await l.save();
  res.json({ ok: true, leave: l });
});

// Mark invalid leave (create or update)
router.post("/invalid-leave", adminAuth, async (req, res) => {
  const { workerId, date, reasonText } = req.body;
  if (!workerId || !date) return res.status(400).json({ error: "workerId/date required" });

  let l = await Leave.findOne({ workerId, date: String(date) });
  if (!l) {
    l = await Leave.create({ workerId, date: String(date), type: "INVALID", reasonText: String(reasonText || "No info / invalid"), status: "APPROVED" });
  } else {
    l.type = "INVALID";
    l.status = "APPROVED";
    if (reasonText) l.reasonText = String(reasonText);
    await l.save();
  }
  res.json({ ok: true, leave: l });
});

// Sessions list + manual override (GPS inaccurate)
router.get("/sessions", adminAuth, async (req, res) => {
  const dutyDate = String(req.query.dutyDate || ymd());
  const start = dayjs(dutyDate).toDate();
  const end = dayjs(dutyDate).add(1, "day").toDate();

  const list = await WorkSession.find({ startAt: { $gte: start, $lt: end } })
    .populate("workerId")
    .populate("siteId")
    .populate("assignmentId")
    .sort({ startAt: -1 });

  res.json({ sessions: list });
});

router.post("/sessions/:id/override", adminAuth, async (req, res) => {
  const { approveStart, approveEnd, note } = req.body;
  const s = await WorkSession.findById(req.params.id);
  if (!s) return res.status(404).json({ error: "session not found" });

  if (approveStart !== undefined) s.overrideStartApproved = Boolean(approveStart);
  if (approveEnd !== undefined) s.overrideEndApproved = Boolean(approveEnd);
  if (note !== undefined) s.overrideNote = String(note || "");

  await s.save();
  res.json({ ok: true, session: s });
});

// Salary sheet (month)
router.get("/salary-sheet", adminAuth, async (req, res) => {
  const month = String(req.query.month || dayjs().format("YYYY-MM"));
  const start = dayjs(month + "-01");
  const end = start.add(1, "month");

  const rules = await SalaryRule.findOne();
  const workers = await Worker.find({});

  const sheet = [];
  for (const w of workers) {
    const pay = await WorkerPay.findOne({ workerId: w._id });
    const basicSalary = Number(pay?.basicSalary || 1000);

    const sessions = await WorkSession.find({
      workerId: w._id,
      endAt: { $gte: start.toDate(), $lt: end.toDate() }
    });

    const leaves = await Leave.find({
      workerId: w._id,
      date: { $gte: start.format("YYYY-MM-01"), $lt: end.format("YYYY-MM-01") }
    });

    const presentDates = new Set(sessions.map(s => dayjs(s.endAt).format("YYYY-MM-DD")));
    const presentDays = presentDates.size;

    const totalOtHours = sessions.reduce((sum, s) => sum + Number(s.extraOtHours || 0), 0);
    const invalidLeaves = leaves.filter(l => l.status === "APPROVED" && l.type === "INVALID").length;

    const { dailyRate, otRate } = computeRates({
      basicSalary,
      standardDays: rules.standardDays,
      standardHoursPerDay: rules.standardHoursPerDay,
      otMultiplier: rules.otMultiplier
    });

    const basicEarned = rules.prorateBasic ? (presentDays * dailyRate) : basicSalary;
    const otPay = totalOtHours * otRate;
    const penalty = invalidLeaves * rules.invalidLeavePenalty;
    const total = basicEarned + otPay - penalty;

    sheet.push({
      workerId: w._id,
      name: w.name,
      phone: w.phone,
      trade: w.trade,
      basicSalary,
      presentDays,
      dailyRate: round2(dailyRate),
      totalOtHours: round2(totalOtHours),
      otRate: round2(otRate),
      otPay: round2(otPay),
      invalidLeaves,
      penalty,
      total: round2(total)
    });
  }

  res.json({ month, rules, sheet });
});

module.exports = router;
