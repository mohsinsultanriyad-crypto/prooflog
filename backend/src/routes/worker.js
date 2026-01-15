const express = require("express");
const multer = require("multer");
const dayjs = require("dayjs");
const { workerAuth } = require("../middleware/workerAuth");
const Worker = require("../models/Worker");
const WorkerPay = require("../models/WorkerPay");
const SalaryRule = require("../models/SalaryRule");
const Assignment = require("../models/Assignment");
const Site = require("../models/Site");
const WorkSession = require("../models/WorkSession");
const Leave = require("../models/Leave");
const Photo = require("../models/Photo");
const { isInsideFence } = require("../utils/geo");
const { computeRates, round2 } = require("../utils/salary");
const { cloudinary } = require("./_cloudinary");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function ymd(d = new Date()) {
  return dayjs(d).format("YYYY-MM-DD");
}

async function uploadToCloudinary(buffer, folder) {
  const base64 = buffer.toString("base64");
  const dataUri = `data:image/jpeg;base64,${base64}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image"
  });
  return { url: result.secure_url, publicId: result.public_id };
}

// Get worker profile
router.get("/me", workerAuth, async (req, res) => {
  const w = req.worker;
  const pay = await WorkerPay.findOne({ workerId: w._id });
  res.json({ worker: w, pay });
});

// Update profile (name, trade)
router.post("/profile", workerAuth, async (req, res) => {
  const { name, trade } = req.body;
  const w = req.worker;
  w.name = String(name || "");
  w.trade = String(trade || "");
  await w.save();
  res.json({ ok: true, worker: w });
});

// Upload profile photo (camera only on frontend)
router.post("/profile/photo", workerAuth, upload.single("photo"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "photo missing" });
  const w = req.worker;

  const uploaded = await uploadToCloudinary(req.file.buffer, "prooflog/profile");
  w.profilePhotoUrl = uploaded.url;
  w.profilePhotoPublicId = uploaded.publicId;
  await w.save();

  await Photo.create({
    publicId: uploaded.publicId,
    url: uploaded.url,
    kind: "PROFILE",
    ownerType: "Worker",
    ownerId: String(w._id)
  });

  res.json({ ok: true, url: uploaded.url });
});

// Today assignment
router.get("/today-assignment", workerAuth, async (req, res) => {
  const today = ymd();
  const a = await Assignment.findOne({
    workerId: req.worker._id,
    dutyDate: today,
    status: { $in: ["ASSIGNED", "IN_PROGRESS"] }
  }).populate("siteId");

  if (!a) return res.json({ assignment: null });

  res.json({
    assignment: {
      _id: a._id,
      dutyDate: a.dutyDate,
      notes: a.notes,
      status: a.status,
      site: a.siteId
    }
  });
});

// Start work (GPS only here => low battery)
router.post("/work/start", workerAuth, async (req, res) => {
  const { assignmentId, lat, lng } = req.body;
  if (!assignmentId) return res.status(400).json({ error: "assignmentId missing" });
  if (typeof lat !== "number" || typeof lng !== "number") return res.status(400).json({ error: "lat/lng required" });

  const a = await Assignment.findById(assignmentId);
  if (!a) return res.status(404).json({ error: "assignment not found" });
  if (String(a.workerId) !== String(req.worker._id)) return res.status(403).json({ error: "not your assignment" });

  const site = await Site.findById(a.siteId);
  if (!site) return res.status(404).json({ error: "site missing" });

  const inside = isInsideFence(site, lat, lng);
  if (!inside.ok) {
    return res.status(400).json({
      error: "OUTSIDE_FENCE",
      message: "You are outside the site radius.",
      distanceMeters: inside.distanceMeters,
      radiusMeters: site.radiusMeters
    });
  }

  // prevent multiple active sessions
  const existing = await WorkSession.findOne({
    workerId: req.worker._id,
    status: "STARTED",
    endAt: { $exists: false }
  });
  if (existing) return res.status(400).json({ error: "Already started a session" });

  const s = await WorkSession.create({
    assignmentId: a._id,
    workerId: req.worker._id,
    siteId: site._id,
    startAt: new Date(),
    startLat: lat,
    startLng: lng,
    status: "STARTED"
  });

  a.status = "IN_PROGRESS";
  await a.save();

  res.json({ ok: true, sessionId: s._id });
});

// Upload END proof + End work (final photo mandatory)
router.post("/work/end", workerAuth, upload.single("photo"), async (req, res) => {
  const { sessionId, lat, lng, otHours } = req.body;

  if (!sessionId) return res.status(400).json({ error: "sessionId missing" });
  const s = await WorkSession.findById(sessionId);
  if (!s) return res.status(404).json({ error: "session not found" });
  if (String(s.workerId) !== String(req.worker._id)) return res.status(403).json({ error: "not your session" });
  if (s.status === "ENDED") return res.status(400).json({ error: "already ended" });

  const numLat = Number(lat);
  const numLng = Number(lng);
  if (Number.isNaN(numLat) || Number.isNaN(numLng)) return res.status(400).json({ error: "lat/lng required" });

  const site = await Site.findById(s.siteId);
  const inside = isInsideFence(site, numLat, numLng);

  // Photo mandatory
  if (!req.file) return res.status(400).json({ error: "photo missing (final proof required)" });

  if (!inside.ok) {
    // Allow end only if admin later overrides (GPS inaccurate)
    // Save proof anyway, mark session with pending override
    const uploaded = await uploadToCloudinary(req.file.buffer, "prooflog/work_end");
    s.endProofUrl = uploaded.url;
    s.endProofPublicId = uploaded.publicId;
    s.endAt = new Date();
    s.endLat = numLat;
    s.endLng = numLng;
    s.extraOtHours = Math.max(0, Number(otHours || 0));
    s.status = "ENDED";
    s.overrideEndApproved = false;
    s.overrideNote = `AUTO: ended outside fence (${inside.distanceMeters}m > ${site.radiusMeters}m). Needs admin override.`;
    await s.save();

    await Photo.create({
      publicId: uploaded.publicId,
      url: uploaded.url,
      kind: "WORK_END",
      ownerType: "WorkSession",
      ownerId: String(s._id)
    });

    // mark assignment done
    const a = await Assignment.findById(s.assignmentId);
    if (a) { a.status = "DONE"; await a.save(); }

    return res.status(200).json({
      ok: true,
      ended: true,
      warning: "GPS_INACCURATE_NEEDS_OVERRIDE",
      distanceMeters: inside.distanceMeters,
      radiusMeters: site.radiusMeters
    });
  }

  const uploaded = await uploadToCloudinary(req.file.buffer, "prooflog/work_end");
  s.endProofUrl = uploaded.url;
  s.endProofPublicId = uploaded.publicId;
  s.endAt = new Date();
  s.endLat = numLat;
  s.endLng = numLng;
  s.extraOtHours = Math.max(0, Number(otHours || 0));
  s.status = "ENDED";
  s.overrideEndApproved = true; // inside => approved
  await s.save();

  await Photo.create({
    publicId: uploaded.publicId,
    url: uploaded.url,
    kind: "WORK_END",
    ownerType: "WorkSession",
    ownerId: String(s._id)
  });

  const a = await Assignment.findById(s.assignmentId);
  if (a) { a.status = "DONE"; await a.save(); }

  res.json({ ok: true, ended: true });
});

// Leave submit
router.post("/leave", workerAuth, upload.single("photo"), async (req, res) => {
  const { date, type, reasonText } = req.body;
  const d = String(date || ymd());
  const t = String(type || "").toUpperCase();
  const allowed = ["MEDICAL", "EMERGENCY", "PERSONAL", "SITE_CLOSED"];
  if (!allowed.includes(t)) return res.status(400).json({ error: "Invalid leave type" });

  let proofUrl = "";
  let proofPublicId = "";

  if (req.file) {
    const up = await uploadToCloudinary(req.file.buffer, "prooflog/leave");
    proofUrl = up.url;
    proofPublicId = up.publicId;
  }

  const leave = await Leave.create({
    workerId: req.worker._id,
    date: d,
    type: t,
    reasonText: String(reasonText || ""),
    proofUrl,
    proofPublicId,
    status: "PENDING"
  });

  if (proofPublicId) {
    await Photo.create({
      publicId: proofPublicId,
      url: proofUrl,
      kind: "LEAVE",
      ownerType: "Leave",
      ownerId: String(leave._id)
    });
  }

  res.json({ ok: true, leave });
});

// Month summary (attendance + salary estimate)
router.get("/month-summary", workerAuth, async (req, res) => {
  const month = String(req.query.month || dayjs().format("YYYY-MM")); // YYYY-MM
  const start = dayjs(month + "-01");
  const end = start.add(1, "month");

  const sessions = await WorkSession.find({
    workerId: req.worker._id,
    endAt: { $gte: start.toDate(), $lt: end.toDate() }
  });

  const presentDatesSet = new Set(
    sessions
      .filter(s => s.endAt)
      .map(s => dayjs(s.endAt).format("YYYY-MM-DD"))
  );

  const leaves = await Leave.find({
    workerId: req.worker._id,
    date: { $gte: start.format("YYYY-MM-01"), $lt: end.format("YYYY-MM-01") }
  });

  const approvedInvalid = leaves.filter(l => l.status === "APPROVED" && l.type === "INVALID").length;
  const approvedLeaves = leaves.filter(l => l.status === "APPROVED" && l.type !== "INVALID").length;

  const totalOtHours = sessions.reduce((sum, s) => sum + (Number(s.extraOtHours || 0)), 0);

  const pay = await WorkerPay.findOne({ workerId: req.worker._id });
  const rules = await SalaryRule.findOne();

  const basicSalary = Number(pay?.basicSalary || 1000);
  const { dailyRate, otRate } = computeRates({
    basicSalary,
    standardDays: rules.standardDays,
    standardHoursPerDay: rules.standardHoursPerDay,
    otMultiplier: rules.otMultiplier
  });

  const presentDays = presentDatesSet.size;

  const basicEarned = rules.prorateBasic ? (presentDays * dailyRate) : basicSalary;
  const otPay = totalOtHours * otRate;
  const penalty = approvedInvalid * rules.invalidLeavePenalty;

  res.json({
    ok: true,
    month,
    attendance: {
      presentDays,
      approvedLeaves,
      approvedInvalid
    },
    salary: {
      basicSalary,
      dailyRate: round2(dailyRate),
      otRate: round2(otRate),
      presentDays,
      basicEarned: round2(basicEarned),
      totalOtHours: round2(totalOtHours),
      otPay: round2(otPay),
      penalty,
      totalEstimated: round2(basicEarned + otPay - penalty)
    }
  });
});

module.exports = router;
