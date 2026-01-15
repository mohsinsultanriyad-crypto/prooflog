const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const { connectDB } = require("./src/db");
const workerRoutes = require("./src/routes/worker");
const adminRoutes = require("./src/routes/admin");
const { startCleanupJob } = require("./src/jobs/cleanupPhotos");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,
  credentials: false
}));
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => res.json({ ok: true, name: "ProofLog API" }));

app.use("/api/worker", workerRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    startCleanupJob();
    app.listen(PORT, () => console.log("API running on port", PORT));
  })
  .catch((e) => {
    console.error("DB connection failed:", e);
    process.exit(1);
  });
