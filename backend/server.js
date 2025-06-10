import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import organizationRoutes from "./routes/orgRoutes.js";
import departmentRoutes from "./routes/deptRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get("User-Agent") || "No User Agent";

  console.log(`
  [${timestamp}] 
  📡 ${method} ${url} 
  🌐 IP: ${ip} 
  🖥️  User-Agent: ${userAgent}
  `);

  // Log request body (except for file uploads)
  if (req.body && Object.keys(req.body).length > 0 && !req.file) {
    console.log("📦 Request Body:", JSON.stringify(req.body, null, 2));
  }

  // Log query parameters
  if (req.query && Object.keys(req.query).length > 0) {
    console.log("🔍 Query Params:", JSON.stringify(req.query, null, 2));
  }

  next();
});

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Register routes
app.use("/api/organizations", organizationRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/users", userRoutes);

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
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
  Organization API: http://localhost:${PORT}/api
  ===============================================
  `);
});
