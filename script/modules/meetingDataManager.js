/**
 * Meeting Data Manager
 * Handles Excel file processing, data validation, caching, and meeting operations
 */

import { DateTimeUtils, FormatUtils, ValidationUtils } from "../utils/core.js";
import { EXCEL_COLUMNS, TIME_CONFIG } from "../config/constants.js";

export class MeetingDataManager {
  constructor() {
    this.fileHandle = null;
    this.lastFileData = null;
    this.fileCheckInterval = null;
  }

  /**
   * Process Excel file and extract meeting data
   */
  async processExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          console.log("Raw Excel data:", rawData);

          // Find header row
          let headerRowIndex = -1;
          for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            if (
              Array.isArray(row) &&
              row.some((cell) => cell && String(cell).includes("NGÀY"))
            ) {
              headerRowIndex = i;
              break;
            }
          }

          if (headerRowIndex === -1) {
            throw new Error("Không tìm thấy header row trong file Excel");
          }

          const headerRow = rawData[headerRowIndex];
          console.log(
            "Header row found at index",
            headerRowIndex,
            ":",
            headerRow
          );

          // Map columns
          const columnIndices = this._mapColumns(headerRow);
          console.log("Column indices found:", columnIndices);

          // Validate column indices
          if (
            columnIndices.startTime === -1 ||
            columnIndices.endTime === -1 ||
            columnIndices.duration === -1
          ) {
            console.warn("Warning: Some columns not found", columnIndices);
          }

          const meetings = [];
          for (let i = headerRowIndex + 1; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row.some((cell) => cell)) continue; // Skip empty rows

            console.log(`Processing row ${i}:`, {
              rawStartTime: row[columnIndices.startTime],
              rawEndTime: row[columnIndices.endTime],
              rawDuration: row[columnIndices.duration],
            });

            // Extract time values with fallback
            const startTimeValue = row[columnIndices.startTime] || row[3];
            const endTimeValue = row[columnIndices.endTime] || row[4];
            const durationValue = row[columnIndices.duration] || row[5];

            const meeting = {
              id: meetings.length + 1,
              date: DateTimeUtils.formatDate(row[0]),
              dayOfWeek: DateTimeUtils.formatDayOfWeek(row[1]),
              room: FormatUtils.formatRoomName(row[2]),
              startTime: DateTimeUtils.formatTime(startTimeValue),
              endTime: DateTimeUtils.formatTime(endTimeValue),
              duration: FormatUtils.formatDuration(durationValue),
              content: row[7] || "",
              purpose: FormatUtils.determinePurpose(row[7]),
            };

            console.log(`Processed meeting data:`, meeting);
            meetings.push(meeting);
          }

          resolve(meetings);
        } catch (error) {
          console.error("Error processing Excel file:", error);
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Lỗi đọc file"));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Validate meetings for conflicts
   */
  async validateMeetings(meetings) {
    const conflicts = [];
    const processedMeetings = new Set();

    for (let i = 0; i < meetings.length; i++) {
      const currentMeeting = meetings[i];

      for (let j = 0; j < meetings.length; j++) {
        if (i === j) continue;
        const otherMeeting = meetings[j];

        if (
          currentMeeting.date === otherMeeting.date &&
          FormatUtils.normalizeRoomName(currentMeeting.room) ===
            FormatUtils.normalizeRoomName(otherMeeting.room)
        ) {
          if (DateTimeUtils.checkTimeConflict(currentMeeting, otherMeeting)) {
            const conflictKey = [i, j].sort().join("_");
            if (!processedMeetings.has(conflictKey)) {
              conflicts.push({
                meeting1: currentMeeting,
                meeting2: otherMeeting,
                message:
                  `Xung đột lịch họp tại phòng ${currentMeeting.room} ngày ${currentMeeting.date}:\n` +
                  `- Cuộc họp 1: "${
                    currentMeeting.content || currentMeeting.purpose
                  }" (${currentMeeting.startTime} - ${
                    currentMeeting.endTime
                  })\n` +
                  `- Cuộc họp 2: "${
                    otherMeeting.content || otherMeeting.purpose
                  }" (${otherMeeting.startTime} - ${otherMeeting.endTime})`,
              });
              processedMeetings.add(conflictKey);
            }
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Validate new meeting against existing meetings
   */
  validateNewMeeting(newMeeting, existingMeetings) {
    const conflicts = existingMeetings.filter(
      (meeting) =>
        meeting.date === newMeeting.date &&
        FormatUtils.normalizeRoomName(meeting.room) ===
          FormatUtils.normalizeRoomName(newMeeting.room) &&
        DateTimeUtils.checkTimeConflict(meeting, newMeeting)
    );

    return conflicts;
  }

  /**
   * Handle meeting end by user
   */
  handleEndMeeting(event) {
    // Show confirmation dialog first
    const isConfirmed = confirm(
      "Bạn có chắc chắn muốn kết thúc cuộc họp này không?"
    );

    if (!isConfirmed) {
      console.log("End meeting rejected by user");
      return;
    }

    // Get cached data from memory
    const data = this.getCachedMeetingData();
    if (!data || !Array.isArray(data)) {
      console.error("No meeting data found!");
      return;
    }

    const currentTime = DateTimeUtils.getCurrentTime();
    const currentDate = DateTimeUtils.getCurrentDate();

    // Get room name from DOM
    let roomName = null;
    const mainPanel = event.target.closest(".main-panel");
    if (mainPanel) {
      const h1Element = mainPanel.querySelector("h1");
      if (h1Element) {
        roomName = h1Element.textContent.trim();
      }
    }

    // Fallback: try to get room name from page title or other sources
    if (!roomName) {
      const pageTitle = document.querySelector(
        ".room-title, .meeting-room-title, h1"
      );
      if (pageTitle) {
        roomName = pageTitle.textContent.trim();
      }
    }

    if (!roomName) {
      console.error("Could not determine room name from DOM");
      return;
    }

    console.log("Ending meeting for room:", roomName);

    // Find current meeting using the extracted room name
    const roomMeetings = data.filter(
      (meeting) =>
        FormatUtils.normalizeRoomKey(meeting.room) ===
        FormatUtils.normalizeRoomKey(roomName)
    );

    const currentMeeting = roomMeetings.find((meeting) =>
      ValidationUtils.isValidMeetingState(meeting, currentTime)
    );

    if (currentMeeting) {
      const updatedData = [...data];
      const currentMeetingIndex = updatedData.findIndex(
        (meeting) => meeting.id === currentMeeting.id
      );

      if (currentMeetingIndex !== -1) {
        // Update meeting information with special flag
        updatedData[currentMeetingIndex] = {
          ...currentMeeting,
          endTime: currentTime,
          isEnded: true,
          lastUpdated: new Date().getTime(),
          originalEndTime: currentMeeting.endTime,
          forceEndedByUser: true,
        };

        // Update memory storage
        this.setCachedMeetingData(updatedData);

        // Trigger UI updates
        this._triggerMeetingUpdate(updatedData);

        console.log("Meeting ended successfully:", currentMeeting);

        // Show success message
        this._showEndMeetingSuccess();
      }
    } else {
      console.log("No active meeting found to end");
      alert("Không có cuộc họp đang diễn ra để kết thúc.");
    }
  }

  /**
   * File monitoring and auto-update
   */
  async startFileMonitoring(fileHandle) {
    this.fileHandle = fileHandle;

    if (this.fileCheckInterval) {
      clearInterval(this.fileCheckInterval);
    }

    this.fileCheckInterval = setInterval(() => {
      this._checkFileChanges();
    }, TIME_CONFIG.FILE_CHECK_INTERVAL);
  }

  stopFileMonitoring() {
    if (this.fileCheckInterval) {
      clearInterval(this.fileCheckInterval);
      this.fileCheckInterval = null;
    }
    this.fileHandle = null;
    this.lastFileData = null;
  }

  /**
   * Data caching methods
   */
  getCachedMeetingData() {
    return window.currentMeetingData || [];
  }

  setCachedMeetingData(data) {
    window.currentMeetingData = data;
  }

  /**
   * Filter today's meetings
   */
  getTodayMeetings(data = null) {
    const meetingData = data || this.getCachedMeetingData();
    const today = new Date();

    return meetingData.filter((meeting) => {
      const meetingDateParts = meeting.date.split("/");
      const meetingDay = parseInt(meetingDateParts[0]);
      const meetingMonth = parseInt(meetingDateParts[1]);
      const meetingYear = parseInt(meetingDateParts[2]);

      return (
        meetingDay === today.getDate() &&
        meetingMonth === today.getMonth() + 1 &&
        meetingYear === today.getFullYear()
      );
    });
  }

  /**
   * Get meetings for specific room
   */
  getRoomMeetings(roomName, data = null) {
    const meetingData = data || this.getCachedMeetingData();
    return meetingData.filter(
      (meeting) =>
        FormatUtils.normalizeRoomKey(meeting.room) ===
        FormatUtils.normalizeRoomKey(roomName)
    );
  }

  /**
   * Private helper methods
   */
  _mapColumns(headerRow) {
    const columnIndices = {
      date: -1,
      dayOfWeek: -1,
      room: -1,
      startTime: -1,
      endTime: -1,
      duration: -1,
      content: -1,
    };

    headerRow.forEach((cell, index) => {
      if (!cell) return;

      const cellStr = String(cell).toUpperCase().trim();

      if (cellStr.includes("NGÀY")) columnIndices.date = index;
      else if (cellStr.includes("THỨ")) columnIndices.dayOfWeek = index;
      else if (cellStr.includes("PHÒNG")) columnIndices.room = index;
      else if (cellStr.includes("BẮT ĐẦU")) columnIndices.startTime = index;
      else if (cellStr.includes("KẾT THÚC")) columnIndices.endTime = index;
      else if (cellStr.includes("THỜI LƯỢNG")) columnIndices.duration = index;
      else if (cellStr.includes("NỘI DUNG")) columnIndices.content = index;
    });

    return columnIndices;
  }

  async _checkFileChanges() {
    if (!this.fileHandle) return;

    try {
      const file = await this.fileHandle.getFile();
      const fileData = await file.text();

      if (this.lastFileData === null) {
        this.lastFileData = fileData;
        return;
      }

      // Use current memory data to preserve ended meeting states
      const currentData = this.getCachedMeetingData();
      const endedMeetings = currentData.filter(
        (meeting) => meeting.isEnded && meeting.forceEndedByUser
      );

      if (fileData !== this.lastFileData) {
        console.log("File changed, updating...");
        const newData = await this.processExcelFile(file);

        // Merge new data with ended meetings status
        const mergedData = newData.map((meeting) => {
          const endedMeeting = endedMeetings.find(
            (ended) =>
              ended.id === meeting.id &&
              ended.room === meeting.room &&
              ended.date === meeting.date
          );

          if (endedMeeting) {
            return endedMeeting;
          }
          return meeting;
        });

        this.setCachedMeetingData(mergedData);
        this.lastFileData = fileData;

        // Trigger UI updates
        this._triggerMeetingUpdate(mergedData);
      } else {
        // When file hasn't changed, use current memory data
        const todayMeetings = this.getTodayMeetings(currentData);
        console.log("Using data from memory:", todayMeetings);

        // Only trigger room status update
        this._triggerRoomStatusUpdate(todayMeetings);
      }
    } catch (error) {
      console.error("Error checking file:", error);
      if (error.name === "NotAllowedError") {
        this.stopFileMonitoring();
      }
    }
  }

  _triggerMeetingUpdate(data) {
    // Dispatch custom event for meeting data update
    const event = new CustomEvent("meetingDataUpdated", {
      detail: { meetings: data, todayMeetings: this.getTodayMeetings(data) },
    });
    document.dispatchEvent(event);
  }

  _triggerRoomStatusUpdate(todayMeetings) {
    // Dispatch custom event for room status update only
    const event = new CustomEvent("roomStatusUpdate", {
      detail: { todayMeetings },
    });
    document.dispatchEvent(event);
  }

  _showEndMeetingSuccess() {
    // Create success notification
    const notification = document.createElement("div");
    notification.className = "end-meeting-success";
    notification.innerHTML = `
      <div class="success-icon">✓</div>
      <div class="success-message">Cuộc họp đã được kết thúc thành công!</div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}

export default MeetingDataManager;
