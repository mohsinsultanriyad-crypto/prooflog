const cron = require("node-cron");
const dayjs = require("dayjs");
const Photo = require("../models/Photo");
const WorkSession = require("../models/WorkSession");
const Leave = require("../models/Leave");
const Worker = require("../models/Worker");
const { cloudinary } = require("../routes/_cloudinary");

async function cleanupOldPhotos() {
  const retention = Number(process.env.PHOTO_RETENTION_DAYS || 35);
  const cutoff = dayjs().subtract(retention, "day").toDate();

  const old = await Photo.find({ createdAt: { $lt: cutoff } }).limit(200);
  if (!old.length) return;

  for (const p of old) {
    try {
      // Delete from Cloudinary
      await cloudinary.uploader.destroy(p.publicId, { invalidate: true });

      // Remove references in DB
      if (p.ownerType === "WorkSession") {
        const s = await WorkSession.findById(p.ownerId);
        if (s) {
          if (s.startProofPublicId === p.publicId) {
            s.startProofPublicId = "";
            s.startProofUrl = "";
          }
          if (s.endProofPublicId === p.publicId) {
            s.endProofPublicId = "";
            s.endProofUrl = "";
          }
          await s.save();
        }
      } else if (p.ownerType === "Leave") {
        const l = await Leave.findById(p.ownerId);
        if (l && l.proofPublicId === p.publicId) {
          l.proofPublicId = "";
          l.proofUrl = "";
          await l.save();
        }
      } else if (p.ownerType === "Worker") {
        const w = await Worker.findById(p.ownerId);
        if (w && w.profilePhotoPublicId === p.publicId) {
          w.profilePhotoPublicId = "";
          w.profilePhotoUrl = "";
          await w.save();
        }
      }

      await Photo.deleteOne({ _id: p._id });
    } catch (e) {
      // keep it; try next run
      console.error("cleanup photo failed", p.publicId, e.message);
    }
  }
}

function startCleanupJob() {
  // Run daily at 03:10 server time
  cron.schedule("10 3 * * *", () => cleanupOldPhotos().catch(console.error));
  // Also run once at boot
  cleanupOldPhotos().catch(console.error);
}

module.exports = { startCleanupJob };
