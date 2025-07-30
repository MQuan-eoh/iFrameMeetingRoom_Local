/**
 * Meeting Room Management Server
 * Local server for storing meeting room booking data
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const fsExtra = require("fs-extra");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Data directory
const DATA_DIR = path.join(__dirname, "data");
const MEETINGS_FILE = path.join(DATA_DIR, "meetings.json");
const BACKUP_DIR = path.join(DATA_DIR, "backups");

// Ensure data directories exist
fsExtra.ensureDirSync(DATA_DIR);
fsExtra.ensureDirSync(BACKUP_DIR);

// Initialize meetings file if it doesn't exist
if (!fs.existsSync(MEETINGS_FILE)) {
  fs.writeFileSync(MEETINGS_FILE, JSON.stringify([]));
}

// Configure CORS to allow all origins with credentials
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cache-Control",
    "Pragma",
    "Expires",
  ],
  credentials: true,
  maxAge: 60, // Reduce preflight cache to ensure fresh requests
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("dev"));

// Add cache-control headers to all responses
app.use((req, res, next) => {
  // Prevent caching for API responses to ensure fresh data
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

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

    console.log(`📝 Updating meeting ${meetingId}:`, updateData);

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

    console.log(`✅ Meeting ${meetingId} updated successfully`);

    res.json({
      success: true,
      meeting: updatedMeeting,
      message: "Meeting updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating meeting:", error);
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
 * Create a backup of meetings data
 */
function createBackup() {
  if (fs.existsSync(MEETINGS_FILE)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(BACKUP_DIR, `meetings-${timestamp}.json`);
    fsExtra.copySync(MEETINGS_FILE, backupFile);

    // Clean up old backups (keep only last 10)
    cleanupBackups();
  }
}

/**
 * Clean up old backups, keeping only the most recent ones
 */
function cleanupBackups() {
  try {
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((file) => file.endsWith(".json"))
      .map((file) => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time); // Sort by time (newest first)

    // Keep only the 10 most recent backups
    if (files.length > 10) {
      files.slice(10).forEach((file) => {
        fs.unlinkSync(file.path);
      });
    }
  } catch (error) {
    console.error("Error cleaning up backups:", error);
  }
}

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

// Start server
app.listen(PORT, () => {
  const serverIPs = getServerIPs();

  console.log(`🚀 Meeting Room Server running on port ${PORT}`);
  console.log(`📁 Data stored in ${DATA_DIR}`);
  console.log(`💾 Local access: http://localhost:${PORT}`);

  // Show all possible network access URLs
  if (serverIPs.length > 0) {
    console.log("💻 Network access URLs:");
    serverIPs.forEach((ip) => {
      console.log(`   http://${ip}:${PORT}`);
    });
    console.log(
      `\n⚠️  IMPORTANT: Other devices should use one of these network IPs for synchronization`
    );
  }
});
