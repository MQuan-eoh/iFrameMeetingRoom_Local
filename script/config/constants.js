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

// API Configuration (if needed in future)
export const API_CONFIG = {
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
