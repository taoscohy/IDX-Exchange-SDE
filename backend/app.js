import "dotenv/config";
import express from "express";
import cors from "cors";
import pool from "./db.js";
import propertiesRouter from "./routes/properties.js";

const app = express();

// Register first so validation errors and failed requests are logged too.
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const started = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
    console.log(JSON.stringify({
      method: req.method,
      url: req.originalUrl,
      timestamp,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(3))
    }));
  });
  next();
});

app.use(cors());
app.use(express.json());
app.use("/api/properties", propertiesRouter);

app.get("/", (req, res) => {
  res.send("IDX backend is running");
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

// Express 5 forwards rejected async route promises to this handler.
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status === 400 ? 400 : 500;
  res.status(status).json({
    error: status === 400 ? "Malformed request" : "Internal server error"
  });
});

export default app;
