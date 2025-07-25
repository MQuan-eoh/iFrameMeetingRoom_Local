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
  }

  /**
   * Update all room statuses with meeting data
   */
  updateRoomStatus(data) {
    console.log(
      "Updating room status with data at:",
      DateTimeUtils.getCurrentTime()
    );

    const currentDate = DateTimeUtils.getCurrentDate();
    const currentTime = DateTimeUtils.getCurrentTime();

    console.log("Current date:", currentDate);
    console.log("Current time:", currentTime);

    // Filter for today's meetings
    const todayMeetings = data.filter((meeting) => {
      const isToday = meeting.date === currentDate;
      console.log(`Meeting date: ${meeting.date}, Is today: ${isToday}`);
      return isToday;
    });

    console.log("Today's meetings:", todayMeetings);

    const roomsToUpdate = Object.values(ROOM_CONFIG.ROOMS);
    roomsToUpdate.forEach((roomName) => {
      // If no data or empty data, pass empty array to indicate no meetings
      if (!data || data.length === 0) {
        this.updateSingleRoomStatus(roomName, [], currentTime);
      } else {
        this.updateSingleRoomStatus(roomName, todayMeetings, currentTime);
      }
    });
  }

  /**
   * Update status for a specific room
   */
  updateSingleRoomStatus(roomCode, meetings, currentTime) {
    console.log("Updating room status for:", roomCode);

    // Find room section in DOM
    const roomSection = DOMUtils.findRoomSection(roomCode);

    if (!roomSection) {
      console.warn(`No room section found for room code: ${roomCode}`);
      return;
    }

    // Get UI elements
    const uiElements = this._getRoomUIElements(roomSection);

    // Log which elements were found for debugging
    console.log(`Room elements found for ${roomCode}:`, {
      titleElement: !!uiElements.titleElement,
      startTimeElement: !!uiElements.startTimeElement,
      endTimeElement: !!uiElements.endTimeElement,
      statusIndicator: !!uiElements.statusIndicator,
      indicatorDot: !!uiElements.indicatorDot,
    });

    // Filter meetings for current room
    const roomMeetings = meetings.filter(
      (meeting) =>
        FormatUtils.normalizeRoomName(meeting.room) ===
        FormatUtils.normalizeRoomName(roomCode)
    );

    console.log(`Found ${roomMeetings.length} meetings for room "${roomCode}"`);

    // Find active meeting
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

    // Set up periodic updates
    this.updateInterval = setInterval(() => {
      console.log("Auto-updating room statuses...");
      this.updateRoomStatus(data);
    }, 30000); // Update every 30 seconds

    console.log("Auto-update started for room statuses");
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
    return {
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

    if (activeMeeting) {
      // Active meeting found
      if (titleElement) {
        titleElement.innerHTML = `<span>Thông tin cuộc họp:</span> ${
          activeMeeting.content || activeMeeting.purpose || "Không có tiêu đề"
        }`;
      }

      if (startTimeElement) {
        startTimeElement.innerHTML = `<span>Thời gian bắt đầu:</span> ${
          activeMeeting.startTime || "--:--"
        }`;
      }

      if (endTimeElement) {
        endTimeElement.innerHTML = `<span>Thời gian kết thúc:</span> ${
          activeMeeting.endTime || "--:--"
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
        `Updated room ${roomCode} with active meeting: "${activeMeeting.content}"`
      );
    } else {
      // No active meeting - check for upcoming meetings
      const upcomingMeeting = allMeetings.find(
        (meeting) =>
          !meeting.isEnded &&
          !meeting.forceEndedByUser &&
          DateTimeUtils.timeToMinutes(meeting.startTime) >
            DateTimeUtils.timeToMinutes(currentTime)
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
}

export default RoomManager;
