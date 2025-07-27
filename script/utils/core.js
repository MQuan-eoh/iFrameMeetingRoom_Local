/**
 * Core Utilities
 * Common utility functions for date/time, formatting, and data manipulation
 */

import { TIME_CONFIG } from "../config/constants.js";

/**
 * Date and Time Utilities
 */
export class DateTimeUtils {
  static getCurrentDate() {
    const now = new Date();
    now.setHours(now.getHours() + TIME_CONFIG.TIMEZONE_OFFSET);

    const date = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();

    return `${date}/${month}/${year}`;
  }

  static getCurrentTime() {
    const now = new Date();
    now.setHours(now.getHours() + TIME_CONFIG.TIMEZONE_OFFSET);

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  }

  static formatTime(timeStr) {
    if (!timeStr) return "";

    console.log("Formatting time value:", timeStr, "Type:", typeof timeStr);

    // Handle Date objects from Excel
    if (timeStr instanceof Date) {
      const hours = timeStr.getHours();
      const minutes = timeStr.getMinutes();
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}`;
    }

    // Handle Excel time values (numbers between 0 and 1)
    if (typeof timeStr === "number" || !isNaN(timeStr)) {
      const floatTime = parseFloat(timeStr);
      if (floatTime >= 0 && floatTime <= 1) {
        const totalMinutes = Math.round(floatTime * 24 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
          2,
          "0"
        )}`;
      }
    }

    // Handle string format
    if (typeof timeStr === "string") {
      const normalizedTime = timeStr
        .toLowerCase()
        .trim()
        .replace(/[^0-9h:\.]/g, "")
        .replace(/\s+/g, "");

      const timeFormats = {
        colon: /^(\d{1,2}):(\d{2})$/, // 13:30
        hourMinute: /^(\d{1,2})h(\d{2})$/, // 13h30
        decimal: /^(\d{1,2})\.(\d{2})$/, // 13.30
        simple: /^(\d{1,2})(\d{2})$/, // 1330
      };

      for (const [format, regex] of Object.entries(timeFormats)) {
        const match = normalizedTime.match(regex);
        if (match) {
          const [_, hours, minutes] = match;
          const hrs = parseInt(hours, 10);
          const mins = parseInt(minutes, 10);

          if (hrs >= 0 && hrs < 24 && mins >= 0 && mins < 60) {
            return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
              2,
              "0"
            )}`;
          }
        }
      }
    }

    return "";
  }

  static formatDate(dateInput) {
    if (!dateInput) return "";

    // Handle Date objects
    if (dateInput instanceof Date) {
      const date = String(dateInput.getDate()).padStart(2, "0");
      const month = String(dateInput.getMonth() + 1).padStart(2, "0");
      const year = dateInput.getFullYear();
      return `${date}/${month}/${year}`;
    }

    // Handle Excel serial date numbers
    if (typeof dateInput === "number") {
      const excelEpoch = new Date(1900, 0, 1);
      const daysOffset = dateInput - 2; // Excel has a leap year bug for 1900
      const resultDate = new Date(
        excelEpoch.getTime() + daysOffset * 24 * 60 * 60 * 1000
      );

      const date = String(resultDate.getDate()).padStart(2, "0");
      const month = String(resultDate.getMonth() + 1).padStart(2, "0");
      const year = resultDate.getFullYear();
      return `${date}/${month}/${year}`;
    }

    // Handle string dates
    if (typeof dateInput === "string") {
      const cleanInput = dateInput.trim();

      // Try various date formats
      const formats = [
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // dd/mm/yyyy
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // yyyy-mm-dd
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // dd-mm-yyyy
      ];

      for (const format of formats) {
        const match = cleanInput.match(format);
        if (match) {
          let day, month, year;

          if (format.source.startsWith("^(\\d{4})")) {
            // yyyy-mm-dd format
            [, year, month, day] = match;
          } else {
            // dd/mm/yyyy or dd-mm-yyyy format
            [, day, month, year] = match;
          }

          const dayNum = parseInt(day, 10);
          const monthNum = parseInt(month, 10);
          const yearNum = parseInt(year, 10);

          if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12) {
            return `${String(dayNum).padStart(2, "0")}/${String(
              monthNum
            ).padStart(2, "0")}/${yearNum}`;
          }
        }
      }
    }

    return "";
  }

  static formatDayOfWeek(day) {
    if (!day) return "";

    const dayMap = {
      2: "Thứ Hai",
      3: "Thứ Ba",
      4: "Thứ Tư",
      5: "Thứ Năm",
      6: "Thứ Sáu",
      7: "Thứ Bảy",
      CN: "Chủ Nhật",
      "THỨ 2": "Thứ Hai",
      "THỨ 3": "Thứ Ba",
      "THỨ 4": "Thứ Tư",
      "THỨ 5": "Thứ Năm",
      "THỨ 6": "Thứ Sáu",
      "THỨ 7": "Thứ Bảy",
      "CHỦ NHẬT": "Chủ Nhật",
    };

    const normalizedDay = String(day).toUpperCase().trim();
    return dayMap[normalizedDay] || String(day);
  }

  static timeToMinutes(timeStr) {
    if (!timeStr) return 0;

    const timeParts = timeStr.split(":");
    const hours = parseInt(timeParts[0], 10) || 0;
    const minutes = parseInt(timeParts[1], 10) || 0;

    return hours * 60 + minutes;
  }

  static isTimeInRange(currentTime, startTime, endTime) {
    const current = this.timeToMinutes(currentTime);
    const start = this.timeToMinutes(`${startTime}:00`);
    const end = this.timeToMinutes(`${endTime}:00`);
    return current >= start && current <= end;
  }

  static isTimeInRangeWithSeconds(currentTime, startTime, endTime) {
    if (!currentTime || !startTime || !endTime) return false;

    // Add seconds if not present
    const fullStartTime =
      startTime.includes(":") && startTime.split(":").length === 2
        ? `${startTime}:00`
        : startTime;

    const fullEndTime =
      endTime.includes(":") && endTime.split(":").length === 2
        ? `${endTime}:00`
        : endTime;

    const current = this.timeToMinutes(currentTime);
    const start = this.timeToMinutes(fullStartTime);
    const end = this.timeToMinutes(fullEndTime);

    return current >= start && current <= end;
  }

  static isTimeOverdue(endTime, currentTime) {
    const endMinutes = this.timeToMinutes(endTime);
    const currentMinutes = this.timeToMinutes(currentTime);
    return currentMinutes > endMinutes;
  }

  static checkTimeConflict(meeting1, meeting2) {
    const start1 = this.timeToMinutes(meeting1.startTime);
    const end1 = this.timeToMinutes(meeting1.endTime);
    const start2 = this.timeToMinutes(meeting2.startTime);
    const end2 = this.timeToMinutes(meeting2.endTime);

    return !(end1 <= start2 || end2 <= start1);
  }

  static calculateEndTime(startTime) {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = startMinutes + 60; // Default 1 hour duration

    const hours = Math.floor(endMinutes / 60);
    const minutes = endMinutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  }

  static calculateDuration(startTime, endTime) {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    const durationMinutes = endMinutes - startMinutes;

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (hours > 0) {
      return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  }

  static getFormattedDate() {
    const daysOfWeek = [
      "Chủ Nhật",
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
    ];
    const months = [
      "Tháng 1",
      "Tháng 2",
      "Tháng 3",
      "Tháng 4",
      "Tháng 5",
      "Tháng 6",
      "Tháng 7",
      "Tháng 8",
      "Tháng 9",
      "Tháng 10",
      "Tháng 11",
      "Tháng 12",
    ];

    const now = new Date();
    now.setHours(now.getHours() + TIME_CONFIG.TIMEZONE_OFFSET);

    const dayOfWeek = daysOfWeek[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();

    return `${dayOfWeek}, ${day} ${month} ${year}`;
  }
}

/**
 * String and Formatting Utilities
 */
export class FormatUtils {
  static formatDuration(duration) {
    if (!duration) return "";

    if (typeof duration === "number") {
      const hours = Math.floor(duration);
      const minutes = Math.round((duration - hours) * 60);
      return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
    }

    if (typeof duration === "string") {
      return duration.trim();
    }

    return String(duration);
  }

  static formatRoomName(room) {
    if (!room) return "";

    const roomStr = String(room).trim();
    const roomMappings = {
      "PHÒNG HỌP LẦU 3": "Phòng họp lầu 3",
      "P.HỌP LẦU 3": "Phòng họp lầu 3",
      "PHÒNG HỌP LẦU 4": "Phòng họp lầu 4",
      "P.HỌP LẦU 4": "Phòng họp lầu 4",
    };

    const upperRoom = roomStr.toUpperCase();
    return roomMappings[upperRoom] || roomStr;
  }

  static normalizeRoomName(name) {
    if (!name) return "";
    return name.toLowerCase().replace(/\s+/g, " ").trim();
  }

  static normalizeRoomKey(roomName) {
    const keyMappings = {
      "P.HỌP LẦU 3": "Phòng họp lầu 3",
      "PHÒNG HỌP LẦU 3": "Phòng họp lầu 3",
      "Phòng họp lầu 3": "Phòng họp lầu 3",
      "PHÒNG HỌP LẦU 4": "Phòng họp lầu 4",
      "Phòng họp lầu 4": "Phòng họp lầu 4",
    };

    return keyMappings[roomName] || roomName;
  }

  static capitalizeFirst(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  static sanitizeRoomName(room) {
    if (!room) return "";
    return room.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  }

  static determinePurpose(content) {
    if (!content) return "Khác";

    const lowerContent = content.toLowerCase();

    if (lowerContent.includes("họp")) return "Họp";
    if (lowerContent.includes("đào tạo")) return "Đào tạo";
    if (lowerContent.includes("pv") || lowerContent.includes("phỏng vấn"))
      return "Phỏng vấn";
    if (lowerContent.includes("thảo luận")) return "Thảo luận";
    if (lowerContent.includes("báo cáo")) return "Báo cáo";

    return "Khác";
  }

  static parseMeetingInfo(cellContent) {
    if (!cellContent) return { purpose: "", content: "" };

    const lines = cellContent.split("\r\n");
    const content = lines[0];

    const purpose = this.determinePurpose(content);

    return { purpose, content };
  }
}

/**
 * Data Validation Utilities
 */
export class ValidationUtils {
  static isValidTime(timeStr) {
    if (!timeStr) return false;

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(timeStr);
  }

  static isValidDate(dateStr) {
    if (!dateStr) return false;

    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateStr.match(dateRegex);

    if (!match) return false;

    const [, day, month, year] = match;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    return (
      dayNum >= 1 &&
      dayNum <= 31 &&
      monthNum >= 1 &&
      monthNum <= 12 &&
      yearNum >= 1900 &&
      yearNum <= 2100
    );
  }

  static isValidMeetingState(meeting, currentTime) {
    if (!meeting || !currentTime) return false;

    const startTime = meeting.startTime;
    const endTime = meeting.endTime;

    return (
      DateTimeUtils.isTimeInRangeWithSeconds(currentTime, startTime, endTime) &&
      !meeting.isEnded &&
      !meeting.forceEndedByUser
    );
  }
}

/**
 * DOM Utilities
 */
export class DOMUtils {
  static findRoomSection(roomCode) {
    const normalizeRoomName = (name) =>
      name.toLowerCase().replace(/\s+/g, " ").trim();

    const normalizedRoomCode = normalizeRoomName(roomCode);
    const roomSections = document.querySelectorAll(".room-section");

    // Strategy 1: Find by room-number element text content
    const byRoomNumber = Array.from(roomSections).find((section) => {
      const roomElement = section.querySelector(".room-number");
      return (
        roomElement &&
        normalizeRoomName(roomElement.textContent) === normalizedRoomCode
      );
    });

    if (byRoomNumber) return byRoomNumber;

    // Strategy 2: Find by room-section attribute
    const byAttribute = Array.from(roomSections).find(
      (section) =>
        section.getAttribute("data-room") === roomCode ||
        normalizeRoomName(section.getAttribute("data-room") || "") ===
          normalizedRoomCode
    );

    if (byAttribute) return byAttribute;

    // Strategy 3: Find by heading or title content within the section
    const byHeading = Array.from(roomSections).find((section) => {
      const headings = section.querySelectorAll(
        "h1, h2, h3, h4, h5, .room-title"
      );
      return Array.from(headings).some(
        (h) =>
          normalizeRoomName(h.textContent) === normalizedRoomCode ||
          normalizeRoomName(h.textContent).includes(normalizedRoomCode)
      );
    });

    return byHeading;
  }

  static addCSS(css) {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    return style;
  }

  static createElement(tag, className, innerHTML) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
  }
}

export default {
  DateTimeUtils,
  FormatUtils,
  ValidationUtils,
  DOMUtils,
};
