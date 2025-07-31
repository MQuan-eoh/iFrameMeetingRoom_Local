/**
 * Constants and Configuration
 * Central location for all application constants and configuration
 */

// Room Configuration
export const ROOM_CONFIG = {
  ROOMS: {
    ROOM_3: "Phòng họp lầu 3",
    ROOM_4: "Phòng họp lầu 4",
  },

  NORMALIZED_NAMES: {
    "P.HỌP LẦU 3": "Phòng họp lầu 3",
    "PHÒNG HỌP LẦU 3": "Phòng họp lầu 3",
    "Phòng họp lầu 3": "Phòng họp lầu 3",
    "PHÒNG HỌP LẦU 4": "Phòng họp lầu 4",
    "Phòng họp lầu 4": "Phòng họp lầu 4",
  },

  SUFFIX_MAP: {
    "Phòng họp lầu 3": "eRa",
    "Phòng họp lầu 4": "eRa2",
  },

  ERA_MAP: {
    "Phòng họp lầu 3": "eRa",
    "Phòng họp lầu 4": "eRa2",
  },
};

// Meeting Status Constants
export const MEETING_STATUS = {
  ACTIVE: "Đang họp",
  UPCOMING: "Sắp họp",
  EMPTY: "Trống",
  ENDED: "Đã kết thúc",
};

// Time Constants
export const TIME_CONFIG = {
  AUTO_UPDATE_INTERVAL: 30 * 60 * 1000, // 30 minutes
  FILE_CHECK_INTERVAL: 5000, // 5 seconds
  BASIC_CHECK_INTERVAL: 30 * 60 * 1000, // 30 minutes
  TIMEZONE_OFFSET: 7, // UTC+7
};

// API Configuration with Cloud Deployment Support
export const API_CONFIG = {
  /**
   * Intelligent API base URL detection for different deployment environments
   */
  detectApiBaseUrl() {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;

    // Development environment detection
    if (
      protocol === "file:" ||
      hostname === "localhost" ||
      hostname === "127.0.0.1"
    ) {
      // Check if custom server IP is stored for network synchronization
      const serverIP = localStorage.getItem("serverIP");
      if (serverIP && serverIP !== "localhost" && serverIP !== "127.0.0.1") {
        console.log(`[CONFIG] Using stored server IP: ${serverIP}`);
        return `http://${serverIP}:3000/api`;
      }
      return "http://localhost:3000/api";
    }

    // Cloud/production environment detection
    if (hostname && hostname !== "localhost") {
      // Use same protocol and host as the current page
      const baseUrl = port
        ? `${protocol}//${hostname}:${port}`
        : `${protocol}//${hostname}`;

      // For cloud deployment, API is typically on same domain with /api path
      console.log(`[CONFIG] Cloud environment detected: ${baseUrl}/api`);
      return `${baseUrl}/api`;
    }

    // Fallback to localhost for development
    console.log(`[CONFIG] Using localhost fallback`);
    return "http://localhost:3000/api";
  },

  /**
   * Get the current environment type
   */
  getEnvironment() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    if (protocol === "file:") return "file";
    if (hostname === "localhost" || hostname === "127.0.0.1")
      return "development";
    return "production";
  },

  /**
   * Check if running in development mode
   */
  isDevelopment() {
    return this.getEnvironment() !== "production";
  },

  /**
   * Check if running in production/cloud mode
   */
  isProduction() {
    return this.getEnvironment() === "production";
  },

  // Network configuration
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000, // 2 seconds

  // Connection monitoring
  CONNECTION_CHECK_INTERVAL: 30000, // 30 seconds
  FAST_CHECK_INTERVAL: 5000, // 5 seconds for failed connections
};

// Legacy support - will be dynamically determined using API_CONFIG
export const API_BASE_URL = (() => {
  // Use the new API_CONFIG for consistency
  if (typeof window !== "undefined" && window.location) {
    // Import API_CONFIG detection method if available
    try {
      return API_CONFIG.detectApiBaseUrl();
    } catch (error) {
      // Fallback to original logic if API_CONFIG is not available
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;

      // If running from file:// protocol, use localhost
      if (protocol === "file:") {
        return "http://localhost:3000";
      }

      // If running from http/https, try to use same host
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return `${protocol}//${hostname}:3000`;
      }

      // For production or other hosts, detect based on current location
      return `${protocol}//${hostname}${
        window.location.port ? ":" + window.location.port : ""
      }`;
    }
  }

  // Node.js environment fallback
  return "http://localhost:3000";
})();

// UI Constants
export const UI_CONFIG = {
  PROGRESS_BAR_DELAY: 100,
  MODAL_ANIMATION_DELAY: 300,
  NOTIFICATION_DURATION: 3000,
  BUTTON_FEEDBACK_DURATION: 300,
};

// Device Constants
export const DEVICE_CONFIG = {
  AC_ACTIONS: {
    "Phòng họp lầu 3": { on: null, off: null },
    "Phòng họp lầu 4": { on: null, off: null },
  },

  PEOPLE_DETECTION: {
    "Phòng họp lầu 3": { sensorId: 4 },
    "Phòng họp lầu 4": { sensorId: 9 },
  },
};

// Column Mapping for Excel Processing
export const EXCEL_COLUMNS = {
  DATE: "NGÀY",
  DAY_OF_WEEK: "THỨ",
  ROOM: "PHÒNG",
  START_TIME: "THỜI GIAN BẮT ĐẦU",
  END_TIME: "THỜI GIAN KẾT THÚC",
  DURATION: "THỜI LƯỢNG",
  CONTENT: "NỘI DUNG",
};

// Storage Keys
export const STORAGE_KEYS = {
  WELCOME_MESSAGE: "welcomeMessage",
  MAIN_BACKGROUND: "customMainBackground",
  SCHEDULE_BACKGROUND: "customScheduleBackground",
};

// CSS Classes
export const CSS_CLASSES = {
  ROOM_SECTION: "room-section",
  MEETING_TITLE: "meeting-title",
  START_TIME: "start-time",
  END_TIME: "end-time",
  STATUS_INDICATOR: "status-indicator",
  INDICATOR_DOT: "indicator-dot",
  PEOPLE_INDICATOR: "people-indicator",
  PEOPLE_DOT: "people-dot",
  PEOPLE_STATUS_TEXT: "people-status-text",
  AC_CARD: "ac-card",
  STATUS_AIR_DOT: "status-air-dot",
  // Room Filter Classes
  ROOM_FILTER_BUTTON: "room-filter-button",
  ROOM_FILTER_DROPDOWN: "room-filter-dropdown",
  FILTER_OPTION: "filter-option",
  FILTER_CHECK: "filter-check",
};

// Enhanced API Configuration with Cloud Deployment Support
export const LEGACY_API_CONFIG = {
  BASE_URL: "",
  ENDPOINTS: {
    MEETINGS: "/api/meetings",
    ROOMS: "/api/rooms",
    DEVICES: "/api/devices",
  },
};

export default {
  ROOM_CONFIG,
  MEETING_STATUS,
  TIME_CONFIG,
  UI_CONFIG,
  DEVICE_CONFIG,
  EXCEL_COLUMNS,
  STORAGE_KEYS,
  CSS_CLASSES,
  API_CONFIG,
};
