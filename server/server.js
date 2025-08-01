/**
 * Meeting Room Management Server
 * Enhanced for Multi-Environment Deployment (Local, Private Cloud)
 */

// ####################
// Multi-Environment Configuration Loading
// ####################
const path = require("path");
const fs = require("fs");

// Determine environment and load appropriate config
const NODE_ENV = process.env.NODE_ENV || "development";
const envFiles = [
  `.env.${NODE_ENV}.local`,
  `.env.${NODE_ENV}`,
  `.env.local`,
  `.env`,
];

// Load the first existing environment file
let envFileLoaded = false;
for (const envFile of envFiles) {
  const envPath = path.join(__dirname, envFile);
  if (fs.existsSync(envPath)) {
    require("dotenv").config({ path: envPath });
    console.log(`Environment loaded from: ${envFile}`);
    envFileLoaded = true;
    break;
  }
}

if (!envFileLoaded) {
  require("dotenv").config();
  console.log("Using default environment configuration");
}

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const fsExtra = require("fs-extra");
const rateLimit = require("express-rate-limit");

const app = express();

// ####################
// Environment Configuration with Cross-Platform Support
// ####################
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const TRUST_PROXY = process.env.TRUST_PROXY === "true";

// Environment-specific configurations
const ENV_CONFIG = {
  development: {
    logLevel: "dev",
    rateLimit: 5000,
    cacheMaxAge: 300,
    debugMode: true,
    strictCors: false,
  },
  production: {
    logLevel: process.env.LOG_LEVEL || "combined",
    rateLimit: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
    cacheMaxAge: parseInt(process.env.CACHE_CONTROL_MAX_AGE) || 3600,
    debugMode: process.env.DEBUG_MODE === "true",
    strictCors: true,
  },
  test: {
    logLevel: "short",
    rateLimit: 10000,
    cacheMaxAge: 0,
    debugMode: true,
    strictCors: false,
  },
};

const currentConfig = ENV_CONFIG[NODE_ENV] || ENV_CONFIG.development;

console.log(`Current environment: ${NODE_ENV}`);
console.log(`Configuration loaded:`, currentConfig);

// Configure trust proxy for cloud deployment
if (TRUST_PROXY) {
  app.set("trust proxy", 1);
}

// ####################
// Data Directory Configuration with Cross-Platform Support
// ####################
const DATA_DIR = (() => {
  const configuredDir = process.env.DATA_DIR;

  if (!configuredDir) {
    // Default to local data directory
    return path.join(__dirname, "data");
  }

  // Handle relative paths
  if (!path.isAbsolute(configuredDir)) {
    return path.resolve(__dirname, configuredDir);
  }

  // Use absolute path as-is
  return configuredDir;
})();

const MEETINGS_FILE = path.join(DATA_DIR, "meetings.json");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const BACKGROUNDS_DIR = path.join(DATA_DIR, "backgrounds");
const BACKGROUNDS_CONFIG = path.join(DATA_DIR, "backgrounds.json");

console.log(`Data directory resolved to: ${DATA_DIR}`);

// Ensure data directories exist with proper error handling
try {
  fsExtra.ensureDirSync(DATA_DIR);
  fsExtra.ensureDirSync(BACKUP_DIR);
  fsExtra.ensureDirSync(BACKGROUNDS_DIR);
  console.log("Data directories initialized successfully");
} catch (error) {
  console.error("Failed to initialize data directories:", error);
  process.exit(1);
}

// Initialize meetings file if it doesn't exist
if (!fs.existsSync(MEETINGS_FILE)) {
  fs.writeFileSync(MEETINGS_FILE, JSON.stringify([]));
} else {
  // Create initial backup on server startup to ensure backup directory is functional
  createInitialBackup();
}

// Initialize backgrounds config if it doesn't exist
if (!fs.existsSync(BACKGROUNDS_CONFIG)) {
  fs.writeFileSync(
    BACKGROUNDS_CONFIG,
    JSON.stringify({
      mainBackground: null,
      scheduleBackground: null,
    })
  );
}

// ####################
// Multi-Environment CORS Configuration
// ####################
const getAllowedOrigins = () => {
  const origins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((url) => url.trim())
    : ["http://localhost:3000", "http://127.0.0.1:3000"];

  // Environment-specific origins
  if (NODE_ENV === "development" || NODE_ENV === "test") {
    // Add development and local network origins
    const devOrigins = [
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "http://192.168.1.47:3000",
      "http://192.168.1.99:3000",
    ];
    origins.push(...devOrigins);
  }

  if (currentConfig.debugMode) {
    console.log("Allowed CORS origins:", origins);
  }

  return origins;
};

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = getAllowedOrigins();

    if (allowedOrigins.indexOf(origin) !== -1 || !currentConfig.strictCors) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cache-Control",
    "Pragma",
    "Expires",
    "X-Requested-With",
  ],
  credentials: true,
  maxAge: NODE_ENV === "production" ? 3600 : 60,
};

// ####################
// Environment-Aware Rate Limiting
// ####################
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: currentConfig.rateLimit,
  message: {
    success: false,
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for local development
    if (NODE_ENV === "development" && req.ip === "127.0.0.1") {
      return true;
    }
    return false;
  },
});

// Apply rate limiting to API routes only
app.use("/api", limiter);

// ####################
// Environment-Aware Middleware Configuration
// ####################
app.use(cors(corsOptions));

// Increase payload size limit for image uploads
const maxUploadSize = process.env.MAX_UPLOAD_SIZE || "50mb";
app.use(express.json({ limit: maxUploadSize }));
app.use(express.urlencoded({ limit: maxUploadSize, extended: true }));

// Environment-specific logging
app.use(morgan(currentConfig.logLevel));

// ####################
// Environment-Aware Caching and Security Headers
// ####################
app.use((req, res, next) => {
  // Prevent caching for API responses to ensure fresh data
  if (req.path.startsWith("/api/")) {
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
  } else {
    // Cache static files based on environment
    res.set("Cache-Control", `public, max-age=${currentConfig.cacheMaxAge}`);
  }
  next();
});

// Environment-specific security headers
if (NODE_ENV === "production") {
  app.use((req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("X-Frame-Options", "SAMEORIGIN");
    res.set("X-XSS-Protection", "1; mode=block");
    res.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
  });
}

// Serve static files from the parent directory
app.use(express.static(path.join(__dirname, "..")));

// API endpoints

/**
 * Get all meetings
 */
app.get("/api/meetings", (req, res) => {
  try {
    const meetings = JSON.parse(fs.readFileSync(MEETINGS_FILE, "utf8"));
    res.json(meetings);
  } catch (error) {
    console.error("Error reading meetings:", error);
    res.status(500).json({ error: "Failed to read meetings data" });
  }
});

/**
 * Get meeting by ID
 */
app.get("/api/meetings/:id", (req, res) => {
  try {
    const meetings = JSON.parse(fs.readFileSync(MEETINGS_FILE, "utf8"));
    const meeting = meetings.find((m) => m.id === req.params.id);

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    res.json(meeting);
  } catch (error) {
    console.error("Error finding meeting:", error);
    res.status(500).json({ error: "Failed to read meeting data" });
  }
});

/**
 * Create a new meeting
 */
app.post("/api/meetings", (req, res) => {
  try {
    // Read existing meetings
    const meetings = JSON.parse(fs.readFileSync(MEETINGS_FILE, "utf8"));

    // Add new meeting
    const newMeeting = {
      ...req.body,
      id:
        req.body.id ||
        `meeting_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      createdAt: req.body.createdAt || new Date().toISOString(),
    };

    meetings.push(newMeeting);

    // Create backup before writing
    createBackup();

    // Save updated meetings
    fs.writeFileSync(MEETINGS_FILE, JSON.stringify(meetings, null, 2));

    res.status(201).json(newMeeting);
  } catch (error) {
    console.error("Error creating meeting:", error);
    res.status(500).json({ error: "Failed to create meeting" });
  }
});

/**
 * Update a meeting
 */
app.put("/api/meetings/:id", (req, res) => {
  try {
    const meetingId = req.params.id;
    const updateData = req.body;

    console.log(`Updating meeting ${meetingId}:`, updateData);

    // Read existing meetings
    const meetings = JSON.parse(fs.readFileSync(MEETINGS_FILE, "utf8"));

    // Find meeting index
    const index = meetings.findIndex((m) => m.id === meetingId);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: "Meeting not found",
      });
    }

    // Create backup before updating
    createBackup();

    // Preserve original creation data and update
    const originalMeeting = meetings[index];
    const updatedMeeting = {
      ...originalMeeting,
      ...updateData,
      id: meetingId, // Ensure ID doesn't change
      createdAt: originalMeeting.createdAt, // Preserve creation time
      updatedAt: new Date().toISOString(), // Add update timestamp
    };

    // Update meeting in array
    meetings[index] = updatedMeeting;

    // Save updated meetings
    fs.writeFileSync(MEETINGS_FILE, JSON.stringify(meetings, null, 2));

    console.log(`Meeting ${meetingId} updated successfully`);

    res.json({
      success: true,
      meeting: updatedMeeting,
      message: "Meeting updated successfully",
    });
  } catch (error) {
    console.error("Error updating meeting:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update meeting",
      message: error.message,
    });
  }
});

/**
 * Delete a meeting
 */
app.delete("/api/meetings/:id", (req, res) => {
  try {
    // Read existing meetings
    const meetings = JSON.parse(fs.readFileSync(MEETINGS_FILE, "utf8"));

    // Find meeting index
    const index = meetings.findIndex((m) => m.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    // Create backup before deleting
    createBackup();

    // Remove meeting
    const removedMeeting = meetings.splice(index, 1)[0];

    // Save updated meetings
    fs.writeFileSync(MEETINGS_FILE, JSON.stringify(meetings, null, 2));

    res.json(removedMeeting);
  } catch (error) {
    console.error("Error deleting meeting:", error);
    res.status(500).json({ error: "Failed to delete meeting" });
  }
});

/**
 * Update multiple meetings (batch update)
 */
app.post("/api/meetings/batch", (req, res) => {
  try {
    // Validate request body
    if (!Array.isArray(req.body)) {
      return res
        .status(400)
        .json({ error: "Request body must be an array of meetings" });
    }

    console.log(`Batch update received: ${req.body.length} meetings`);

    // Create backup before batch update
    createBackup();

    // Save meetings data
    fs.writeFileSync(MEETINGS_FILE, JSON.stringify(req.body, null, 2));

    // Log success
    console.log(
      `Meetings batch update successful. Saved ${req.body.length} meetings.`
    );

    res.json({ success: true, count: req.body.length });
  } catch (error) {
    console.error("Error batch updating meetings:", error);
    res.status(500).json({ error: "Failed to update meetings" });
  }
});

/**
 * Create initial backup on server startup
 */
function createInitialBackup() {
  try {
    if (fs.existsSync(MEETINGS_FILE)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFile = path.join(
        BACKUP_DIR,
        `meetings-startup-${timestamp}.json`
      );

      // Ensure backup directory exists
      fsExtra.ensureDirSync(BACKUP_DIR);

      // Create startup backup
      fsExtra.copySync(MEETINGS_FILE, backupFile);

      console.log(`Startup backup created: ${backupFile}`);

      // Clean up old backups
      cleanupBackups();

      return backupFile;
    }
  } catch (error) {
    console.error("Failed to create startup backup:", error);
  }
}

/**
 * Create a backup of meetings data with enhanced error handling
 */
function createBackup() {
  try {
    if (fs.existsSync(MEETINGS_FILE)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFile = path.join(BACKUP_DIR, `meetings-${timestamp}.json`);

      // Ensure backup directory exists
      fsExtra.ensureDirSync(BACKUP_DIR);

      // Create backup
      fsExtra.copySync(MEETINGS_FILE, backupFile);

      console.log(`Backup created: ${backupFile}`);

      // Clean up old backups (keep only last configured amount)
      cleanupBackups();

      return backupFile;
    }
  } catch (error) {
    console.error("Failed to create backup:", error);
    // Don't throw error - backup failure shouldn't stop the operation
  }
}

/**
 * Enhanced cleanup function with better error handling
 */
function cleanupBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return;
    }

    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((file) => file.endsWith(".json") && file.startsWith("meetings-"))
      .map((file) => {
        const filePath = path.join(BACKUP_DIR, file);
        return {
          name: file,
          path: filePath,
          time: fs.statSync(filePath).mtime.getTime(),
        };
      })
      .sort((a, b) => b.time - a.time); // Sort by time (newest first)

    // Keep only the most recent backups (configurable via env)
    const maxBackups = parseInt(process.env.MAX_BACKUPS) || 10;

    if (files.length > maxBackups) {
      const filesToDelete = files.slice(maxBackups);

      filesToDelete.forEach((file) => {
        try {
          fs.unlinkSync(file.path);
          console.log(`Deleted old backup: ${file.name}`);
        } catch (deleteError) {
          console.error(`Failed to delete backup ${file.name}:`, deleteError);
        }
      });

      console.log(`Cleaned up ${filesToDelete.length} old backups`);
    }
  } catch (error) {
    console.error("Error cleaning up backups:", error);
  }
}

// ========== BACKGROUND MANAGEMENT ENDPOINTS ==========

/**
 * Enhanced background upload with better validation and error handling
 */
app.post("/api/backgrounds/upload", (req, res) => {
  try {
    const { type, imageData } = req.body;

    // Validation
    if (!type || !imageData) {
      return res.status(400).json({
        success: false,
        error: "Missing type or imageData",
      });
    }

    if (!["main", "schedule"].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid type. Must be 'main' or 'schedule'",
      });
    }

    // Enhanced image validation
    const imageTypeMatch = imageData.match(
      /^data:image\/(jpeg|jpg|png|gif|webp);base64,/
    );
    if (!imageTypeMatch) {
      return res.status(400).json({
        success: false,
        error: "Invalid image format. Supported: JPEG, PNG, GIF, WebP",
      });
    }

    const imageType = imageTypeMatch[1];

    // Size validation
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const base64Size = base64Data.length * 0.75;
    const maxSize = parseInt(process.env.MAX_UPLOAD_SIZE) || 15 * 1024 * 1024; // 15MB default

    if (base64Size > maxSize) {
      return res.status(413).json({
        success: false,
        error: `Image too large. Maximum size is ${Math.round(
          maxSize / 1024 / 1024
        )}MB`,
      });
    }

    // Ensure backgrounds directory exists
    fsExtra.ensureDirSync(BACKGROUNDS_DIR);

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");

    // Generate secure filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${type}-background-${timestamp}.${
      imageType === "jpg" ? "jpg" : imageType
    }`;
    const filepath = path.join(BACKGROUNDS_DIR, filename);

    // Delete old background file if exists
    const config = JSON.parse(fs.readFileSync(BACKGROUNDS_CONFIG, "utf8"));
    const oldBackground = config[`${type}Background`];
    if (oldBackground) {
      const oldFilepath = path.join(BACKGROUNDS_DIR, oldBackground);
      if (fs.existsSync(oldFilepath)) {
        try {
          fs.unlinkSync(oldFilepath);
          console.log(`Deleted old background: ${oldBackground}`);
        } catch (deleteError) {
          console.warn(
            `Failed to delete old background: ${deleteError.message}`
          );
        }
      }
    }

    // Save new image file
    fs.writeFileSync(filepath, buffer);

    // Update backgrounds config
    config[`${type}Background`] = filename;
    fs.writeFileSync(BACKGROUNDS_CONFIG, JSON.stringify(config, null, 2));

    console.log(
      `Background uploaded: ${type} -> ${filename} (${Math.round(
        base64Size / 1024
      )}KB)`
    );

    res.json({
      success: true,
      filename,
      size: Math.round(base64Size / 1024),
      message: `${type} background uploaded successfully`,
    });
  } catch (error) {
    console.error("Error uploading background:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload background",
    });
  }
});

/**
 * Get current background configuration
 * GET /api/backgrounds
 */
app.get("/api/backgrounds", (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(BACKGROUNDS_CONFIG, "utf8"));
    res.json({ success: true, backgrounds: config });
  } catch (error) {
    console.error("Error getting backgrounds:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get backgrounds",
    });
  }
});

/**
 * Get background image file
 * GET /api/backgrounds/:filename
 */
app.get("/api/backgrounds/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(BACKGROUNDS_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        error: "Background file not found",
      });
    }

    res.sendFile(filepath);
  } catch (error) {
    console.error("Error serving background:", error);
    res.status(500).json({
      success: false,
      error: "Failed to serve background",
    });
  }
});

/**
 * Reset background
 * DELETE /api/backgrounds/:type
 */
app.delete("/api/backgrounds/:type", (req, res) => {
  try {
    const type = req.params.type;

    if (!["main", "schedule"].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid type. Must be 'main' or 'schedule'",
      });
    }

    // Update backgrounds config
    const config = JSON.parse(fs.readFileSync(BACKGROUNDS_CONFIG, "utf8"));
    config[`${type}Background`] = null;
    fs.writeFileSync(BACKGROUNDS_CONFIG, JSON.stringify(config, null, 2));

    console.log(`Background reset: ${type}`);

    res.json({
      success: true,
      message: `${type} background reset successfully`,
    });
  } catch (error) {
    console.error("Error resetting background:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset background",
    });
  }
});

// Get server IP addresses for easier network access
function getServerIPs() {
  const networkInterfaces = require("os").networkInterfaces();
  const addresses = [];

  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      // Skip internal and non-IPv4 addresses
      if (!iface.internal && iface.family === "IPv4") {
        addresses.push(iface.address);
      }
    }
  }

  return addresses;
}

// Global error handler for API routes
app.use("/api", (error, req, res, next) => {
  console.error("API Error:", error);

  // Always return JSON for API errors
  if (error.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      error: "Request payload too large. Please reduce image size.",
    });
  }

  res.status(500).json({
    success: false,
    error: error.message || "Internal server error",
  });
});

/**
 * Enhanced server startup with environment validation and logging
 */

// Validate critical environment variables
const requiredEnvVars = ["NODE_ENV"];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn(
    `Warning: Missing environment variables: ${missingVars.join(", ")}`
  );
  console.warn(
    "Some features may not work correctly. Please check your .env file."
  );
}

// Enhanced server startup with graceful shutdown handling
const server = app.listen(PORT, HOST, () => {
  const serverIPs = getServerIPs();

  console.log("\n####################");
  console.log("Meeting Room Management Server");
  console.log("####################");
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Server running on: http://${HOST}:${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
  console.log(`CORS origins: ${getAllowedOrigins()}`);
  console.log(`Rate limiting: ${process.env.ENABLE_RATE_LIMIT || "true"}`);
  console.log(`Debug mode: ${process.env.DEBUG_MODE || "false"}`);
  console.log("####################");

  console.log(`Local access: http://localhost:${PORT}`);

  // Show all possible network access URLs
  if (serverIPs.length > 0) {
    console.log("Network access URLs:");
    serverIPs.forEach((ip) => {
      console.log(`  http://${ip}:${PORT}`);
    });
    console.log(
      `\nIMPORTANT: Other devices should use one of these network IPs for synchronization`
    );
  }
  console.log("");
});

// Graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\nSIGINT received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
