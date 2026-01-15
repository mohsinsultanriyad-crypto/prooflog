const admin = require("../firebaseAdmin");
const Worker = require("../models/Worker");

async function workerAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    const decoded = await admin.auth().verifyIdToken(token);
    const phone = decoded.phone_number;

    let worker = await Worker.findOne({ phone });
    if (!worker) worker = await Worker.create({ phone });

    req.worker = worker;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = { workerAuth };