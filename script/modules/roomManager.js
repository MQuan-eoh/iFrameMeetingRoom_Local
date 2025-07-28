/**
 * Room Manager
 * Handles room status updates, meeting information display, and room-specific operations
 */

import {
  DateTimeUtils,
  FormatUtils,
  ValidationUtils,
  DOMUtils,
} from "../utils/core.js";
import {
  ROOM_CONFIG,
  MEETING_STATUS,
  CSS_CLASSES,
} from "../config/constants.js";

export class RoomManager {
  constructor() {
    this.previousStates = {};
    this.updateInterval = null;

    // Ensure room sections are created when the DOM is ready
    document.addEventListener("DOMContentLoaded", () => {
      console.log("🏢 RoomManager: DOM ready, initializing room sections");
      const roomsContainer = document.querySelector(".rooms-container");
      if (roomsContainer) {
        this._ensureRoomSections(roomsContainer);
      } else {
        console.warn("⚠️ RoomManager: Cannot find .rooms-container element");
      }
    });
  }

  /**
   * Update all room statuses with meeting data
   */
  updateRoomStatus(data) {
    console.log(
      "🔄 Updating room status with data at:",
      DateTimeUtils.getCurrentTime()
    );

    const currentDate = DateTimeUtils.getCurrentDate();
    const currentTime = DateTimeUtils.getCurrentTime();

    console.log("📅 Current date:", currentDate);
    console.log("⏰ Current time:", currentTime);

    // Use latest meeting data from global state if not provided
    if (!data || !Array.isArray(data)) {
      data = window.currentMeetingData || [];
      console.log("📊 Using global meeting data:", data.length, "meetings");
    }

    // Filter for today's meetings
    const todayMeetings = data.filter((meeting) => {
      const isToday = meeting.date === currentDate;
      return isToday;
    });

    console.log("📅 Today's meetings:", todayMeetings.length);

    // Save state for debugging
    this.lastUpdateTime = new Date();
    this.lastUpdateData = [...todayMeetings];

    // Check if we have a rooms-container element
    const roomsContainer = document.querySelector(".rooms-container");
    if (roomsContainer) {
      console.log("🏢 Found rooms-container, ensuring all rooms are present");

      // Ensure all rooms have room-section elements
      this._ensureRoomSections(roomsContainer);
    }

    const roomsToUpdate = Object.values(ROOM_CONFIG.ROOMS);
    console.log(
      `🏢 Updating ${roomsToUpdate.length} rooms: ${roomsToUpdate.join(", ")}`
    );

    roomsToUpdate.forEach((roomName) => {
      console.log(`🔄 Processing room update for: ${roomName}`);

      // If no data or empty data, pass empty array to indicate no meetings
      if (!todayMeetings || todayMeetings.length === 0) {
        console.log(
          `ℹ️ No meetings data for ${roomName}, updating with empty array`
        );
        this.updateSingleRoomStatus(roomName, [], currentTime);
      } else {
        // Filter meetings specifically for this room to improve debugging
        const roomSpecificMeetings = todayMeetings.filter((meeting) => {
          const meetingRoomName = meeting.room?.toLowerCase().trim();
          const currentRoomName = roomName.toLowerCase().trim();
          const isMatch =
            meetingRoomName === currentRoomName ||
            meetingRoomName.includes(currentRoomName) ||
            currentRoomName.includes(meetingRoomName);

          if (isMatch) {
            console.log(
              `✓ Found meeting for ${roomName}: "${meeting.content}" (${meeting.startTime}-${meeting.endTime})`
            );
          }
          return isMatch;
        });

        console.log(
          `🔍 Found ${roomSpecificMeetings.length} meetings for ${roomName}`
        );
        this.updateSingleRoomStatus(roomName, todayMeetings, currentTime);
      }
    });

    // Update the data display after refreshing rooms
    this.updateScheduleTable(todayMeetings);
  }

  /**
   * Update status for a specific room
   */
  updateSingleRoomStatus(roomCode, meetings, currentTime) {
    console.log(
      `📋 Updating room status for: "${roomCode}" with current VIETNAM time: ${currentTime}`
    );

    // First, ensure room sections are created if they don't exist
    const roomsContainer = document.querySelector(".rooms-container");
    if (roomsContainer) {
      this._ensureRoomSections(roomsContainer);
    } else {
      console.error(`❌ Cannot find rooms-container element in DOM!`);
    }

    // Find room section in DOM with improved search
    const roomSection = DOMUtils.findRoomSection(roomCode);

    if (!roomSection) {
      console.warn(`❌ No room section found for room code: ${roomCode}`);
      return;
    } else {
      console.log(`✅ Found room section for: ${roomCode}`);
    }

    // Get UI elements
    const uiElements = this._getRoomUIElements(roomSection);

    // Log which elements were found for debugging
    console.log(`🔍 Room elements found for ${roomCode}:`, {
      titleElement: !!uiElements.titleElement,
      startTimeElement: !!uiElements.startTimeElement,
      endTimeElement: !!uiElements.endTimeElement,
      statusIndicator: !!uiElements.statusIndicator,
      indicatorDot: !!uiElements.indicatorDot,
    });

    // If any critical UI elements are missing, try to fix the room section
    if (
      !uiElements.titleElement ||
      !uiElements.statusIndicator ||
      !uiElements.indicatorDot
    ) {
      console.log(
        `⚠️ Missing UI elements for ${roomCode}, attempting to repair room section`
      );
      // Remove the existing section and recreate it
      if (roomSection.parentNode) {
        roomSection.parentNode.removeChild(roomSection);
      }

      if (roomsContainer) {
        this._ensureRoomSections(roomsContainer);
        // Try again with the newly created section
        const newRoomSection = DOMUtils.findRoomSection(roomCode);
        if (newRoomSection) {
          console.log(`✅ Successfully recreated room section for ${roomCode}`);
          return this.updateSingleRoomStatus(roomCode, meetings, currentTime);
        }
      }
    }

    // If no meetings provided, try to get from global state
    if (!meetings || !Array.isArray(meetings) || meetings.length === 0) {
      if (
        window.currentMeetingData &&
        Array.isArray(window.currentMeetingData)
      ) {
        console.log("Using global meeting data for room update");
        meetings = window.currentMeetingData;

        // Filter for today
        const currentDate = DateTimeUtils.getCurrentDate();
        meetings = meetings.filter((m) => m.date === currentDate);
      }
    }

    // Filter meetings for current room (with more flexible matching)
    const roomMeetings = meetings.filter((meeting) => {
      if (!meeting || !meeting.room) return false;

      const normalizedRoomName = FormatUtils.normalizeRoomName(meeting.room);
      const normalizedRoomCode = FormatUtils.normalizeRoomName(roomCode);

      // Check both normalized name and if the room contains the room code
      return (
        normalizedRoomName === normalizedRoomCode ||
        normalizedRoomName.includes(normalizedRoomCode) ||
        normalizedRoomCode.includes(normalizedRoomName)
      );
    });

    console.log(`Found ${roomMeetings.length} meetings for room "${roomCode}"`);

    // Find active meeting with more accurate time comparison
    const activeMeeting = roomMeetings.find((meeting) => {
      if (!meeting.startTime || !meeting.endTime) return false;

      return (
        DateTimeUtils.isTimeInRangeWithSeconds(
          currentTime,
          meeting.startTime,
          meeting.endTime
        ) &&
        !meeting.isEnded &&
        !meeting.forceEndedByUser
      );
    });

    // Update UI elements
    this._updateRoomUIElements(
      roomCode,
      uiElements,
      activeMeeting,
      roomMeetings,
      currentTime
    );
  }

  /**
   * Render room page for individual room view
   */
  renderRoomPage(data, roomKeyword, roomName) {
    console.log("Rendering room page for:", roomName);
    console.log("Data received:", data);

    // Filter meetings for this room
    const roomMeetings = data.filter(
      (meeting) =>
        FormatUtils.normalizeRoomKey(meeting.room) ===
        FormatUtils.normalizeRoomKey(roomKeyword)
    );
    console.log("Filtered room meetings:", roomMeetings);

    // Filter for today's meetings
    const today = new Date();
    const filteredData = roomMeetings.filter((meeting) => {
      const meetingDate = new Date(meeting.date.split("/").reverse().join("-"));
      return meetingDate.toDateString() === today.toDateString();
    });
    console.log("Today's meetings:", filteredData);

    // Get current time for meeting status
    const currentTime = DateTimeUtils.getCurrentTime();
    const currentTimeStr = currentTime.substring(0, 5); // Remove seconds for comparison

    // Find active meeting
    const currentMeeting = filteredData.find((meeting) => {
      const startTime = meeting.startTime;
      const endTime = meeting.endTime;
      return (
        currentTimeStr >= startTime &&
        currentTimeStr <= endTime &&
        !meeting.isEnded &&
        !meeting.forceEndedByUser
      );
    });
    console.log("Current meeting:", currentMeeting);

    // Filter upcoming meetings
    const upcomingMeetings = filteredData
      .filter((meeting) => {
        const startTime = meeting.startTime;
        return (
          currentTimeStr <= startTime &&
          !meeting.isEnded &&
          !meeting.forceEndedByUser
        );
      })
      .sort((a, b) => {
        const timeA = a.startTime.split(":").map(Number);
        const timeB = b.startTime.split(":").map(Number);
        return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
      });

    console.log("Upcoming meetings:", upcomingMeetings);

    // Generate room page HTML
    const template = this._generateRoomPageTemplate(
      roomName,
      currentMeeting,
      upcomingMeetings
    );

    // Update DOM
    const container = document.querySelector(".meeting-container");
    if (container) {
      container.innerHTML = template;
    }

    // Setup event handlers for this room page
    this._setupRoomPageEventHandlers(roomName);

    return template;
  }

  /**
   * Setup auto-update for room statuses
   */
  startAutoUpdate(data) {
    // Clear existing interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Initial update
    this.updateRoomStatus(data);

    // Set up more frequent updates (every 15 seconds)
    this.updateInterval = setInterval(() => {
      console.log("🔄 Auto-updating room statuses...");

      // Always get the latest data from global state
      const latestData = window.currentMeetingData || [];
      this.updateRoomStatus(latestData);
    }, 15000); // Update every 15 seconds

    // Add room status refresh event listener
    document.addEventListener("refreshRoomStatus", () => {
      console.log("🔄 Room status refresh explicitly requested");
      const latestData = window.currentMeetingData || [];
      this.updateRoomStatus(latestData);
    });

    // Listen for meeting data updates to refresh rooms
    document.addEventListener("meetingDataUpdated", (event) => {
      console.log("🔄 Meeting data updated, refreshing room status");
      const meetingData =
        event.detail?.meetings || window.currentMeetingData || [];
      this.updateRoomStatus(meetingData);
    });

    // Listen for room status updates specifically
    document.addEventListener("roomStatusUpdate", (event) => {
      console.log("🔄 Room status update event received");
      const todayMeetings = event.detail?.todayMeetings;
      const allMeetings = window.currentMeetingData || [];
      this.updateRoomStatus(todayMeetings || allMeetings);
    });

    // Also listen for dashboard updates as they might contain fresh meeting data
    document.addEventListener("dashboardUpdate", (event) => {
      console.log(
        "🔄 Dashboard update event received, checking for room updates"
      );
      const todayMeetings = event.detail?.todayMeetings;
      if (todayMeetings && todayMeetings.length > 0) {
        this.updateRoomStatus(todayMeetings);
      }
    });

    console.log(
      "✅ Auto-update started for room statuses with multiple event listeners"
    );
  }

  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log("Auto-update stopped for room statuses");
    }
  }

  /**
   * Handle schedule table updates
   */
  updateScheduleTable(data) {
    const tableBody = document.querySelector(".schedule-table");
    const headerRow = tableBody?.querySelector(".table-header");

    if (!tableBody) return;

    // Remove old rows
    Array.from(tableBody.children)
      .filter((child) => child !== headerRow)
      .forEach((child) => child.remove());

    // If no data, show empty state
    if (!data || data.length === 0) {
      const emptyRow = DOMUtils.createElement("div", "table-row empty-state");
      emptyRow.setAttribute("role", "row");
      emptyRow.innerHTML = `
        <div role="cell" class="empty-message">No meetings scheduled for today.</div>
      `;
      tableBody.appendChild(emptyRow);

      // Add styling for empty message
      const style = DOMUtils.addCSS(`
        .table-row.empty-state {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100px;
          min-width: 180px;
          background-color: rgba(245, 245, 245, 0.8);
        }
        
        .empty-message {
          text-align: center;
          width: 100%;
          min-width: 380px !important;
          padding: 20px;
          color: #666;
          font-style: italic;
          font-size: 16px;
        }
      `);

      return;
    }

    // Add meeting rows
    data.forEach((meeting) => {
      const row = DOMUtils.createElement("div", "table-row");
      row.setAttribute("role", "row");
      row.innerHTML = `
        <div role="cell">${meeting.id}</div>
        <div role="cell">${meeting.date}</div>
        <div role="cell">${meeting.dayOfWeek}</div>
        <div role="cell">${meeting.room}</div>
        <div role="cell">${meeting.startTime}</div>
        <div role="cell">${meeting.endTime}</div>
        <div role="cell">${meeting.duration}</div>
        <div role="cell">${meeting.purpose}</div>
        <div role="cell">${meeting.content}</div>
      `;
      tableBody.appendChild(row);
    });

    console.log("Schedule table updated with", data.length, "meetings");
  }

  /**
   * Load dynamic room page
   */
  loadDynamicPage(pageType) {
    const data = window.currentMeetingData || [];

    if (pageType === "room3") {
      return this.renderRoomPage(data, "Phòng họp lầu 3", "Phòng họp lầu 3");
    } else if (pageType === "room4") {
      return this.renderRoomPage(data, "Phòng họp lầu 4", "Phòng họp lầu 4");
    }

    console.warn("Unknown page type:", pageType);
    return "";
  }

  /**
   * Private helper methods
   */
  _getRoomUIElements(roomSection) {
    console.log(`🔍 Finding UI elements in room section:`, roomSection);

    // Get standard UI elements using CSS classes
    const standardElements = {
      titleElement: roomSection.querySelector(`.${CSS_CLASSES.MEETING_TITLE}`),
      startTimeElement: roomSection.querySelector(`.${CSS_CLASSES.START_TIME}`),
      endTimeElement: roomSection.querySelector(`.${CSS_CLASSES.END_TIME}`),
      statusIndicator: roomSection.querySelector(
        `.${CSS_CLASSES.STATUS_INDICATOR} .status-text`
      ),
      indicatorDot: roomSection.querySelector(
        `.${CSS_CLASSES.STATUS_INDICATOR} .${CSS_CLASSES.INDICATOR_DOT}`
      ),
    };

    // Log any missing elements
    const missingElements = Object.entries(standardElements)
      .filter(([_, element]) => !element)
      .map(([name]) => name);

    if (missingElements.length > 0) {
      console.warn(
        `⚠️ Missing room UI elements: ${missingElements.join(", ")}`
      );

      // Try alternative selectors for common issues
      if (!standardElements.titleElement) {
        standardElements.titleElement =
          roomSection.querySelector(".meeting-title") ||
          roomSection.querySelector('[class*="meeting-title"]');
        console.log(
          `🔍 Alternative title element:`,
          standardElements.titleElement
        );
      }

      if (!standardElements.startTimeElement) {
        standardElements.startTimeElement =
          roomSection.querySelector(".start-time") ||
          roomSection.querySelector('[class*="start-time"]');
        console.log(
          `🔍 Alternative start time element:`,
          standardElements.startTimeElement
        );
      }

      if (!standardElements.endTimeElement) {
        standardElements.endTimeElement =
          roomSection.querySelector(".end-time") ||
          roomSection.querySelector('[class*="end-time"]');
        console.log(
          `🔍 Alternative end time element:`,
          standardElements.endTimeElement
        );
      }

      if (!standardElements.statusIndicator) {
        standardElements.statusIndicator =
          roomSection.querySelector(".status-text") ||
          roomSection.querySelector('[class*="status-text"]');
        console.log(
          `🔍 Alternative status indicator:`,
          standardElements.statusIndicator
        );
      }

      if (!standardElements.indicatorDot) {
        standardElements.indicatorDot =
          roomSection.querySelector(".indicator-dot") ||
          roomSection.querySelector('[class*="indicator-dot"]');
        console.log(
          `🔍 Alternative indicator dot:`,
          standardElements.indicatorDot
        );
      }
    } else {
      console.log(`✅ All room UI elements found successfully`);
    }

    return standardElements;
  }

  _updateRoomUIElements(
    roomCode,
    elements,
    activeMeeting,
    allMeetings,
    currentTime
  ) {
    const {
      titleElement,
      startTimeElement,
      endTimeElement,
      statusIndicator,
      indicatorDot,
    } = elements;

    // Debug logs
    console.log(
      `🔍 Room ${roomCode} update - Active meeting:`,
      activeMeeting ? activeMeeting.id : "none"
    );
    console.log(
      `🔍 Room ${roomCode} update - Total meetings:`,
      allMeetings.length
    );
    console.log(`🔍 Room ${roomCode} update - Current time:`, currentTime);

    // Normalize current time for comparison (remove seconds)
    const normalizedCurrentTime = currentTime.split(":").slice(0, 2).join(":");

    // Filter meetings for just this room to avoid cross-room contamination
    const roomMeetings = allMeetings.filter((meeting) => {
      if (!meeting || !meeting.room) return false;

      const normalizedRoomName = meeting.room.toLowerCase().trim();
      const normalizedRoomCode = roomCode.toLowerCase().trim();

      return (
        normalizedRoomName === normalizedRoomCode ||
        normalizedRoomName.includes(normalizedRoomCode) ||
        normalizedRoomCode.includes(normalizedRoomName)
      );
    });

    console.log(
      `🔍 Filtered ${roomMeetings.length} meetings for room ${roomCode}`
    );

    // Check if any meetings are happening now - as a secondary check
    const manualCheckActiveMeeting = roomMeetings.find((meeting) => {
      const startMinutes = DateTimeUtils.timeToMinutes(meeting.startTime);
      const endMinutes = DateTimeUtils.timeToMinutes(meeting.endTime);
      const currentMinutes = DateTimeUtils.timeToMinutes(normalizedCurrentTime);

      const isActive =
        currentMinutes >= startMinutes &&
        currentMinutes <= endMinutes &&
        !meeting.isEnded &&
        !meeting.forceEndedByUser;

      if (isActive) {
        console.log(
          `✅ Found active meeting manually for ${roomCode}: ${meeting.id} (${meeting.startTime}-${meeting.endTime})`
        );
      }

      return isActive;
    });

    // Use either the passed activeMeeting or the one we found manually
    // But prioritize meetings for this specific room
    const effectiveActiveMeeting =
      activeMeeting &&
      activeMeeting.room &&
      activeMeeting.room.toLowerCase().includes(roomCode.toLowerCase())
        ? activeMeeting
        : manualCheckActiveMeeting;

    if (effectiveActiveMeeting) {
      // Active meeting found
      if (titleElement) {
        titleElement.innerHTML = `<span>Thông tin cuộc họp:</span> ${
          effectiveActiveMeeting.content ||
          effectiveActiveMeeting.purpose ||
          "Không có tiêu đề"
        }`;
      }

      if (startTimeElement) {
        startTimeElement.innerHTML = `<span>Thời gian bắt đầu:</span> ${
          effectiveActiveMeeting.startTime || "--:--"
        }`;
      }

      if (endTimeElement) {
        endTimeElement.innerHTML = `<span>Thời gian kết thúc:</span> ${
          effectiveActiveMeeting.endTime || "--:--"
        }`;
      }

      if (statusIndicator) {
        statusIndicator.textContent = MEETING_STATUS.ACTIVE;
      }

      if (indicatorDot) {
        indicatorDot.classList.remove("available");
        indicatorDot.classList.add("busy");
      }

      console.log(
        `✅ Updated room ${roomCode} with active meeting: "${effectiveActiveMeeting.content}" (${effectiveActiveMeeting.startTime}-${effectiveActiveMeeting.endTime})`
      );
    } else {
      // No active meeting - check for upcoming meetings
      const upcomingMeeting = allMeetings.find(
        (meeting) =>
          !meeting.isEnded &&
          !meeting.forceEndedByUser &&
          DateTimeUtils.timeToMinutes(meeting.startTime) >
            DateTimeUtils.timeToMinutes(normalizedCurrentTime)
      );

      if (upcomingMeeting) {
        // Upcoming meeting found
        if (titleElement) {
          titleElement.innerHTML = `<span>Thông tin cuộc họp sắp diễn ra:</span> ${
            upcomingMeeting.content ||
            upcomingMeeting.purpose ||
            "Không có tiêu đề"
          }`;
        }

        if (startTimeElement) {
          startTimeElement.innerHTML = `<span>Thời gian bắt đầu:</span> ${
            upcomingMeeting.startTime || "--:--"
          }`;
        }

        if (endTimeElement) {
          endTimeElement.innerHTML = `<span>Thời gian kết thúc:</span> ${
            upcomingMeeting.endTime || "--:--"
          }`;
        }

        if (statusIndicator) {
          statusIndicator.textContent = MEETING_STATUS.UPCOMING;
        }

        if (indicatorDot) {
          indicatorDot.classList.remove("busy");
          indicatorDot.classList.add("available");
        }

        console.log(
          `Updated room ${roomCode} with upcoming meeting: "${upcomingMeeting.content}"`
        );
      } else {
        // No meetings
        if (titleElement) {
          titleElement.innerHTML = `<span>Thông tin cuộc họp:</span> Trống`;
        }

        if (startTimeElement) {
          startTimeElement.innerHTML = `<span>Thời gian bắt đầu:</span> --:--`;
        }

        if (endTimeElement) {
          endTimeElement.innerHTML = `<span>Thời gian kết thúc:</span> --:--`;
        }

        if (statusIndicator) {
          statusIndicator.textContent = MEETING_STATUS.EMPTY;
        }

        if (indicatorDot) {
          indicatorDot.classList.remove("busy");
          indicatorDot.classList.add("available");
        }

        console.log(`Updated room ${roomCode} as empty`);
      }
    }
  }

  _generateRoomPageTemplate(roomName, currentMeeting, upcomingMeetings) {
    return `
      <div class="container">
        <div class="left-panel">
          <div>
            <div class="clock-container">
              <div class="time-1" id="currentTime-1"></div>
            </div>
            <div class="currentDateElement-1" id="currentDate-1"></div>
          </div>
        </div>
        
        <div class="main-panel">
          <h1>${roomName.toUpperCase()}</h1>
          <div class="meeting-info">
            <div class="meeting-title-1">
              ${
                currentMeeting
                  ? currentMeeting.content || currentMeeting.purpose
                  : "Không có cuộc họp"
              }
            </div>
            <div class="meeting-time-1">
              <span>Bắt đầu: ${
                currentMeeting ? currentMeeting.startTime : "--:--"
              }</span>
              <span> - Kết thúc: ${
                currentMeeting ? currentMeeting.endTime : "--:--"
              }</span>
            </div>
          </div>
          <div class="purpose">MỤC ĐÍCH SỬ DỤNG</div>
          <div class="purpose-value">${
            currentMeeting ? currentMeeting.purpose : "Chưa xác định"
          }</div>
          ${
            currentMeeting
              ? '<button class="end-meeting">END MEETING</button>'
              : '<div class="no-meeting-placeholder">Không có cuộc họp đang diễn ra</div>'
          }
        </div>
        
        <div class="right-panel">
          <h2>LỊCH HỌP PHÒNG ${roomName.toUpperCase()}</h2>
          ${upcomingMeetings
            .map(
              (meeting) => `
                <div class="upcoming-meeting">
                  <div class="meeting-title">${
                    meeting.content || meeting.purpose
                  }</div>
                  <div class="meeting-time-1">${meeting.startTime} - ${
                meeting.endTime
              }</div>
                </div>
              `
            )
            .join("")}
          ${
            upcomingMeetings.length === 0
              ? '<div class="no-upcoming">Không có cuộc họp sắp tới</div>'
              : ""
          }
        </div>
      </div>
    `;
  }

  _setupRoomPageEventHandlers(roomName) {
    // Setup end meeting button handler
    setTimeout(() => {
      const endMeetingBtn = document.querySelector(".end-meeting");
      if (endMeetingBtn) {
        endMeetingBtn.addEventListener("click", (event) => {
          // Dispatch event for meeting data manager to handle
          const endEvent = new CustomEvent("endMeetingRequested", {
            detail: { roomName, event },
          });
          document.dispatchEvent(endEvent);
        });
      }
    }, 100);
  }

  /**
   * Ensure that all rooms from ROOM_CONFIG have room-section elements
   * This will create missing room sections if needed
   */
  _ensureRoomSections(roomsContainer) {
    if (!roomsContainer) return;

    const roomsToEnsure = Object.values(ROOM_CONFIG.ROOMS);
    const existingRoomSections =
      roomsContainer.querySelectorAll(".room-section");

    // Check which rooms already have sections
    const existingRooms = new Set();
    existingRoomSections.forEach((section) => {
      const roomElement = section.querySelector(".room-number");
      if (roomElement) {
        const roomName = roomElement.textContent.trim();
        existingRooms.add(roomName.toLowerCase());
      }
    });

    // Create sections for missing rooms
    roomsToEnsure.forEach((roomName) => {
      const normalizedRoomName = roomName.toLowerCase().trim();
      if (!existingRooms.has(normalizedRoomName)) {
        console.log(`➕ Creating missing room section for "${roomName}"`);

        // Create new room section
        const roomSection = document.createElement("div");
        roomSection.className = "room-section";
        roomSection.innerHTML = `
          <div class="room-number">${roomName.toUpperCase()}</div>
          <div class="room-details">
            <div class="meeting-info">
              <div class="meeting-header">
                <div class="meeting-title">
                  <span>Thông tin cuộc họp:</span> Trống
                </div>
                <div class="meeting-time">
                  <div class="time-spacer"></div>
                  <div class="start-time">
                    <span>Thời gian bắt đầu:</span> --:--
                  </div>
                  <div class="end-time">
                    <span>Thời gian kết thúc:</span> --:--
                  </div>
                </div>
              </div>
              <div class="meeting-stats">
                <div class="stats-row indicators-container">
                  <div class="status-group">
                    <div class="status-indicator">
                      <div class="indicator-dot available"></div>
                      <div class="status-text">Trống</div>
                    </div>
                    <div class="people-indicator">
                      <div class="people-dot"></div>
                      <div class="people-status-text">Đang kiểm tra...</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;

        // Add to rooms-container
        roomsContainer.appendChild(roomSection);
        existingRooms.add(normalizedRoomName);

        console.log(`✅ Added room section for "${roomName}"`);
      }
    });
  }
}

export default RoomManager;
