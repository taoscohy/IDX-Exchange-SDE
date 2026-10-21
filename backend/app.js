import "dotenv/config";
import express from "express";
import cors from "cors";
import pool from "./db.js";
import propertiesRouter from "./routes/properties.js";

const app = express();

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

export default app;