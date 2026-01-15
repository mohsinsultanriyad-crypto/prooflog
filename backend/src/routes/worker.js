const express = require("express");
const multer = require("multer");
const { workerAuth } = require("../middleware/workerAuth");
const Worker = require("../models/Worker");
const Site = require("../models/Site");
const WorkSession = require("../models/WorkSession");
const Leave = require("../models/Leave");
const { haversineMeters } = require("../utils/geo");
const { calcSalary } = require("../utils/salary");
const { cloudinary } = require("../cloudinary");

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// --- PROFILE ---
router.get("/me", workerAuth, async (req, res) => {
  res.json(req.worker);
});

router.put("/me", workerAuth, async (req, res) => {
  const { name, trade, photoUrl } = req.body;
  const w = await Worker.findByIdAndUpdate(
    req.worker._id,
    { name: name ?? req.worker.name, trade: trade ?? req.worker.trade, photoUrl: photoUrl ?? req.worker.photoUrl },
    { new: true }
  );
  res.json(w);
});

// --- ATTENDANCE START ---
router.post("/attendance/start", workerAuth, async (req, res) => {
  const { siteId, lat, lng, accuracy } = req.body;

  const site = await Site.findById(siteId);
  if (!site) return res.status(400).json({ error: "Invalid site" });

  const dist = haversineMeters(lat, lng, site.lat, site.lng);
  const maxAcc = Number(process.env.GPS_MAX_ACCURACY || 80);

  const flags = {
    startOutOfRange: dist > site.radiusMeters,
    lowAccuracy: Number(accuracy) > maxAcc,
  };

  const date = todayISO();

  let session = await WorkSession.findOne({ workerId: req.worker._id, siteId, date });
  if (!session) {
    session = await WorkSession.create({
      workerId: req.worker._id,
      siteId,
      date,
    });
  }

  session.startAt = new Date(); // ✅ server time
  session.startLoc = { lat, lng, accuracy, distanceMeters: dist };
  session.flags.startOutOfRange = flags.startOutOfRange;
  session.flags.lowAccuracy = flags.lowAccuracy;

  await session.save();

  res.json({ ok: true, sessionId: session._id, flags });
});

// --- ATTENDANCE END ---
router.post("/attendance/end", workerAuth, async (req, res) => {
  const { siteId, lat, lng, accuracy } = req.body;

  const site = await Site.findById(siteId);
  if (!site) return res.status(400).json({ error: "Invalid site" });

  const date = todayISO();
  const session = await WorkSession.findOne({ workerId: req.worker._id, siteId, date });
  if (!session?.startAt) return res.status(400).json({ error: "Start first" });

  const dist = haversineMeters(lat, lng, site.lat, site.lng);
  session.endAt = new Date(); // ✅ server time
  session.endLoc = { lat, lng, accuracy, distanceMeters: dist };
  session.flags.endOutOfRange = dist > site.radiusMeters;

  const mins = Math.max(0, Math.round((session.endAt - session.startAt) / 60000));
  session.workedMinutes = mins;
  session.otMinutes = Math.max(0, mins - (10 * 60)); // over 10 hours is OT

  await session.save();

  res.json({ ok: true, workedMinutes: session.workedMinutes, otMinutes: session.otMinutes });
});

// --- PHOTO PROOF (START/END) ---
router.post("/photo/:type", workerAuth, upload.single("photo"), async (req, res) => {
  const { type } = req.params; // start | end
  const { siteId } = req.body;
  const date = todayISO();

  if (!req.file) return res.status(400).json({ error: "No photo" });
  if (type !== "start" && type !== "end") return res.status(400).json({ error: "Invalid type" });

  const session = await WorkSession.findOne({ workerId: req.worker._id, siteId, date });
  if (!session) return res.status(400).json({ error: "No session" });

  const b64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  const uploaded = await cloudinary.uploader.upload(b64, {
    folder: "prooflog",
    resource_type: "image",
  });

  if (type === "start") session.startPhotoUrl = uploaded.secure_url;
  if (type === "end") session.endPhotoUrl = uploaded.secure_url;

  await session.save();
  res.json({ ok: true, url: uploaded.secure_url });
});

// --- LEAVE / ABSENT ---
router.post("/leave", workerAuth, async (req, res) => {
  const { date, type, reason } = req.body;
  const leave = await Leave.create({
    workerId: req.worker._id,
    date: date || todayISO(),
    type,
    reason: reason || "",
    valid: false,
  });
  res.json({ ok: true, leave });
});

// --- SALARY SUMMARY (month) ---
router.get("/salary/summary", workerAuth, async (req, res) => {
  const { month = "" , basicSalary = "1000" } = req.query; // month: "2026-01"
  const bs = Number(basicSalary);

  const q = month ? { date: { $regex: `^${month}` } } : {};
  const sessions = await WorkSession.find({ workerId: req.worker._id, ...q });

  const presentDays = sessions.filter(s => s.startAt && s.endAt).length;
  const otHours = Math.round((sessions.reduce((a,s)=>a+(s.otMinutes||0),0) / 60) * 100) / 100;

  const leaves = await Leave.find({ workerId: req.worker._id, ...(month ? { date: { $regex: `^${month}` } } : {}) });
  const invalidLeaves = leaves.filter(l => l.type === "ABSENT" && l.valid === false).length;

  const result = calcSalary({ basicSalary: bs, presentDays, otHours, invalidLeaves });

  res.json({
    month: month || "ALL",
    basicSalary: bs,
    presentDays,
    otHours,
    invalidLeaves,
    breakdown: result,
  });
});

module.exports = router;