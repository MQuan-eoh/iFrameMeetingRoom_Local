/**
 * Meeting Room Management System - Main Application
 * Modular architecture for better maintainability and organization
 *
 * @version 2.0.0
 * @author EoH Company
 * @description Local meeting room management with direct booking functionality
 */

// Import all modules
import MeetingDataManager from "./modules/meetingDataManager.js";
import UIManager from "./modules/uiManager.js";
import RoomManager from "./modules/roomManager.js";
import DeviceManager from "./modules/deviceManager.js";
import EventHandlers from "./modules/eventHandlers.js";
import ScheduleBookingManager from "./modules/scheduleBookingManager.js";
import ConnectionStatusManager from "./modules/connectionStatusManager.js";
import MeetingDetailTooltipManager from "./modules/meetingDetailTooltip.js";

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
      `Meeting Room Management System v${this.version} - Starting...`
    );
    this.initialize();
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      console.log("Initializing application modules...");

      // Initialize core managers
      this.managers.meetingDataManager = new MeetingDataManager();
      this.managers.uiManager = new UIManager();
      this.managers.roomManager = new RoomManager();
      this.managers.deviceManager = new DeviceManager();

      // Expose managers globally for cross-component access
      window.roomManager = this.managers.roomManager;
      window.meetingDataManager = this.managers.meetingDataManager;
      window.deviceManager = this.managers.deviceManager;
      window.uiManager = this.managers.uiManager;

      // Also expose PeopleDetectionSystem for direct access
      window.PeopleDetectionSystem =
        this.managers.deviceManager.peopleDetectionSystem;

      // Initialize booking manager
      this.managers.scheduleBookingManager = new ScheduleBookingManager();

      // Initialize meeting detail tooltip manager
      this.managers.meetingDetailTooltipManager =
        new MeetingDetailTooltipManager();

      // Expose tooltip manager globally for action buttons
      window.meetingTooltip = this.managers.meetingDetailTooltipManager;

      // Initialize event handlers (must be last as it depends on other managers)
      this.managers.eventHandlers = new EventHandlers(this.managers);

      // Initialize connection status manager
      this.managers.connectionStatusManager = new ConnectionStatusManager(
        this.managers.meetingDataManager
      );

      // Setup navigation event listeners
      this._setupNavigationHandlers();

      // Detect and configure rooms dynamically
      await this._detectAndConfigureRooms();

      // Setup global error handling
      this._setupGlobalErrorHandling();

      // Setup application state
      this._setupApplicationState();

      // Add global styles
      this._addGlobalStyles();

      // Set up periodic room detection and data refresh
      setInterval(async () => {
        console.log("Periodic room detection and data refresh");
        await this._detectAndConfigureRooms();
        this.managers.meetingDataManager.forceRefresh();
      }, 3 * 60 * 1000); // Every 3 minutes

      this.initialized = true;
      console.log("Application initialized successfully");

      // Force an immediate data refresh after initialization
      setTimeout(() => {
        this.managers.meetingDataManager.forceRefresh();
      }, 2000);

      // Dispatch initialization complete event
      document.dispatchEvent(
        new CustomEvent("appInitialized", {
          detail: { version: this.version, managers: this.managers },
        })
      );
    } catch (error) {
      console.error("Failed to initialize application:", error);
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
      console.log("Manually refreshing data...");

      // Force a new data fetch from server
      const cachedData = await this.managers.meetingDataManager.forceRefresh();

      if (cachedData && cachedData.length > 0) {
        const todayMeetings =
          this.managers.meetingDataManager.getTodayMeetings(cachedData);

        // Update schedule table
        this.managers.roomManager.updateScheduleTable(todayMeetings);

        // Update room status with explicit refresh of all rooms
        console.log("Explicitly refreshing room status for all rooms");
        this.managers.roomManager.updateRoomStatus(cachedData);

        // Trigger events for complete UI refresh
        document.dispatchEvent(
          new CustomEvent("refreshRoomStatus", {
            detail: { meetings: cachedData, todayMeetings },
          })
        );

        document.dispatchEvent(
          new CustomEvent("meetingDataUpdated", {
            detail: { meetings: cachedData, todayMeetings },
          })
        );

        this.managers.uiManager.showNotification(
          "Data refreshed successfully",
          "success"
        );
        console.log("Data refresh completed");
      } else {
        console.log("No cached data available to refresh");
        this.managers.uiManager.showNotification(
          "No data available to refresh",
          "info"
        );
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
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
   * Detect available rooms and update configuration
   */
  async _detectAndConfigureRooms() {
    try {
      console.log("Detecting available rooms...");

      // Start with empty room configuration
      const detectedRooms = {};

      // Attempt to load meeting data to detect rooms in use
      const meetings = await this.managers.meetingDataManager.forceRefresh();

      if (Array.isArray(meetings) && meetings.length > 0) {
        // Extract unique room names from meetings
        const roomSet = new Set();
        meetings.forEach((meeting) => {
          if (meeting && meeting.room) {
            roomSet.add(meeting.room.trim());
          }
        });

        // Convert to room config format
        let index = 1;
        roomSet.forEach((roomName) => {
          const key = `ROOM_${index}`;
          detectedRooms[key] = roomName;
          index++;
        });

        console.log(`Detected ${roomSet.size} rooms from meeting data:`, [
          ...roomSet,
        ]);
      }

      // If no rooms detected, use defaults from ROOM_CONFIG
      if (Object.keys(detectedRooms).length === 0) {
        console.log("No rooms detected from meeting data, using defaults");

        // Keep the default rooms from constants
        Object.assign(detectedRooms, ROOM_CONFIG.ROOMS);
      }

      // Update the ROOM_CONFIG.ROOMS with detected rooms
      ROOM_CONFIG.ROOMS = detectedRooms;

      console.log("Updated room configuration:", ROOM_CONFIG.ROOMS);

      // Force room status update with enhanced error handling
      if (this.managers.roomManager) {
        try {
          // First ensure room sections exist in the DOM
          const roomsContainer = document.querySelector(".rooms-container");
          if (
            roomsContainer &&
            typeof this.managers.roomManager._ensureRoomSections === "function"
          ) {
            console.log("Ensuring all room sections exist in DOM");
            this.managers.roomManager._ensureRoomSections(roomsContainer);
          }

          // Get today's meetings for room status
          const meetings =
            this.managers.meetingDataManager.getCachedMeetingData();
          const todayMeetings =
            this.managers.meetingDataManager.getTodayMeetings(meetings);

          // Update room status
          console.log("Forcing room status update after room detection");
          this.managers.roomManager.updateRoomStatus(meetings);

          // Dispatch events for UI refresh
          console.log("Dispatching events for room UI refresh");
          document.dispatchEvent(
            new CustomEvent("refreshRoomStatus", {
              detail: { meetings, todayMeetings },
            })
          );
        } catch (roomError) {
          console.error(
            "Error updating room status after configuration:",
            roomError
          );
        }
      }

      return detectedRooms;
    } catch (error) {
      console.error("Error detecting rooms:", error);
      return ROOM_CONFIG.ROOMS; // Fall back to defaults
    }
  }

  /**
   * Setup navigation event handlers
   */
  _setupNavigationHandlers() {
    console.log("Setting up navigation handlers");

    // Listen for back to home navigation events
    document.addEventListener("navigateToHome", (event) => {
      console.log("Navigation to home requested:", event.detail);
      this._handleBackToHome(event.detail);
    });

    // Listen for room navigation events
    document.addEventListener("navigateToRoom", (event) => {
      console.log("Navigation to room requested:", event.detail);
      this._handleRoomNavigation(event.detail);
    });

    console.log("Navigation handlers set up successfully");
  }

  /**
   * Handle navigation back to home
   */
  _handleBackToHome(detail = {}) {
    console.log("Handling back to home navigation");

    try {
      // Don't clear meeting-container blindly - let renderMainDashboard handle it
      const meetingContainer = document.querySelector(".meeting-container");
      if (meetingContainer) {
        console.log(
          "Found meeting-container, delegating to renderMainDashboard"
        );

        // Trigger main dashboard re-render using the new method
        if (
          this.managers.uiManager &&
          this.managers.uiManager.renderMainDashboard
        ) {
          const success = this.managers.uiManager.renderMainDashboard();

          if (!success) {
            console.warn(
              "Main dashboard render failed, trying alternative approach"
            );
            // Try alternative approach - show main elements manually
            const mainElements = document.querySelectorAll(
              ".left-column, .right-column"
            );
            mainElements.forEach((element) => {
              if (element) {
                element.style.display = "";
                element.style.visibility = "visible";
              }
            });
          }
        } else {
          console.warn(
            "renderMainDashboard method not available, using fallback"
          );
          // Show main dashboard elements manually
          const mainElements = document.querySelectorAll(
            ".left-column, .right-column"
          );
          mainElements.forEach((element) => {
            if (element) {
              element.style.display = "";
              element.style.visibility = "visible";
            }
          });
        }
      }

      // Refresh data to ensure we have the latest information
      if (this.managers.meetingDataManager) {
        this.managers.meetingDataManager.forceRefresh();
      }

      // Update URL if needed (without page reload)
      if (
        window.history &&
        window.location.hash &&
        window.location.hash !== "#home"
      ) {
        window.history.pushState(null, null, window.location.pathname);
      }

      // Dispatch event to notify other components
      document.dispatchEvent(
        new CustomEvent("homeNavigationComplete", {
          detail: { from: detail.from || "unknown" },
        })
      );

      console.log("Back to home navigation completed");
    } catch (error) {
      console.error("Error during back to home navigation:", error);

      // Check if we're in an iframe - if so, avoid reload
      if (window.self !== window.top) {
        console.warn(
          "In iframe context - avoiding page reload to prevent crash"
        );

        // Try manual recovery without clearing meeting-container
        const mainElements = document.querySelectorAll(
          ".left-column, .right-column"
        );
        mainElements.forEach((element) => {
          if (element) {
            element.style.display = "";
            element.style.visibility = "visible";
          }
        });

        console.log("Manual recovery completed");
        return;
      }

      // Fallback: only reload if not in iframe
      console.warn("Using page reload as last resort");
      window.location.reload();
    }
  }

  /**
   * Handle room navigation
   */
  _handleRoomNavigation(detail = {}) {
    console.log("Handling room navigation:", detail);

    const { roomName, roomKey } = detail;

    if (!roomName && !roomKey) {
      console.warn("Room navigation called without room identifier");
      return;
    }

    try {
      // Use room manager to render room page
      if (this.managers.roomManager) {
        const data =
          this.managers.meetingDataManager?.getCachedMeetingData() || [];
        const targetRoom = roomName || roomKey;
        this.managers.roomManager.renderRoomPage(data, targetRoom, targetRoom);
      }

      // Update URL if needed
      if (window.history) {
        const newHash = `#room-${(roomKey || roomName)
          .toLowerCase()
          .replace(/\s+/g, "-")}`;
        window.history.pushState(null, null, newHash);
      }

      console.log("Room navigation completed");
    } catch (error) {
      console.error("Error during room navigation:", error);
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
      console.log("Manually refreshing data...");

      // Force a new data fetch from server
      const cachedData = await this.managers.meetingDataManager.forceRefresh();

      if (cachedData && cachedData.length > 0) {
        const todayMeetings =
          this.managers.meetingDataManager.getTodayMeetings(cachedData);

        // Update schedule table
        this.managers.roomManager.updateScheduleTable(todayMeetings);

        // Update room status with explicit refresh of all rooms
        console.log("Explicitly refreshing room status for all rooms");
        this.managers.roomManager.updateRoomStatus(cachedData);

        // Trigger events for complete UI refresh
        document.dispatchEvent(
          new CustomEvent("refreshRoomStatus", {
            detail: { meetings: cachedData, todayMeetings },
          })
        );

        document.dispatchEvent(
          new CustomEvent("meetingDataUpdated", {
            detail: { meetings: cachedData, todayMeetings },
          })
        );

        this.managers.uiManager.showNotification(
          "Data refreshed successfully",
          "success"
        );
        console.log("Data refresh completed");
      } else {
        console.log("No cached data available to refresh");
        this.managers.uiManager.showNotification(
          "No data available to refresh",
          "info"
        );
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
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
   * Detect available rooms and update configuration
   */
  async _detectAndConfigureRooms() {
    try {
      console.log("Detecting available rooms...");

      // Start with empty room configuration
      const detectedRooms = {};

      // Attempt to load meeting data to detect rooms in use
      const meetings = await this.managers.meetingDataManager.forceRefresh();

      if (Array.isArray(meetings) && meetings.length > 0) {
        // Extract unique room names from meetings
        const roomSet = new Set();
        meetings.forEach((meeting) => {
          if (meeting && meeting.room) {
            roomSet.add(meeting.room.trim());
          }
        });

        // Convert to room config format
        let index = 1;
        roomSet.forEach((roomName) => {
          const key = `ROOM_${index}`;
          detectedRooms[key] = roomName;
          index++;
        });

        console.log(`Detected ${roomSet.size} rooms from meeting data:`, [
          ...roomSet,
        ]);
      }

      // If no rooms detected, use defaults from ROOM_CONFIG
      if (Object.keys(detectedRooms).length === 0) {
        console.log("No rooms detected from meeting data, using defaults");

        // Keep the default rooms from constants
        Object.assign(detectedRooms, ROOM_CONFIG.ROOMS);
      }

      // Update the ROOM_CONFIG.ROOMS with detected rooms
      ROOM_CONFIG.ROOMS = detectedRooms;

      console.log("Updated room configuration:", ROOM_CONFIG.ROOMS);

      // Force room status update with enhanced error handling
      if (this.managers.roomManager) {
        try {
          // First ensure room sections exist in the DOM
          const roomsContainer = document.querySelector(".rooms-container");
          if (
            roomsContainer &&
            typeof this.managers.roomManager._ensureRoomSections === "function"
          ) {
            console.log("Ensuring all room sections exist in DOM");
            this.managers.roomManager._ensureRoomSections(roomsContainer);
          }

          // Get today's meetings for room status
          const meetings =
            this.managers.meetingDataManager.getCachedMeetingData();
          const todayMeetings =
            this.managers.meetingDataManager.getTodayMeetings(meetings);

          // Update room status
          console.log("Forcing room status update after room detection");
          this.managers.roomManager.updateRoomStatus(meetings);

          // Dispatch events for UI refresh
          console.log("Dispatching events for room UI refresh");
          document.dispatchEvent(
            new CustomEvent("refreshRoomStatus", {
              detail: { meetings, todayMeetings },
            })
          );
        } catch (roomError) {
          console.error(
            "Error updating room status after configuration:",
            roomError
          );
        }
      }

      return detectedRooms;
    } catch (error) {
      console.error("Error detecting rooms:", error);
      return ROOM_CONFIG.ROOMS; // Fall back to defaults
    }
  }

  /**
   * Setup global error handling
   */
  _setupGlobalErrorHandling() {
    window.addEventListener("error", (event) => {
      console.error("Global error caught:", event.error);

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
      console.error("Unhandled promise rejection:", event.reason);
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
        console.log("App Status:", this.getStatus());
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
        content: 'Loading...';
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
      <button onclick="
        if (window.self !== window.top) {
          console.warn('In iframe - attempting recovery without reload');
          location.href = location.pathname;
        } else {
          location.reload();
        }
      " style="
        background: white;
        color: #dc3545;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
      ">Reload Page</button>
    `;

    document.body.appendChild(errorDiv);
  }

  /**
   * Cleanup method for proper shutdown
   */
  cleanup() {
    console.log("Cleaning up application...");

    if (this.managers.eventHandlers) {
      this.managers.eventHandlers.cleanup();
    }

    this.initialized = false;
    console.log("Application cleanup completed");
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
