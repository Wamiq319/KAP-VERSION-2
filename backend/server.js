import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import organizationRoutes from "./routes/orgRoutes.js";
import departmentRoutes from "./routes/deptRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import tktRoutes from "./routes/tktRoutes.js";
import { testCloudinaryConfig } from "./utils/uploadCloudinary.js";
dotenv.config();

const app = express();

// Environment variables for logging
const ENV = process.env.NODE_ENV || "development";
const DEBUG = ENV === "development";
const LOG_PREFIX = "[API]";

// Basic middleware first
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN?.split(",");
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Request logging middleware (moved after body parsing)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;

  // Create a log object with only essential information
  const logData = {
    endpoint: url,
    method,
    params: req.params,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    body:
      req.body && Object.keys(req.body).length > 0 && !req.file
        ? req.body
        : undefined,
  };

  // Log based on environment
  if (DEBUG) {
    console.log(`
${LOG_PREFIX} ===============================================
📡 ${method} ${url}
⏰ ${timestamp}
🌐 IP: ${ip}
${
  logData.params && Object.keys(logData.params).length > 0
    ? `📌 Params: ${JSON.stringify(logData.params, null, 2)}`
    : ""
}
${logData.query ? `🔍 Query: ${JSON.stringify(logData.query, null, 2)}` : ""}
${logData.body ? `📦 Body: ${JSON.stringify(logData.body, null, 2)}` : ""}
===============================================
`);
  } else {
    // Production logging - minimal endpoint info
    console.log(`${LOG_PREFIX} ${method} ${url}`);
  }

  next();
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Test Cloudinary configuration
if (!testCloudinaryConfig()) {
  console.error(
    "Cloudinary configuration is incomplete. Please check your .env file."
  );
}

// Register routes
app.use("/api/organizations", organizationRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tickets", tktRoutes);

// Enhanced error handler
app.use((err, req, res, next) => {
  const errorLog = {
    endpoint: req.originalUrl,
    method: req.method,
    error: {
      message: err.message,
      stack: DEBUG ? err.stack : undefined,
    },
  };

  if (DEBUG) {
    console.error(`
${LOG_PREFIX} ===============================================
❌ Error in ${errorLog.method} ${errorLog.endpoint}
💥 Error: ${errorLog.error.message}
${errorLog.error.stack ? `📚 Stack: ${errorLog.error.stack}` : ""}
===============================================
`);
  } else {
    console.error(
      `${LOG_PREFIX} Error in ${errorLog.method} ${errorLog.endpoint} - ${errorLog.error.message}`
    );
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ===============================================
  🚀 Server running on port ${PORT}
  🌍 Environment: ${ENV}
  Organization API: http://localhost:${PORT}/api
  ===============================================
  `);
});
