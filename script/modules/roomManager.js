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
    this.currentRoomFilter = "all"; // Add room filter state

    // Ensure room sections are created when the DOM is ready
    document.addEventListener("DOMContentLoaded", () => {
      console.log("🏢 RoomManager: DOM ready, initializing room sections");
      const roomsContainer = document.querySelector(".rooms-container");
      if (roomsContainer) {
        this._ensureRoomSections(roomsContainer);
      } else {
        console.warn("⚠️ RoomManager: Cannot find .rooms-container element");
      }

      // Initialize room filter functionality
      this._initializeRoomFilter();
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
    }); // Update the data display after refreshing rooms
    this.updateScheduleTable(todayMeetings);

    // Apply current room filter to schedule view if filter is active
    if (this.currentRoomFilter && this.currentRoomFilter !== "all") {
      this._filterScheduleViewMeetings(this.currentRoomFilter);
    }
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
  _generateRoomPageTemplate(roomName, currentMeeting, upcomingMeetings) {
    return `
      <!-- Back to Home Button -->
      <button class="back-to-home-btn" id="backToHomeBtn">
        <i class="home-icon">🏠</i>
        <span>Back to Home</span>
      </button>
      
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
  /**
   * Setup event handlers for room page
   */
  _setupRoomPageEventHandlers(roomName) {
    console.log(`🔧 Setting up event handlers for room page: ${roomName}`);

    // Back to Home button
    const backToHomeBtn = document.getElementById("backToHomeBtn");
    if (backToHomeBtn) {
      backToHomeBtn.addEventListener("click", () => {
        this._handleBackToHome();
      });
    }

    // End meeting button
    const endMeetingBtn = document.querySelector(".end-meeting-btn");
    if (endMeetingBtn) {
      endMeetingBtn.addEventListener("click", (e) => {
        const meetingId = e.target.dataset.meetingId;
        this._handleEndMeeting(meetingId, roomName);
      });
    }

    // Book room button
    const bookRoomBtn = document.querySelector(".book-room-btn");
    if (bookRoomBtn) {
      bookRoomBtn.addEventListener("click", (e) => {
        const room = e.target.dataset.room;
        this._handleBookRoom(room);
      });
    }

    // Refresh data button
    const refreshBtn = document.querySelector(".refresh-data-btn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        this._handleRefreshData(roomName);
      });
    }
  }

  /**
   * Handle end meeting action
   */
  _handleEndMeeting(meetingId, roomName) {
    if (confirm("Bạn có chắc chắn muốn kết thúc cuộc họp này?")) {
      console.log(`Ending meeting ${meetingId} in room ${roomName}`);

      // Dispatch custom event for ending meeting
      document.dispatchEvent(
        new CustomEvent("endMeeting", {
          detail: { meetingId, roomName },
        })
      );

      // Refresh the page data
      setTimeout(() => {
        this._handleRefreshData(roomName);
      }, 1000);
    }
  }

  /**
   * Handle book room action
   */
  _handleBookRoom(roomName) {
    console.log(`Opening booking modal for room: ${roomName}`);

    // Dispatch custom event for booking
    document.dispatchEvent(
      new CustomEvent("openBookingModal", {
        detail: { roomName },
      })
    );
  }

  /**
   * Handle refresh data action
   */
  _handleRefreshData(roomName) {
    console.log(`Refreshing data for room: ${roomName}`);

    // Get fresh data and re-render
    if (window.meetingRoomApp && window.meetingRoomApp.instance) {
      window.meetingRoomApp.instance.refreshData().then(() => {
        // Re-render the room page with fresh data
        const data = window.currentMeetingData || [];
        this.renderRoomPage(data, roomName, roomName);
      });
    }
  }

  /**
   * Handle back to home action
   */
  _handleBackToHome() {
    console.log("🏠 Navigating back to home page");

    // Dispatch custom event for navigation
    document.dispatchEvent(
      new CustomEvent("navigateToHome", {
        detail: { from: "roomDetail" },
      })
    );

    // Try to navigate using window history if available
    if (window.history && window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback: reload the main page
      window.location.reload();
    }

    // Alternative: If there's a specific app router, we can use it
    if (
      window.meetingRoomApp &&
      window.meetingRoomApp.instance &&
      window.meetingRoomApp.instance.router
    ) {
      window.meetingRoomApp.instance.router.navigateToHome();
    }

    // Additional fallback: try to find and click a home navigation element
    const homeNavElement =
      document.querySelector('[data-action="home"]') ||
      document.querySelector(".nav-home") ||
      document.querySelector("#homeBtn");

    if (homeNavElement && typeof homeNavElement.click === "function") {
      homeNavElement.click();
    }
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

    // Listen for schedule filter application requests
    document.addEventListener("applyScheduleFilter", (event) => {
      console.log("🎯 Apply schedule filter event received");
      const filter = event.detail?.filter || this.currentRoomFilter;
      this._filterScheduleViewMeetings(filter);
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

    // Apply room filter to data
    let filteredData = this._applyRoomFilter(data);

    // Remove old rows
    Array.from(tableBody.children)
      .filter((child) => child !== headerRow)
      .forEach((child) => child.remove());

    // If no data, show empty state
    if (!filteredData || filteredData.length === 0) {
      const emptyRow = DOMUtils.createElement("div", "table-row empty-state");
      emptyRow.setAttribute("role", "row");
      emptyRow.innerHTML = `
        <div role="cell" class="empty-message">
          ${
            this.currentRoomFilter === "all"
              ? "No meetings scheduled for today."
              : `No meetings for ${this.currentRoomFilter} today.`
          }
        </div>
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
    filteredData.forEach((meeting) => {
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

    console.log("Schedule table updated with", filteredData.length, "meetings");
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

  /**
   * Setup room filter functionality
   * This will initialize the filter UI and load event handlers
   */
  _initializeRoomFilter() {
    const filterButton = document.getElementById("roomFilterBtn");
    const filterDropdown = document.getElementById("roomFilterDropdown");
    const filterOptions = document.querySelectorAll(".filter-option");

    if (!filterButton || !filterDropdown) return;

    // Toggle dropdown visibility
    filterButton.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = filterDropdown.classList.contains("show");

      if (isOpen) {
        this._closeRoomFilter();
      } else {
        this._openRoomFilter();
      }
    });

    // Handle filter option selection
    filterOptions.forEach((option) => {
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        const roomFilter = option.dataset.room;
        this._setRoomFilter(roomFilter);
        this._closeRoomFilter();
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !filterButton.contains(e.target) &&
        !filterDropdown.contains(e.target)
      ) {
        this._closeRoomFilter();
      }
    });

    console.log("✅ Room filter functionality initialized");
  }

  /**
   * Open room filter dropdown
   */
  _openRoomFilter() {
    const filterButton = document.getElementById("roomFilterBtn");
    const filterDropdown = document.getElementById("roomFilterDropdown");

    if (filterButton && filterDropdown) {
      filterButton.classList.add("active");
      filterDropdown.classList.add("show");
    }
  }

  /**
   * Close room filter dropdown
   */
  _closeRoomFilter() {
    const filterButton = document.getElementById("roomFilterBtn");
    const filterDropdown = document.getElementById("roomFilterDropdown");

    if (filterButton && filterDropdown) {
      filterButton.classList.remove("active");
      filterDropdown.classList.remove("show");
    }
  }

  /**
   * Set room filter and update displays
   */
  _setRoomFilter(roomFilter) {
    console.log(`🔍 Setting room filter to: ${roomFilter}`);

    this.currentRoomFilter = roomFilter;

    // Update active filter option UI
    const filterOptions = document.querySelectorAll(".filter-option");
    filterOptions.forEach((option) => {
      if (option.dataset.room === roomFilter) {
        option.classList.add("active");
      } else {
        option.classList.remove("active");
      }
    });

    // Update filter button text
    const filterButton = document.getElementById("roomFilterBtn");
    if (filterButton) {
      const buttonText = roomFilter === "all" ? "Tất cả phòng" : roomFilter;
      filterButton.innerHTML = `
        <i class="fas fa-filter"></i>
        ${buttonText}
        <i class="fas fa-chevron-down filter-dropdown-icon"></i>
      `;
    }

    // Apply filter to schedule view meetings
    this._filterScheduleViewMeetings(roomFilter);

    // Apply filter to current data and update displays
    const currentData = window.currentMeetingData || [];
    const currentDate = DateTimeUtils.getCurrentDate();
    const todayMeetings = currentData.filter(
      (meeting) => meeting.date === currentDate
    );

    // Update schedule table with filtered data
    this.updateScheduleTable(todayMeetings);

    // Dispatch event for other components that might need to know about filter changes
    document.dispatchEvent(
      new CustomEvent("roomFilterChanged", {
        detail: { filter: roomFilter, meetings: todayMeetings },
      })
    );
  }

  /**
   * Apply room filter to meeting data
   */
  _applyRoomFilter(data) {
    if (!data || !Array.isArray(data)) return [];

    if (this.currentRoomFilter === "all") {
      return data;
    }

    return data.filter((meeting) => {
      if (!meeting || !meeting.room) return false;

      const normalizedMeetingRoom = FormatUtils.normalizeRoomName(meeting.room);
      const normalizedFilterRoom = FormatUtils.normalizeRoomName(
        this.currentRoomFilter
      );

      return (
        normalizedMeetingRoom === normalizedFilterRoom ||
        normalizedMeetingRoom.includes(normalizedFilterRoom) ||
        normalizedFilterRoom.includes(normalizedMeetingRoom)
      );
    });
  }

  /**
   * Filter schedule view meetings based on room filter
   */
  _filterScheduleViewMeetings(roomFilter) {
    console.log(`🎯 Filtering schedule view meetings for room: ${roomFilter}`);

    // Get all meeting events in the schedule view
    const meetingEvents = document.querySelectorAll(".meeting-event");

    if (meetingEvents.length === 0) {
      console.log("📅 No meeting events found in schedule view");
      return;
    }

    let hiddenCount = 0;
    let visibleCount = 0;

    meetingEvents.forEach((meetingEvent) => {
      const roomElement = meetingEvent.querySelector(".event-room");

      if (!roomElement) {
        console.warn("⚠️ Meeting event without room element found");
        return;
      }

      const meetingRoom = roomElement.textContent.trim();

      if (roomFilter === "all") {
        // Show all meetings
        meetingEvent.style.display = "";
        meetingEvent.style.opacity = "1";
        meetingEvent.classList.remove("filtered-out");
        visibleCount++;
      } else {
        // Check if this meeting's room matches the filter
        const normalizedMeetingRoom =
          FormatUtils.normalizeRoomName(meetingRoom);
        const normalizedFilterRoom = FormatUtils.normalizeRoomName(roomFilter);

        const isMatch =
          normalizedMeetingRoom === normalizedFilterRoom ||
          normalizedMeetingRoom.includes(normalizedFilterRoom) ||
          normalizedFilterRoom.includes(normalizedMeetingRoom);

        if (isMatch) {
          // Show matching meetings
          meetingEvent.style.display = "";
          meetingEvent.style.opacity = "1";
          meetingEvent.classList.remove("filtered-out");
          visibleCount++;
        } else {
          // Hide non-matching meetings
          meetingEvent.style.display = "none";
          meetingEvent.style.opacity = "0.3";
          meetingEvent.classList.add("filtered-out");
          hiddenCount++;
        }
      }
    });

    console.log(
      `📊 Filter results: ${visibleCount} visible, ${hiddenCount} hidden`
    );

    // Add visual feedback for empty filter results
    this._showFilterFeedback(roomFilter, visibleCount);
  }

  /**
   * Show feedback when filter has no results
   */
  _showFilterFeedback(roomFilter, visibleCount) {
    // Remove any existing feedback
    const existingFeedback = document.querySelector(".filter-feedback");
    if (existingFeedback) {
      existingFeedback.remove();
    }

    if (roomFilter !== "all" && visibleCount === 0) {
      // Create feedback message for empty filter results
      const weekView = document.getElementById("weekView");
      if (weekView) {
        const feedback = document.createElement("div");
        feedback.className = "filter-feedback";
        feedback.innerHTML = `
          <div class="filter-feedback-content">
            <i class="fas fa-search"></i>
            <p>Không tìm thấy cuộc họp nào cho <strong>${roomFilter}</strong></p>
            <p class="filter-suggestion">Thử chọn "Tất cả phòng" hoặc phòng khác</p>
          </div>
        `;

        weekView.appendChild(feedback);

        // Auto remove feedback after 5 seconds
        setTimeout(() => {
          if (feedback.parentNode) {
            feedback.remove();
          }
        }, 5000);
      }
    }
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
