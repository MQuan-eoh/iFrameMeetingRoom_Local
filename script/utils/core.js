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
    // Get current date in Vietnam time (UTC+7)
    const now = new Date();

    // Check if we're already in Vietnam timezone (UTC+7)
    const timezoneOffsetHours = -now.getTimezoneOffset() / 60;
    let vietnamTime;

    if (timezoneOffsetHours === TIME_CONFIG.TIMEZONE_OFFSET) {
      // Already in Vietnam timezone, use local time directly
      vietnamTime = now;
      console.log(
        ` Using local time (already in Vietnam timezone UTC+${TIME_CONFIG.TIMEZONE_OFFSET})`
      );
    } else {
      // Convert to Vietnam timezone
      const offsetDifference =
        TIME_CONFIG.TIMEZONE_OFFSET - timezoneOffsetHours;
      vietnamTime = new Date(now.getTime() + offsetDifference * 60 * 60 * 1000);
      console.log(
        `Converting from UTC+${timezoneOffsetHours} to Vietnam time UTC+${TIME_CONFIG.TIMEZONE_OFFSET}`
      );
    }

    const date = String(vietnamTime.getDate()).padStart(2, "0");
    const month = String(vietnamTime.getMonth() + 1).padStart(2, "0");
    const year = vietnamTime.getFullYear();

    console.log(`Current Vietnam date: ${date}/${month}/${year}`);
    return `${date}/${month}/${year}`;
  }

  static getCurrentTime() {
    // Get current time in Vietnam time (UTC+7)
    const now = new Date();

    // Check if we're already in Vietnam timezone (UTC+7)
    const timezoneOffsetHours = -now.getTimezoneOffset() / 60;
    let vietnamTime;

    if (timezoneOffsetHours === TIME_CONFIG.TIMEZONE_OFFSET) {
      // Already in Vietnam timezone, use local time directly
      vietnamTime = now;
      console.log(
        `Using local time (already in Vietnam timezone UTC+${TIME_CONFIG.TIMEZONE_OFFSET})`
      );
    } else {
      // Convert to Vietnam timezone
      const offsetDifference =
        TIME_CONFIG.TIMEZONE_OFFSET - timezoneOffsetHours;
      vietnamTime = new Date(now.getTime() + offsetDifference * 60 * 60 * 1000);
      console.log(
        `Converting from UTC+${timezoneOffsetHours} to Vietnam time UTC+${TIME_CONFIG.TIMEZONE_OFFSET}`
      );
    }

    const hours = String(vietnamTime.getHours()).padStart(2, "0");
    const minutes = String(vietnamTime.getMinutes()).padStart(2, "0");
    const seconds = String(vietnamTime.getSeconds()).padStart(2, "0");

    console.log(`Current Vietnam time: ${hours}:${minutes}:${seconds}`);
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
    if (!timeStr) {
      console.warn("Attempted to convert empty time string to minutes");
      return 0;
    }

    try {
      // Handle various time formats
      const timeParts = timeStr.split(":");

      // Get hours and minutes, defaulting to 0 if invalid
      const hours = parseInt(timeParts[0], 10) || 0;
      const minutes = parseInt(timeParts[1], 10) || 0;

      // Log for debugging
      console.log(
        `Converting time ${timeStr} to minutes: ${hours}h ${minutes}m = ${
          hours * 60 + minutes
        } minutes`
      );

      return hours * 60 + minutes;
    } catch (error) {
      console.error("Error converting time to minutes:", timeStr, error);
      return 0;
    }
  }

  static isTimeInRange(currentTime, startTime, endTime) {
    const current = this.timeToMinutes(currentTime);
    const start = this.timeToMinutes(`${startTime}:00`);
    const end = this.timeToMinutes(`${endTime}:00`);
    return current >= start && current <= end;
  }

  static isTimeInRangeWithSeconds(currentTime, startTime, endTime) {
    if (!currentTime || !startTime || !endTime) {
      console.warn("Missing time parameters:", {
        currentTime,
        startTime,
        endTime,
      });
      return false;
    }

    try {
      // Ensure we're working with properly formatted time strings
      const formatTimeForComparison = (timeStr) => {
        // If time already includes seconds, return as is
        if (timeStr.split(":").length === 3) return timeStr;

        // If time has hours:minutes format, add seconds
        if (timeStr.split(":").length === 2) return `${timeStr}:00`;

        // Default case - assume it's a simple time string
        return timeStr;
      };

      // Normalize all times to ensure consistent comparison
      let normalizedCurrentTime = currentTime;
      const normalizedStartTime = formatTimeForComparison(startTime);
      const normalizedEndTime = formatTimeForComparison(endTime);

      // For current time, we want to use just hours:minutes for comparison
      // This handles cases where seconds might affect the comparison
      if (normalizedCurrentTime.split(":").length > 2) {
        normalizedCurrentTime = normalizedCurrentTime
          .split(":")
          .slice(0, 2)
          .join(":");
      }

      console.log(
        `VIETNAM TIME CHECK - Current: ${normalizedCurrentTime}, Start: ${normalizedStartTime}, End: ${normalizedEndTime}`
      );

      // Convert times to minutes for easy comparison
      const current = this.timeToMinutes(normalizedCurrentTime);
      const start = this.timeToMinutes(normalizedStartTime);
      const end = this.timeToMinutes(normalizedEndTime);

      console.log(
        `Time in minutes - Current: ${current}, Start: ${start}, End: ${end}`
      );

      const isInRange = current >= start && current <= end;
      console.log(
        `Time check result: ${normalizedCurrentTime} in range ${normalizedStartTime}-${normalizedEndTime}? ${
          isInRange ? "YES" : "NO"
        }`
      );

      return isInRange;
    } catch (error) {
      console.error("Error in time range check:", error, {
        currentTime,
        startTime,
        endTime,
      });
      return false;
    }
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

    // Check if we're already in Vietnam timezone (UTC+7)
    const timezoneOffsetHours = -now.getTimezoneOffset() / 60;
    let vietnamTime;

    if (timezoneOffsetHours === TIME_CONFIG.TIMEZONE_OFFSET) {
      // Already in Vietnam timezone, use local time directly
      vietnamTime = now;
    } else {
      // Convert to Vietnam timezone
      const offsetDifference =
        TIME_CONFIG.TIMEZONE_OFFSET - timezoneOffsetHours;
      vietnamTime = new Date(now.getTime() + offsetDifference * 60 * 60 * 1000);
    }

    const dayOfWeek = daysOfWeek[vietnamTime.getDay()];
    const day = vietnamTime.getDate();
    const month = months[vietnamTime.getMonth()];
    const year = vietnamTime.getFullYear();

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
    if (!roomCode) {
      console.error("findRoomSection called with null/empty roomCode");
      return null;
    }

    console.log(`Finding room section for: "${roomCode}"`);

    // Normalized Room Name Map for better matching - add all possible variations
    const roomNameMap = {
      "phòng họp lầu 3": [
        "phong hop lau 3",
        "p.họp lầu 3",
        "p. họp lầu 3",
        "phòng 3",
        "lầu 3",
      ],
      "phòng họp lầu 4": [
        "phong hop lau 4",
        "p.họp lầu 4",
        "p. họp lầu 4",
        "phòng 4",
        "lầu 4",
      ],
    };

    const normalizeRoomName = (name) => {
      if (!name) return "";
      return name.toLowerCase().replace(/\s+/g, " ").trim();
    };

    const normalizedRoomCode = normalizeRoomName(roomCode);
    console.log(`Normalized room code: "${normalizedRoomCode}"`);

    // First try to find in rooms-container which is the main container
    const roomsContainer = document.querySelector(".rooms-container");
    if (roomsContainer) {
      console.log("Found rooms-container, searching within it");
      const roomSections = roomsContainer.querySelectorAll(".room-section");
      console.log(
        `Found ${roomSections.length} room sections in rooms-container`
      );

      // Strategy 1: Find by room-number element text content
      for (const section of Array.from(roomSections)) {
        const roomElement = section.querySelector(".room-number");
        if (roomElement) {
          const sectionRoomName = normalizeRoomName(roomElement.textContent);
          console.log(
            `Comparing: "${sectionRoomName}" with "${normalizedRoomCode}"`
          );

          // Try exact match first
          if (sectionRoomName === normalizedRoomCode) {
            console.log(
              `Found exact matching room section: ${roomElement.textContent}`
            );
            return section;
          }

          // Try partial matches
          if (
            sectionRoomName.includes(normalizedRoomCode) ||
            normalizedRoomCode.includes(sectionRoomName)
          ) {
            console.log(
              `Found partial matching room section: ${roomElement.textContent}`
            );
            return section;
          }

          // Try alternative names from room map
          for (const [key, aliases] of Object.entries(roomNameMap)) {
            if (
              normalizedRoomCode.includes(key) ||
              key.includes(normalizedRoomCode)
            ) {
              if (
                sectionRoomName.includes(key) ||
                key.includes(sectionRoomName)
              ) {
                console.log(`Found room section via room map key: ${key}`);
                return section;
              }

              // Check aliases
              for (const alias of aliases) {
                if (
                  sectionRoomName.includes(alias) ||
                  alias.includes(sectionRoomName)
                ) {
                  console.log(
                    `Found room section via room map alias: ${alias}`
                  );
                  return section;
                }
              }
            }
          }
        }
      }

      // If still not found, try using ordinals
      // i.e., if looking for "Phòng họp lầu 3" and there are exactly 2 room sections,
      // use the first one (index 0) if we're looking for "lầu 3" or "phòng 3"
      if (roomSections.length > 0) {
        if (
          normalizedRoomCode.includes("3") ||
          normalizedRoomCode.includes("lầu 3") ||
          normalizedRoomCode.includes("phòng 3")
        ) {
          console.log(`Using room section at index 0 for: ${roomCode}`);
          return roomSections[0];
        } else if (
          normalizedRoomCode.includes("4") ||
          normalizedRoomCode.includes("lầu 4") ||
          normalizedRoomCode.includes("phòng 4")
        ) {
          if (roomSections.length > 1) {
            console.log(`Using room section at index 1 for: ${roomCode}`);
            return roomSections[1];
          } else {
            console.log(
              `Only one room section found, using it for: ${roomCode}`
            );
            return roomSections[0];
          }
        }
      }
    }

    // If not found in rooms-container, try all room sections in the document
    const allRoomSections = document.querySelectorAll(".room-section");
    console.log(
      `Searching in all ${allRoomSections.length} room sections in document`
    );

    // Strategy 1: Find by room-number element text content
    const byRoomNumber = Array.from(allRoomSections).find((section) => {
      const roomElement = section.querySelector(".room-number");
      return (
        roomElement &&
        (normalizeRoomName(roomElement.textContent) === normalizedRoomCode ||
          normalizeRoomName(roomElement.textContent).includes(
            normalizedRoomCode
          ) ||
          normalizedRoomCode.includes(
            normalizeRoomName(roomElement.textContent)
          ))
      );
    });

    if (byRoomNumber) {
      console.log(`Found room section by room-number (document-wide)`);
      return byRoomNumber;
    }

    // Strategy 2: Find by room-section attribute
    const byAttribute = Array.from(allRoomSections).find(
      (section) =>
        section.getAttribute("data-room") === roomCode ||
        normalizeRoomName(section.getAttribute("data-room") || "") ===
          normalizedRoomCode
    );

    if (byAttribute) {
      console.log(`Found room section by data-room attribute`);
      return byAttribute;
    }

    // Strategy 3: Find by heading or title content within the section
    const byHeading = Array.from(allRoomSections).find((section) => {
      const headings = section.querySelectorAll(
        "h1, h2, h3, h4, h5, .room-title"
      );
      return Array.from(headings).some(
        (h) =>
          normalizeRoomName(h.textContent) === normalizedRoomCode ||
          normalizeRoomName(h.textContent).includes(normalizedRoomCode)
      );
    });

    if (byHeading) {
      console.log(`Found room section by heading content`);
      return byHeading;
    }

    // Last resort: If there are few room sections, just use positional matching
    if (allRoomSections.length <= 2) {
      if (
        normalizedRoomCode.includes("3") ||
        normalizedRoomCode.includes("lầu 3")
      ) {
        console.log(`Using first room section as fallback for: ${roomCode}`);
        return allRoomSections[0];
      } else if (
        normalizedRoomCode.includes("4") ||
        normalizedRoomCode.includes("lầu 4")
      ) {
        if (allRoomSections.length > 1) {
          console.log(`Using second room section as fallback for: ${roomCode}`);
          return allRoomSections[1];
        } else {
          console.log(
            `Only one room section found, using it as fallback for: ${roomCode}`
          );
          return allRoomSections[0];
        }
      }
    }

    console.warn(
      `Could not find room section for "${roomCode}" after trying all strategies`
    );
    return null;
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
