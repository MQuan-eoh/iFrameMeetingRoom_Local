/**
 * Meeting Room Management System - Main Application
 * Modular architecture for better maintainability and organization
 *
 * @version 2.0.0
 * @author EoH Company
 * @description Local meeting room management with Excel file processing
 */

// Import all modules
import MeetingDataManager from "./modules/meetingDataManager.js";
import UIManager from "./modules/uiManager.js";
import RoomManager from "./modules/roomManager.js";
import DeviceManager from "./modules/deviceManager.js";
import EventHandlers from "./modules/eventHandlers.js";
import ScheduleBookingManager from "./modules/scheduleBookingManager.js";

// Import utilities and constants
import { DateTimeUtils } from "./utils/core.js";
import { ROOM_CONFIG, TIME_CONFIG } from "./config/constants.js";

/**
 * Main Application Class
 */
class MeetingRoomApp {
  constructor() {
    this.version = "2.0.0";
    this.managers = {};
    this.initialized = false;

    console.log(
      `🚀 Meeting Room Management System v${this.version} - Starting...`
    );
    this.initialize();
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      console.log("📦 Initializing application modules...");

      // Initialize core managers
      this.managers.meetingDataManager = new MeetingDataManager();
      this.managers.uiManager = new UIManager();
      this.managers.roomManager = new RoomManager();
      this.managers.deviceManager = new DeviceManager();
      this.managers.scheduleBookingManager = new ScheduleBookingManager();

      // Initialize event handlers (must be last as it depends on other managers)
      this.managers.eventHandlers = new EventHandlers(this.managers);

      // Setup global error handling
      this._setupGlobalErrorHandling();

      // Setup application state
      this._setupApplicationState();

      // Add global styles
      this._addGlobalStyles();

      this.initialized = true;
      console.log("✅ Application initialized successfully");

      // Dispatch initialization complete event
      document.dispatchEvent(
        new CustomEvent("appInitialized", {
          detail: { version: this.version, managers: this.managers },
        })
      );
    } catch (error) {
      console.error("❌ Failed to initialize application:", error);
      this._handleInitializationError(error);
    }
  }

  /**
   * Get application status
   */
  getStatus() {
    return {
      version: this.version,
      initialized: this.initialized,
      currentMeetingData:
        this.managers.meetingDataManager?.getCachedMeetingData() || [],
      roomStatuses: this._getRoomStatuses(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Manually trigger data refresh
   */
  async refreshData() {
    try {
      console.log("🔄 Manually refreshing data...");

      const cachedData =
        this.managers.meetingDataManager.getCachedMeetingData();
      if (cachedData && cachedData.length > 0) {
        const todayMeetings =
          this.managers.meetingDataManager.getTodayMeetings(cachedData);

        this.managers.roomManager.updateScheduleTable(todayMeetings);
        this.managers.roomManager.updateRoomStatus(cachedData);

        this.managers.uiManager.showNotification(
          "Data refreshed successfully",
          "success"
        );
        console.log("✅ Data refresh completed");
      } else {
        console.log("ℹ️ No cached data available to refresh");
        this.managers.uiManager.showNotification(
          "No data available to refresh",
          "info"
        );
      }
    } catch (error) {
      console.error("❌ Error refreshing data:", error);
      this.managers.uiManager.showNotification(
        "Failed to refresh data",
        "error"
      );
    }
  }

  /**
   * Get current room statuses
   */
  _getRoomStatuses() {
    const rooms = Object.values(ROOM_CONFIG.ROOMS);
    const currentTime = DateTimeUtils.getCurrentTime();
    const cachedData =
      this.managers.meetingDataManager?.getCachedMeetingData() || [];
    const todayMeetings =
      this.managers.meetingDataManager?.getTodayMeetings(cachedData) || [];

    return rooms.map((roomName) => {
      const roomMeetings =
        this.managers.meetingDataManager?.getRoomMeetings(
          roomName,
          todayMeetings
        ) || [];
      const activeMeeting = roomMeetings.find(
        (meeting) =>
          DateTimeUtils.isTimeInRangeWithSeconds(
            currentTime,
            meeting.startTime,
            meeting.endTime
          ) &&
          !meeting.isEnded &&
          !meeting.forceEndedByUser
      );

      return {
        roomName,
        status: activeMeeting ? "occupied" : "available",
        currentMeeting: activeMeeting || null,
        upcomingMeetings: roomMeetings.filter(
          (meeting) =>
            DateTimeUtils.timeToMinutes(meeting.startTime) >
              DateTimeUtils.timeToMinutes(currentTime) &&
            !meeting.isEnded &&
            !meeting.forceEndedByUser
        ).length,
      };
    });
  }

  /**
   * Setup global error handling
   */
  _setupGlobalErrorHandling() {
    window.addEventListener("error", (event) => {
      console.error("🔥 Global error caught:", event.error);

      // Show user-friendly error message for critical errors
      if (this.managers.uiManager) {
        this.managers.uiManager.showNotification(
          "An unexpected error occurred. Please refresh the page if issues persist.",
          "error",
          5000
        );
      }
    });

    window.addEventListener("unhandledrejection", (event) => {
      console.error("🔥 Unhandled promise rejection:", event.reason);
      event.preventDefault(); // Prevent the default browser error handling
    });
  }

  /**
   * Setup application state management
   */
  _setupApplicationState() {
    // Initialize global state object
    window.meetingRoomApp = {
      instance: this,
      managers: this.managers,
      config: {
        rooms: ROOM_CONFIG,
        timeConfig: TIME_CONFIG,
      },
      utils: {
        getCurrentTime: DateTimeUtils.getCurrentTime,
        getCurrentDate: DateTimeUtils.getCurrentDate,
        formatTime: DateTimeUtils.formatTime,
        formatDate: DateTimeUtils.formatDate,
      },
    };

    // Setup periodic status logging (for debugging)
    const isDevelopmentMode =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.protocol === "file:";
    if (isDevelopmentMode) {
      setInterval(() => {
        console.log("📊 App Status:", this.getStatus());
      }, 60000); // Every minute
    }
  }

  /**
   * Add global application styles
   */
  _addGlobalStyles() {
    const globalStyles = `
      /* Application Loading States */
      .app-loading {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
        font-size: 18px;
        color: #333;
      }

      .app-loading::after {
        content: '⏳ Loading...';
        animation: pulse 1.5s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      /* Button Feedback */
      .btn-feedback {
        transform: scale(0.95);
        transition: transform 0.1s ease;
      }

      /* Enhanced Meeting Status Indicators */
      .status-indicator .indicator-dot.busy {
        animation: statusPulse 2s ease-in-out infinite;
      }

      @keyframes statusPulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.7;
          transform: scale(1.1);
        }
      }

      /* Enhanced Room Section Styling */
      .room-section {
        transition: all 0.3s ease;
        border-radius: 8px;
        overflow: hidden;
      }

      .room-section:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      /* Application Info Display */
      .app-info {
        position: fixed;
        bottom: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1000;
        opacity: 0.7;
        transition: opacity 0.3s ease;
      }

      .app-info:hover {
        opacity: 1;
      }

      /* Responsive Enhancements */
      @media (max-width: 768px) {
        .meeting-container {
          padding: 10px;
        }
        
        .content-wrapper {
          gap: 10px;
        }
        
        .app-info {
          display: none;
        }
      }

      /* Print Styles */
      @media print {
        .settings-icon,
        .fullscreen-toggle,
        .upload-button,
        .app-info,
        .notification,
        .end-meeting {
          display: none !important;
        }
        
        .meeting-container {
          box-shadow: none;
          border: 1px solid #ccc;
        }
      }
    `;

    const style = document.createElement("style");
    style.textContent = globalStyles;
    document.head.appendChild(style);

    // Add application info display
    this._addAppInfo();
  }

  /**
   * Add application info display
   */
  _addAppInfo() {
    const appInfo = document.createElement("div");
    appInfo.className = "app-info";
    appInfo.innerHTML = `
      Meeting Room System v${this.version}<br>
      <small>Local Mode • ${DateTimeUtils.getCurrentDate()}</small>
    `;
    document.body.appendChild(appInfo);
  }

  /**
   * Handle initialization errors
   */
  _handleInitializationError(error) {
    // Create emergency error display
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #dc3545;
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      z-index: 10002;
      max-width: 500px;
    `;
    errorDiv.innerHTML = `
      <h3>🚨 Application Failed to Start</h3>
      <p>There was an error initializing the meeting room system.</p>
      <p><small>Error: ${error.message}</small></p>
      <button onclick="location.reload()" style="
        background: white;
        color: #dc3545;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
      ">🔄 Reload Page</button>
    `;

    document.body.appendChild(errorDiv);
  }

  /**
   * Cleanup method for proper shutdown
   */
  cleanup() {
    console.log("🧹 Cleaning up application...");

    if (this.managers.eventHandlers) {
      this.managers.eventHandlers.cleanup();
    }

    this.initialized = false;
    console.log("✅ Application cleanup completed");
  }
}

// Initialize the application when the script loads
let appInstance = null;

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    appInstance = new MeetingRoomApp();
  });
} else {
  // DOM is already ready
  appInstance = new MeetingRoomApp();
}

// Export for global access (for debugging and external integrations)
window.MeetingRoomApp = MeetingRoomApp;

// Handle page unload
window.addEventListener("beforeunload", () => {
  if (appInstance) {
    appInstance.cleanup();
  }
});

// Development helpers
if (typeof window !== "undefined") {
  window.getAppStatus = () => appInstance?.getStatus();
  window.refreshAppData = () => appInstance?.refreshData();
}

export default MeetingRoomApp;
