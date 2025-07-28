/**
 * Schedule Booking Manager
 * Manages room booking scheduling functionality
 */

import { DateTimeUtils } from "../utils/core.js";
import {
  initTeamsTimeDropdown,
  createFullDayTimeOptions,
  updateEndTimeOptions,
  toggleTimeDropdown,
} from "./teamsTimeDropdown.js";

export class ScheduleBookingManager {
  constructor() {
    this.currentView = "week";
    this.bookingModal = document.getElementById("bookingModal");
    this.weekView = document.getElementById("weekView");
    this.monthView = document.getElementById("monthView");
    this.currentDate = new Date();
    this.selectedDate = null;
    this.selectedStartTime = null;
    this.selectedEndTime = null;
    this.selectedRoom = null;

    this._initialize();
  }

  /**
   * Initialize booking manager
   */
  _initialize() {
    this._attachEventListeners();
    this._updateCurrentPeriod();
    this._renderWeekView();
    this._renderTimeIndicator();

    // Listen for meeting data updates to refresh calendar
    document.addEventListener("meetingDataUpdated", (event) => {
      console.log("🔄 Meeting data updated, refreshing schedule view");
      // Small delay to ensure data is fully updated
      setTimeout(() => {
        this._renderMeetingsForCurrentWeek();
      }, 300);
    });

    // Listen for room status updates to refresh calendar
    document.addEventListener("roomStatusUpdate", (event) => {
      console.log("🔄 Room status updated, refreshing schedule view");
      // Small delay to ensure data is fully updated
      setTimeout(() => {
        this._renderMeetingsForCurrentWeek();
      }, 300);
    });

    // Listen for room filter changes to re-apply filter after meeting data updates
    document.addEventListener("roomFilterChanged", (event) => {
      console.log("🎯 Room filter changed, applying filter to schedule view");
      const filter = event.detail?.filter;
      if (filter) {
        // Small delay to ensure meetings are rendered first
        setTimeout(() => {
          // Trigger room manager to apply filter to schedule view
          const roomFilterEvent = new CustomEvent("applyScheduleFilter", {
            detail: { filter: filter },
          });
          document.dispatchEvent(roomFilterEvent);
        }, 100);
      }
    });

    // Set up periodic updates for current time indicator and date
    setInterval(() => {
      this._renderTimeIndicator();

      // Get proper Vietnam time using DateTimeUtils
      const vietnamTime = DateTimeUtils.getCurrentTime(); // Returns "HH:MM:SS"
      const timeParts = vietnamTime.split(":");
      const currentMinute = parseInt(timeParts[1]);

      // Update day-date every hour to keep it current
      if (currentMinute === 0) {
        this._renderWeekView();
      }

      // Get proper Vietnam date for day checking
      const vietnamDate = DateTimeUtils.getCurrentDate(); // Returns "DD/MM/YYYY"
      const [day] = vietnamDate.split("/");
      const today = parseInt(day);
      if (this._lastRenderedDay !== today) {
        this._lastRenderedDay = today;
        this.currentDate = "reset"; // Reset to current date
        this._renderWeekView();
      }
    }, 60000); // Update every minute

    // Store current day to detect date changes
    const now = new Date();
    now.setHours(now.getHours() + 7 - new Date().getTimezoneOffset() / 60);
    this._lastRenderedDay = now.getDate();

    // Initial render of meetings (after a short delay to ensure data is loaded)
    setTimeout(() => {
      this._renderMeetingsForCurrentWeek();
    }, 1000);

    console.log("✅ Schedule Booking Manager initialized");
  }

  /**
   * Scroll the schedule view
   */
  _scrollSchedule(direction) {
    const weekView = document.getElementById("weekView");
    if (!weekView) return;

    const scrollAmount = 200; // pixels to scroll

    if (direction === "up") {
      weekView.scrollBy({ top: -scrollAmount, behavior: "smooth" });
    } else {
      weekView.scrollBy({ top: scrollAmount, behavior: "smooth" });
    }
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners() {
    // View switcher
    const viewOptions = document.querySelectorAll(".view-option");
    viewOptions.forEach((option) => {
      option.addEventListener("click", () =>
        this._switchView(option.dataset.view)
      );
    });

    // Navigation
    document
      .getElementById("prevPeriod")
      .addEventListener("click", () => this._navigatePeriod(-1));
    document
      .getElementById("nextPeriod")
      .addEventListener("click", () => this._navigatePeriod(1));

    // Add Today button if it doesn't exist
    let todayButton = document.getElementById("todayButton");
    if (!todayButton) {
      todayButton = document.createElement("button");
      todayButton.id = "todayButton";
      todayButton.className = "nav-arrow";
      todayButton.innerHTML = "Hôm nay";
      todayButton.style.margin = "0 10px";

      // Insert between prev and next buttons
      const currentPeriodEl = document.getElementById("currentPeriod");
      if (currentPeriodEl) {
        currentPeriodEl.parentNode.insertBefore(todayButton, currentPeriodEl);
      }
    }

    // Add event listener for Today button
    todayButton.addEventListener("click", () => this._navigatePeriod("today"));

    // Create meeting button
    document
      .getElementById("createMeetingBtn")
      .addEventListener("click", () => this._openBookingModal());

    // Modal actions
    document
      .getElementById("closeBookingModal")
      .addEventListener("click", () => this._closeBookingModal());
    document
      .getElementById("cancelBooking")
      .addEventListener("click", () => this._closeBookingModal());
    document
      .getElementById("saveBooking")
      .addEventListener("click", () => this._saveBooking());

    // Form events
    const startTimeInput = document.getElementById("bookingStartTime");
    const endTimeInput = document.getElementById("bookingEndTime");

    if (startTimeInput) {
      startTimeInput.addEventListener("input", () =>
        this._updateEndTimeOptions()
      );
      startTimeInput.addEventListener("focus", () =>
        this._populateStartTimeOptions()
      );
      // Validate time format on blur
      startTimeInput.addEventListener("blur", (e) =>
        this._validateTimeFormat(e.target)
      );
    }

    if (endTimeInput) {
      endTimeInput.addEventListener("focus", () =>
        this._updateEndTimeOptions()
      );
      // Validate time format on blur
      endTimeInput.addEventListener("blur", (e) =>
        this._validateTimeFormat(e.target)
      );
    }

    // Cell click events for booking
    const dayCells = document.querySelectorAll(".day-cell");
    dayCells.forEach((cell) => {
      cell.addEventListener("click", (event) => {
        // Skip if cell contains a meeting already or click was on a meeting
        if (
          cell.querySelector(".meeting-event") ||
          event.target.closest(".meeting-event")
        ) {
          return;
        }

        const timeSlot = cell.getAttribute("data-time");
        const dayColumn = cell.closest(".day-column");
        const dayIndex = dayColumn.getAttribute("data-day");
        const dayDate = dayColumn.querySelector(".day-date").textContent;

        this._quickBookSlot(dayDate, dayIndex, timeSlot);
      });
    });

    // Initialize time selection behavior like Teams
    // Use the imported function instead of internal implementation
    initTeamsTimeDropdown();
  }

  /**
   * Switch between week and month views
   */
  _switchView(view) {
    if (view === this.currentView) return;

    this.currentView = view;

    // Update active state in UI
    document.querySelectorAll(".view-option").forEach((option) => {
      option.classList.toggle("active", option.dataset.view === view);
    });

    // Show/hide appropriate view
    if (view === "week") {
      this.weekView.style.display = "grid";
      this.monthView.style.display = "none";
    } else {
      this.weekView.style.display = "none";
      this.monthView.style.display = "grid";
      this._renderMonthView(); // Render month view when switching to it
    }

    this._updateCurrentPeriod();
  }

  /**
   * Navigate between periods (weeks/months)
   */
  _navigatePeriod(direction) {
    if (direction === "today") {
      // Reset to current date
      this.currentDate = "reset";
    } else if (this.currentView === "week") {
      // Move by 7 days
      this.currentDate.setDate(this.currentDate.getDate() + 7 * direction);
    } else {
      // Move by 1 month
      this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    }

    this._updateCurrentPeriod();

    if (this.currentView === "week") {
      this._renderWeekView();
    } else {
      this._renderMonthView();
    }
  }

  /**
   * Update current period display
   */
  _updateCurrentPeriod() {
    const currentPeriodEl = document.getElementById("currentPeriod");

    if (this.currentView === "week") {
      // Get start and end of week
      const startOfWeek = new Date(this.currentDate);
      startOfWeek.setDate(
        this.currentDate.getDate() - this.currentDate.getDay() + 1
      ); // Monday

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

      // Format dates
      const startDay = String(startOfWeek.getDate()).padStart(2, "0");
      const startMonth = String(startOfWeek.getMonth() + 1).padStart(2, "0");
      const startYear = startOfWeek.getFullYear();

      const endDay = String(endOfWeek.getDate()).padStart(2, "0");
      const endMonth = String(endOfWeek.getMonth() + 1).padStart(2, "0");
      const endYear = endOfWeek.getFullYear();

      currentPeriodEl.textContent = `${startDay}/${startMonth}/${startYear} - ${endDay}/${endMonth}/${endYear}`;
    } else {
      // Month view
      const monthNames = [
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

      currentPeriodEl.textContent = `${
        monthNames[this.currentDate.getMonth()]
      } ${this.currentDate.getFullYear()}`;
    }
  }

  /**
   * Render current time indicator in week view
   */
  _renderTimeIndicator() {
    // Remove any existing indicators
    document
      .querySelectorAll(".current-time-indicator")
      .forEach((el) => el.remove());

    // Get proper Vietnam time using DateTimeUtils
    const vietnamTime = DateTimeUtils.getCurrentTime(); // Returns "HH:MM:SS"
    const timeParts = vietnamTime.split(":");
    const currentHour = parseInt(timeParts[0]);
    const currentMinute = parseInt(timeParts[1]);

    // Calculate position within the day cell
    const minutesSinceMidnight = currentHour * 60 + currentMinute;
    const minutesSince7am = minutesSinceMidnight - 7 * 60; // Adjust for 7am start

    if (minutesSince7am < 0 || minutesSince7am > 12 * 60) {
      // Outside of display hours (7am to 7pm)
      return;
    }

    // Get proper Vietnam date for today calculation
    const vietnamDate = DateTimeUtils.getCurrentDate(); // Returns "DD/MM/YYYY"
    const now = new Date();

    // Get proper Vietnam timezone date
    const timezoneOffsetHours = -now.getTimezoneOffset() / 60;
    let vietnamDateObj;

    if (timezoneOffsetHours === 7) {
      vietnamDateObj = now;
    } else {
      const offsetDifference = 7 - timezoneOffsetHours;
      vietnamDateObj = new Date(
        now.getTime() + offsetDifference * 60 * 60 * 1000
      );
    }

    const today = vietnamDateObj.getDay(); // 0 = Sunday, 1 = Monday, ...
    const dayIndex = today === 0 ? 6 : today - 1; // Convert to our 0 = Monday format

    const dayColumn = document.querySelector(
      `.day-column[data-day="${dayIndex}"]`
    );
    if (!dayColumn) return;

    // Find the cell for the current hour
    const currentHourCell = dayColumn.querySelector(
      `.day-cell[data-time="${currentHour.toString().padStart(2, "0")}:00"]`
    );
    if (!currentHourCell) return;

    // Create and position the indicator
    const indicator = document.createElement("div");
    indicator.className = "current-time-indicator";

    const percentage = (currentMinute / 60) * 100;
    indicator.style.top = `calc(${percentage}%)`;

    // Add time label
    const timeLabel = document.createElement("div");
    timeLabel.className = "current-time-label";
    timeLabel.textContent = `${currentHour
      .toString()
      .padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;
    indicator.appendChild(timeLabel);

    currentHourCell.appendChild(indicator);

    // Scroll to current time if during work hours
    if (minutesSince7am >= 0 && minutesSince7am <= 12 * 60) {
      // Auto scroll to current time position (with offset to show it in the middle)
      const weekView = document.getElementById("weekView");
      if (weekView) {
        const hourHeight = 60; // Height of each hour cell in pixels
        const scrollPosition =
          (currentHour - 7) * hourHeight + (currentMinute / 60) * hourHeight;
        // Scroll to position with offset to center current time
        const offset = weekView.clientHeight / 2;
        weekView.scrollTo({
          top: Math.max(0, scrollPosition - offset),
          behavior: "smooth",
        });
      }
    }
  }

  /**
   * Open booking modal for a quick booking
   */
  _quickBookSlot(dateStr, dayIndex, timeStr) {
    // Parse date from the display format
    const [day, month, year] = dateStr.split("/");
    const date = `${year}-${month}-${day}`;

    // Set form values
    document.getElementById("bookingDate").value = date;
    document.getElementById("bookingStartTime").value = timeStr;

    // Calculate end time (default to 1 hour later)
    const [hours, minutes] = timeStr.split(":");
    let endHour = parseInt(hours) + 1;
    if (endHour > 18) endHour = 18;
    const endTime = `${endHour.toString().padStart(2, "0")}:${minutes}`;
    document.getElementById("bookingEndTime").value = endTime;

    // Open the modal
    this._openBookingModal();
  }

  /**
   * Open booking modal
   */
  _openBookingModal() {
    this.bookingModal.classList.add("active");

    // Populate start time options when modal opens
    this._populateStartTimeOptions();
  }

  /**
   * Close booking modal
   */
  _closeBookingModal() {
    this.bookingModal.classList.remove("active");
    document.getElementById("bookingForm").reset();
  }

  /**
   * Update end time options based on selected start time
   */
  _updateEndTimeOptions() {
    const startTimeInput = document.getElementById("bookingStartTime");
    const endTimeDatalist = document.getElementById("endTimeOptions");

    if (!startTimeInput || !endTimeDatalist) return;

    // Use full day options from _createFullDayTimeOptions instead
    this._createFullDayTimeOptions();

    const startTimeValue = startTimeInput.value.trim();
    if (!startTimeValue) return;

    // Validate start time format first
    if (!this._validateTimeFormat(startTimeInput)) return;

    // Get start time value
    const [startHour, startMinute] = startTimeValue.split(":").map(Number);

    // Calculate minimum end time (start time + 30 minutes)
    let minEndHour = startHour;
    let minEndMinute = startMinute + 30;

    if (minEndMinute >= 60) {
      minEndHour += 1;
      minEndMinute -= 60;
    }

    // The minimum end time to highlight
    const minEndTime = `${minEndHour.toString().padStart(2, "0")}:${minEndMinute
      .toString()
      .padStart(2, "0")}`;

    // Highlight and scroll to the suggested minimum end time
    Array.from(endTimeDatalist.querySelectorAll("option")).forEach((option) => {
      // Get the time value of this option
      const optionTime = option.value;
      const [optionHour, optionMinute] = optionTime.split(":").map(Number);
      const optionMinutes = optionHour * 60 + optionMinute;
      const minEndMinutes = minEndHour * 60 + minEndMinute;

      if (optionTime === minEndTime) {
        // This is the suggested minimum end time - highlight it
        option.setAttribute("selected", "selected");
        option.style.backgroundColor = "#e6f0ff";
        option.style.fontWeight = "bold";

        // Scroll to this option when dropdown opens
        setTimeout(() => {
          option.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      } else if (optionMinutes < minEndMinutes) {
        // These times are before the minimum end time - dim them
        option.style.opacity = "0.5";
        option.style.color = "#999";
      }
    });
  }

  /**
   * Populate start time options with smart suggestions from current time
   */
  _populateStartTimeOptions() {
    const startTimeDatalist = document.getElementById("startTimeOptions");
    if (!startTimeDatalist) return;

    // Let the _createFullDayTimeOptions handle populating all the options
    this._createFullDayTimeOptions();

    // Get current Vietnam time to highlight or scroll to
    const vietnamTime = DateTimeUtils.getCurrentTime(); // Returns "HH:MM:SS"
    const [currentHour, currentMinute] = vietnamTime.split(":").map(Number);

    // Round up to next 30-minute interval for suggestion
    let suggestedHour = currentHour;
    let suggestedMinute = currentMinute <= 30 ? 30 : 0;

    if (suggestedMinute === 0) {
      suggestedHour += 1;
    }

    // If it's past working hours, suggest from 7 AM next day (or current time if during working hours)
    if (suggestedHour >= 19) {
      suggestedHour = 7;
      suggestedMinute = 0;
    } else if (suggestedHour < 7) {
      suggestedHour = 7;
      suggestedMinute = 0;
    }

    // Highlight the suggested time option
    const suggestedTime = `${suggestedHour
      .toString()
      .padStart(2, "0")}:${suggestedMinute.toString().padStart(2, "0")}`;

    // Find and highlight suggested option
    Array.from(startTimeDatalist.querySelectorAll("option")).forEach(
      (option) => {
        if (option.value === suggestedTime) {
          option.setAttribute("selected", "selected");
          option.style.backgroundColor = "#e6f0ff";
          option.style.fontWeight = "bold";

          // Scroll to this option when dropdown opens
          setTimeout(() => {
            option.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 100);
        }
      }
    );
  }

  /**
   * Validate time format (HH:MM)
   */
  _validateTimeFormat(input) {
    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const value = input.value.trim();

    if (value && !timePattern.test(value)) {
      input.classList.add("invalid");
      this._showTimeFormatError(input);
      return false;
    } else {
      input.classList.remove("invalid");
      this._clearTimeFormatError(input);

      // If valid, check if it's within working hours
      if (value) {
        const [hour, minute] = value.split(":").map(Number);
        if (hour < 7 || hour > 19 || (hour === 19 && minute > 0)) {
          input.classList.add("invalid");
          this._showWorkingHoursError(input);
          return false;
        }
      }
      return true;
    }
  }

  /**
   * Show time format error message
   */
  _showTimeFormatError(input) {
    this._clearTimeFormatError(input);

    const errorMsg = document.createElement("small");
    errorMsg.className = "form-text text-danger time-error";
    errorMsg.textContent =
      "Định dạng thời gian không hợp lệ. Vui lòng nhập theo định dạng HH:MM (VD: 09:30)";

    input.parentNode.appendChild(errorMsg);
  }

  /**
   * Show working hours error message
   */
  _showWorkingHoursError(input) {
    this._clearTimeFormatError(input);

    const errorMsg = document.createElement("small");
    errorMsg.className = "form-text text-danger time-error";
    errorMsg.textContent = "Thời gian phải trong khoảng 07:00 - 19:00";

    input.parentNode.appendChild(errorMsg);
  }

  /**
   * Clear time format error message
   */
  _clearTimeFormatError(input) {
    const existingError = input.parentNode.querySelector(".time-error");
    if (existingError) {
      existingError.remove();
    }
  }

  /**
   * Save booking
   */
  _saveBooking() {
    const form = document.getElementById("bookingForm");

    // Basic validation
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Validate time formats
    const startTimeInput = document.getElementById("bookingStartTime");
    const endTimeInput = document.getElementById("bookingEndTime");

    if (
      !this._validateTimeFormat(startTimeInput) ||
      !this._validateTimeFormat(endTimeInput)
    ) {
      return;
    }

    // Get form values
    const room = document.getElementById("bookingRoom").value;
    const dateInput = document.getElementById("bookingDate").value;
    const startTime = document.getElementById("bookingStartTime").value.trim();
    const endTime = document.getElementById("bookingEndTime").value.trim();
    const purpose = document.getElementById("bookingPurpose").value;
    const department = document.getElementById("bookingDepartment").value;
    const title = document.getElementById("bookingTitle").value;
    const description = document.getElementById("bookingDescription").value;

    // Additional time validation
    const startTimeMinutes = this._timeToMinutes(startTime);
    const endTimeMinutes = this._timeToMinutes(endTime);

    if (endTimeMinutes <= startTimeMinutes) {
      endTimeInput.classList.add("invalid");
      this._clearTimeFormatError(endTimeInput);
      const errorMsg = document.createElement("small");
      errorMsg.className = "form-text text-danger time-error";
      errorMsg.textContent = "Thời gian kết thúc phải sau thời gian bắt đầu";
      endTimeInput.parentNode.appendChild(errorMsg);
      return;
    }

    // Format date for display (DD/MM/YYYY)
    const [year, month, day] = dateInput.split("-");
    const formattedDate = `${day}/${month}/${year}`;

    // Calculate day of week
    const date = new Date(dateInput);
    const dayOfWeekNum = date.getDay();
    const daysOfWeek = ["CN", "2", "3", "4", "5", "6", "7"];
    const dayOfWeek = daysOfWeek[dayOfWeekNum];

    // Create meeting object
    const meeting = {
      id: `meeting_${Date.now()}`,
      room: room,
      date: formattedDate,
      dayOfWeek: dayOfWeek,
      startTime: startTime,
      endTime: endTime,
      duration: this._calculateDuration(startTime, endTime),
      purpose: purpose,
      department: department,
      title: title,
      content: description,
      createdAt: new Date().toISOString(),
      isEnded: false,
      forceEndedByUser: false,
    };

    // Add meeting to storage
    this._addMeetingToStorage(meeting);

    // Create meeting element in UI
    this._createMeetingElement(meeting);

    // Close modal
    this._closeBookingModal();

    // Show success message
    this._showSuccessMessage("Đặt lịch họp thành công!");
  }

  /**
   * Calculate duration between two time strings
   */
  _calculateDuration(startTime, endTime) {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const durationMinutes = endMinutes - startMinutes;

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (hours > 0) {
      return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  }

  /**
   * Add meeting to storage
   */
  _addMeetingToStorage(meeting) {
    // Get current meeting data
    let meetingData = window.currentMeetingData || [];

    // Add new meeting
    meetingData.push(meeting);

    // Update storage
    window.currentMeetingData = meetingData;

    // Try to save to server if MeetingDataManager is available
    if (
      window.meetingRoomApp &&
      window.meetingRoomApp.managers &&
      window.meetingRoomApp.managers.meetingDataManager
    ) {
      window.meetingRoomApp.managers.meetingDataManager
        .saveMeetingsToServer()
        .catch((err) =>
          console.error("Failed to save meeting from booking manager:", err)
        );
    }

    // Dispatch event for other modules
    const event = new CustomEvent("meetingDataUpdated", {
      detail: {
        meetings: meetingData,
      },
    });
    document.dispatchEvent(event);
  }

  /**
   * Create meeting element in UI
   */
  _createMeetingElement(meeting) {
    // Get day of week from date (0 = Sunday, 1 = Monday, etc.)
    const dayParts = meeting.date.split("/");
    const dateObj = new Date(`${dayParts[2]}-${dayParts[1]}-${dayParts[0]}`);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ...
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to our 0 = Monday format

    // Find day column
    const dayColumn = document.querySelector(
      `.day-column[data-day="${dayIndex}"]`
    );
    if (!dayColumn) return;

    // Find start hour cell
    const [startHour] = meeting.startTime.split(":");
    const startCell = dayColumn.querySelector(
      `.day-cell[data-time="${startHour}:00"]`
    );
    if (!startCell) return;

    // Calculate height based on duration
    const [startH, startM] = meeting.startTime.split(":").map(Number);
    const [endH, endM] = meeting.endTime.split(":").map(Number);

    const startInMinutes = startH * 60 + startM;
    const endInMinutes = endH * 60 + endM;
    const durationInMinutes = endInMinutes - startInMinutes;

    // Each hour cell is 60px tall, so height = (duration in minutes) * (60px / 60 minutes)
    const height = durationInMinutes;

    // Calculate top offset for partial hours (e.g., 9:30)
    const topOffset = (startM / 60) * 100; // As percentage of cell height

    // Determine purpose class
    const purposeClass = this._getPurposeClass(meeting.purpose);

    // Create meeting element
    const meetingEl = document.createElement("div");
    meetingEl.className = `meeting-event ${purposeClass}`;
    meetingEl.style.top = `${topOffset}%`;
    meetingEl.style.height = `${height}px`;
    meetingEl.dataset.id = meeting.id;

    meetingEl.innerHTML = `
      <div class="event-room">${meeting.room}</div>
      <div class="event-title">${meeting.title || meeting.content}</div>
      <div class="event-time">${meeting.startTime} - ${meeting.endTime}</div>
    `;

    // Add tooltip
    const tooltip = document.createElement("div");
    tooltip.className = "meeting-tooltip";
    tooltip.innerHTML = `
      <div class="tooltip-title">${meeting.title || "Cuộc họp"}</div>
      <div class="tooltip-content">
        <p><strong>Phòng:</strong> ${meeting.room}</p>
        <p><strong>Thời gian:</strong> ${meeting.startTime} - ${
      meeting.endTime
    }</p>
        <p><strong>Mục đích:</strong> ${meeting.purpose}</p>
        ${
          meeting.department
            ? `<p><strong>Phòng ban:</strong> ${meeting.department}</p>`
            : ""
        }
        ${
          meeting.content
            ? `<p><strong>Nội dung:</strong> ${meeting.content}</p>`
            : ""
        }
      </div>
    `;
    meetingEl.appendChild(tooltip);

    // Add to the day cell
    startCell.appendChild(meetingEl);

    // Add event listener for click
    meetingEl.addEventListener("click", (e) => {
      e.stopPropagation();
      this._showMeetingDetails(meeting);
    });
  }

  /**
   * Get CSS class based on meeting purpose
   */
  _getPurposeClass(purpose) {
    const purposeLower = purpose.toLowerCase();

    if (purposeLower.includes("họp")) return "purpose-hop";
    if (purposeLower.includes("đào tạo")) return "purpose-daotao";
    if (purposeLower.includes("phỏng vấn")) return "purpose-phongvan";
    if (purposeLower.includes("thảo luận")) return "purpose-thaoluan";
    if (purposeLower.includes("báo cáo")) return "purpose-baocao";

    return "purpose-khac";
  }

  /**
   * Show meeting details
   */
  _showMeetingDetails(meeting) {
    // Implementation for viewing meeting details
    console.log("Viewing meeting details:", meeting);
  }

  /**
   * Show success message
   */
  _showSuccessMessage(message) {
    // Create notification element
    const notification = document.createElement("div");
    notification.style.position = "fixed";
    notification.style.top = "20px";
    notification.style.right = "20px";
    notification.style.padding = "15px 25px";
    notification.style.backgroundColor = "#4CAF50";
    notification.style.color = "white";
    notification.style.borderRadius = "4px";
    notification.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
    notification.style.zIndex = "10000";
    notification.style.fontSize = "16px";
    notification.style.transition = "all 0.3s ease";
    notification.style.opacity = "0";
    notification.style.transform = "translateY(-20px)";
    notification.textContent = message;

    // Add to DOM
    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateY(0)";
    }, 50);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateY(-20px)";

      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  /**
   * Render week view with proper dates
   */
  _renderWeekView() {
    console.log("📅 Rendering week view");

    // Use Vietnam timezone (UTC+7) for all date calculations
    // Get current date in Vietnam timezone
    const vietnamDate = new Date();
    vietnamDate.setHours(
      vietnamDate.getHours() + 7 - new Date().getTimezoneOffset() / 60
    );

    // If current date is not set or manually changed, use current Vietnam date
    if (!this.currentDate || this.currentDate === "reset") {
      this.currentDate = new Date(vietnamDate);
    }

    // Get start of week from current date (Monday)
    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(
      this.currentDate.getDate() - this.currentDate.getDay() + 1
    ); // Monday

    // If Sunday, go back to previous Monday
    if (this.currentDate.getDay() === 0) {
      startOfWeek.setDate(startOfWeek.getDate() - 7);
    }

    console.log(`📅 Week starting from: ${startOfWeek.toLocaleDateString()}`);

    // Update each day column with the correct date
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + dayIndex);

      // Format the date for display (DD/MM)
      const day = String(currentDate.getDate()).padStart(2, "0");
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const year = currentDate.getFullYear();

      // Get day name in Vietnamese
      const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      const dayName = dayNames[currentDate.getDay()];

      // Find the day column
      const dayColumn = document.querySelector(
        `.day-column[data-day="${dayIndex}"]`
      );
      if (dayColumn) {
        // Update date
        const dateElement = dayColumn.querySelector(".day-date");
        if (dateElement) {
          dateElement.textContent = `${day}/${month}`;
          // Store full date with year as attribute for reference
          dateElement.dataset.fullDate = `${day}/${month}/${year}`;
        }

        // Update day name
        const nameElement = dayColumn.querySelector(".day-name");
        if (nameElement) {
          nameElement.textContent = dayName;
        }

        // Mark current day
        const isToday =
          currentDate.getDate() === vietnamDate.getDate() &&
          currentDate.getMonth() === vietnamDate.getMonth() &&
          currentDate.getFullYear() === vietnamDate.getFullYear();

        dayColumn.classList.toggle("day-today", isToday);

        // Set full date attribute on column for easier reference
        dayColumn.dataset.fullDate = `${day}/${month}/${year}`;
      }
    }

    // Re-render any meetings for this week view
    this._renderMeetingsForCurrentWeek();

    // Re-render current time indicator after updating the dates
    this._renderTimeIndicator();
  }

  /**
   * Render all meetings for current week view
   */
  _renderMeetingsForCurrentWeek() {
    console.log("📅 Rendering meetings for current week view");

    // First clear all existing meeting elements
    document.querySelectorAll(".meeting-event").forEach((el) => el.remove());

    // Get all meetings data
    const allMeetings = window.currentMeetingData || [];
    if (!allMeetings || allMeetings.length === 0) {
      console.log("📅 No meetings data available");
      return;
    }

    console.log(`📅 Found ${allMeetings.length} total meetings in data`);

    // Get dates for each day in current view
    const dayColumns = document.querySelectorAll(".day-column");
    if (!dayColumns || dayColumns.length === 0) {
      console.log("📅 No day columns found in week view");
      return;
    }

    // Process each meeting and add to appropriate day
    let meetingsRendered = 0;

    allMeetings.forEach((meeting) => {
      // Skip ended meetings
      if (meeting.isEnded || meeting.forceEndedByUser) {
        return;
      }

      // Find matching day column for this meeting's date
      let matchingColumn = null;
      dayColumns.forEach((column) => {
        const columnDateStr = column.dataset.fullDate;
        if (columnDateStr && columnDateStr === meeting.date) {
          matchingColumn = column;
        }
      });

      if (!matchingColumn) {
        // Meeting is not in current week view
        return;
      }

      // Render this meeting in the matching column
      this._createMeetingElement(meeting);
      meetingsRendered++;
    });

    console.log(`📅 Rendered ${meetingsRendered} meetings in week view`);

    // Auto-apply current room filter if one is active
    if (
      window.roomManager &&
      window.roomManager.currentRoomFilter &&
      window.roomManager.currentRoomFilter !== "all"
    ) {
      console.log(
        `🎯 Auto-applying room filter: ${window.roomManager.currentRoomFilter}`
      );
      setTimeout(() => {
        window.roomManager._filterScheduleViewMeetings(
          window.roomManager.currentRoomFilter
        );
      }, 100);
    }
  }

  /**
   * Render month view
   */
  _renderMonthView() {
    // Month view implementation
    // This would generate a full month calendar view
    console.log("Month view not yet implemented");
  }

  /**
   * Convert time string to minutes since midnight
   */
  _timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }
}

export default ScheduleBookingManager;
