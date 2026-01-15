const admin = require("firebase-admin");
const Worker = require("../models/Worker");
const WorkerPay = require("../models/WorkerPay");
const SalaryRule = require("../models/SalaryRule");

function initFirebaseAdmin() {
  if (admin.apps.length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase admin env missing");
  }

  privateKey = privateKey.replace(/\\n/g, "\n");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    })
  });
}

async function workerAuth(req, res, next) {
  try {
    initFirebaseAdmin();

    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing worker token" });

    const decoded = await admin.auth().verifyIdToken(token);
    const phone = decoded.phone_number;
    if (!phone) return res.status(401).json({ error: "Phone missing in token" });

    let worker = await Worker.findOne({ phone });
    if (!worker) {
      worker = await Worker.create({ phone });
      await WorkerPay.create({ workerId: worker._id, basicSalary: 1000 });
      const rulesCount = await SalaryRule.countDocuments();
      if (rulesCount === 0) {
        await SalaryRule.create({
          standardDays: 30,
          standardHoursPerDay: 10,
          otMultiplier: 1.5,
          invalidLeavePenalty: 100,
          prorateBasic: true
        });
      }
    }

    req.worker = worker;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Worker auth failed", detail: e.message });
  }
}

module.exports = { workerAuth };
