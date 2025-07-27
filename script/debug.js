/**
 * Debug Script - Runtime Error Detection
 * This script helps identify runtime errors and module loading issues
 */

// Create a debug console overlay
function createDebugConsole() {
  // Remove existing debug console if any
  const existing = document.getElementById("debug-console");
  if (existing) existing.remove();

  const debugConsole = document.createElement("div");
  debugConsole.id = "debug-console";
  debugConsole.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 400px;
        max-height: 500px;
        background: rgba(0, 0, 0, 0.9);
        color: #fff;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        padding: 15px;
        border-radius: 8px;
        z-index: 10000;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        border: 1px solid #333;
    `;

  const header = document.createElement("div");
  header.style.cssText = `
        background: #2c3e50;
        margin: -15px -15px 10px -15px;
        padding: 10px 15px;
        font-weight: bold;
        border-radius: 8px 8px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
  header.innerHTML = `
        <span>🐛 Debug Console</span>
        <button id="clear-debug" style="background: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 10px;">Clear</button>
    `;

  const content = document.createElement("div");
  content.id = "debug-content";
  content.style.cssText = `
        max-height: 400px;
        overflow-y: auto;
        line-height: 1.4;
    `;

  debugConsole.appendChild(header);
  debugConsole.appendChild(content);
  document.body.appendChild(debugConsole);

  // Clear button functionality
  document.getElementById("clear-debug").addEventListener("click", () => {
    content.innerHTML = "";
  });

  return content;
}

// Log function for debug console
function debugLog(message, type = "info") {
  const debugContent =
    document.getElementById("debug-content") || createDebugConsole();
  const timestamp = new Date().toLocaleTimeString();

  const colors = {
    info: "#3498db",
    success: "#27ae60",
    warning: "#f39c12",
    error: "#e74c3c",
  };

  const icons = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
  };

  const logEntry = document.createElement("div");
  logEntry.style.cssText = `
        margin: 5px 0;
        padding: 8px;
        background: rgba(255, 255, 255, 0.05);
        border-left: 3px solid ${colors[type]};
        border-radius: 4px;
        word-wrap: break-word;
    `;

  logEntry.innerHTML = `
        <div style="color: #bdc3c7; font-size: 10px; margin-bottom: 3px;">
            ${timestamp} ${icons[type]}
        </div>
        <div style="color: ${colors[type]};">${message}</div>
    `;

  debugContent.appendChild(logEntry);
  debugContent.scrollTop = debugContent.scrollHeight;
}

// Initialize debug console
const debugContent = createDebugConsole();

// Override console methods to capture logs
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
};

console.log = function (...args) {
  originalConsole.log.apply(console, args);
  debugLog(args.join(" "), "info");
};

console.error = function (...args) {
  originalConsole.error.apply(console, args);
  debugLog(args.join(" "), "error");
};

console.warn = function (...args) {
  originalConsole.warn.apply(console, args);
  debugLog(args.join(" "), "warning");
};

console.info = function (...args) {
  originalConsole.info.apply(console, args);
  debugLog(args.join(" "), "info");
};

// Global error handlers
window.addEventListener("error", (event) => {
  debugLog(
    `Script Error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`,
    "error"
  );
});

window.addEventListener("unhandledrejection", (event) => {
  debugLog(`Unhandled Promise Rejection: ${event.reason}`, "error");
});

// Module loading checker
async function checkModuleLoading() {
  debugLog("🔍 Checking module loading...", "info");

  const modules = [
    { name: "Constants", path: "./script/config/constants.js" },
    { name: "Core Utils", path: "./script/utils/core.js" },
    {
      name: "Meeting Data Manager",
      path: "./script/modules/meetingDataManager.js",
    },
    { name: "UI Manager", path: "./script/modules/uiManager.js" },
    { name: "Room Manager", path: "./script/modules/roomManager.js" },
    { name: "Device Manager", path: "./script/modules/deviceManager.js" },
    { name: "Event Handlers", path: "./script/modules/eventHandlers.js" },
  ];

  for (const module of modules) {
    try {
      const imported = await import(module.path);
      debugLog(`✅ ${module.name} loaded successfully`, "success");

      // Check for expected exports
      const exports = Object.keys(imported);
      debugLog(`   Exports: ${exports.join(", ")}`, "info");
    } catch (error) {
      debugLog(`❌ Failed to load ${module.name}: ${error.message}`, "error");
    }
  }
}

// Check DOM readiness
function checkDOMElements() {
  debugLog("🔍 Checking required DOM elements...", "info");

  const requiredElements = [
    "dynamicPageContent",
    "currentDate",
    "currentTime",
    "roomName",
    "meetingStatusIndicator",
    "currentMeetingInfo",
    "upcomingMeetingsContainer",
  ];

  let foundElements = 0;
  requiredElements.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      debugLog(`✅ Found element: ${id}`, "success");
      foundElements++;
    } else {
      debugLog(`⚠️ Missing element: ${id}`, "warning");
    }
  });

  debugLog(
    `📊 Found ${foundElements}/${requiredElements.length} required elements`,
    "info"
  );
}

// Performance monitor
function monitorPerformance() {
  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing;
    const domContentLoaded =
      timing.domContentLoadedEventEnd - timing.navigationStart;
    const pageLoad = timing.loadEventEnd - timing.navigationStart;

    debugLog(`⏱️ DOM Content Loaded: ${domContentLoaded}ms`, "info");
    debugLog(`⏱️ Page Load Complete: ${pageLoad}ms`, "info");
  }
}

// Memory usage monitor
function monitorMemory() {
  if (window.performance && window.performance.memory) {
    const memory = window.performance.memory;
    const used = Math.round((memory.usedJSHeapSize / 1048576) * 100) / 100;
    const total = Math.round((memory.totalJSHeapSize / 1048576) * 100) / 100;

    debugLog(`💾 Memory Usage: ${used}MB / ${total}MB`, "info");
  }
}

// Start monitoring when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  debugLog("🚀 Debug monitor started", "success");
  checkDOMElements();
  monitorPerformance();

  // Check modules after a short delay
  setTimeout(checkModuleLoading, 1000);

  // Monitor memory every 30 seconds
  setInterval(monitorMemory, 30000);
});

// Export for manual use
window.debugLog = debugLog;
window.checkModuleLoading = checkModuleLoading;
window.checkDOMElements = checkDOMElements;

debugLog("🔧 Debug script loaded and ready", "success");
