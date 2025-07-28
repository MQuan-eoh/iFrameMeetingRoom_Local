/**
 * Meeting Data Manager
 * Handles meeting data validation, caching, and meeting operations
 */

import { DateTimeUtils, FormatUtils, ValidationUtils } from "../utils/core.js";
import { TIME_CONFIG } from "../config/constants.js";
import dataService from "../services/dataService.js";

export class MeetingDataManager {
  constructor() {
    // Initialize with empty meeting data
    this.initializeEmptyData();
    this.isOnline = true;
    this.isLoading = false;
    this.lastSync = null;

    // Setup periodic sync
    this._setupPeriodicSync();
  }

  /**
   * Initialize empty data structure
   */
  initializeEmptyData() {
    // Create empty meeting data cache
    window.currentMeetingData = window.currentMeetingData || [];
    // Load data from server
    this.loadMeetingsFromServer();
  }

  /**
   * Get cached meeting data
   */
  getCachedMeetingData() {
    return window.currentMeetingData || [];
  }

  /**
   * Set cached meeting data
   */
  setCachedMeetingData(data) {
    window.currentMeetingData = data;
    return data;
  }

  /**
   * Load meetings from server
   */
  async loadMeetingsFromServer() {
    if (this.isLoading) return this.getCachedMeetingData();

    this.isLoading = true;
    try {
      const meetings = await dataService.getMeetings();
      this.setCachedMeetingData(meetings);
      this.isOnline = true;
      this.lastSync = new Date();

      // Dispatch event for UI update
      document.dispatchEvent(
        new CustomEvent("meetingDataUpdated", {
          detail: { meetings },
        })
      );

      return meetings;
    } catch (error) {
      console.error("Failed to load meetings from server:", error);
      this.isOnline = false;
      return this.getCachedMeetingData();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Save all meetings to server
   */
  async saveMeetingsToServer() {
    try {
      const meetings = this.getCachedMeetingData();
      await dataService.updateAllMeetings(meetings);
      this.isOnline = true;
      this.lastSync = new Date();
      return true;
    } catch (error) {
      console.error("Failed to save meetings to server:", error);
      this.isOnline = false;
      return false;
    }
  }

  /**
   * Setup periodic sync with server
   */
  _setupPeriodicSync() {
    // Sync every 5 minutes
    setInterval(() => {
      this.loadMeetingsFromServer();
    }, 5 * 60 * 1000);

    // Listen for online/offline events
    window.addEventListener("online", () => {
      console.log("🌐 Browser went online, syncing data...");
      this.saveMeetingsToServer();
    });

    // Listen for API connection errors
    window.addEventListener("apiConnectionError", () => {
      this.isOnline = false;
    });
  }

  /**
   * Create a new meeting
   */
  async createMeeting(meetingData) {
    const currentData = this.getCachedMeetingData();
    const newMeeting = {
      id: this._generateMeetingId(),
      date: meetingData.date,
      dayOfWeek: meetingData.dayOfWeek || this._getDayOfWeek(meetingData.date),
      room: meetingData.room,
      startTime: meetingData.startTime,
      endTime: meetingData.endTime,
      duration: DateTimeUtils.calculateDuration(
        meetingData.startTime,
        meetingData.endTime
      ),
      purpose: meetingData.purpose,
      content: meetingData.content,
      isEnded: false,
      forceEndedByUser: false,
      createdAt: new Date().toISOString(),
    };

    // Validate the new meeting
    if (!this.validateMeetingData(newMeeting)) {
      throw new Error("Invalid meeting data");
    }

    // Check for conflicts
    const conflicts = this.checkMeetingConflicts(newMeeting, currentData);
    if (conflicts.length > 0) {
      throw new Error(
        `Meeting conflicts with existing meeting(s): ${conflicts
          .map((m) => `${m.content} (${m.startTime}-${m.endTime})`)
          .join(", ")}`
      );
    }

    // Add to current data
    const updatedData = [...currentData, newMeeting];
    this.setCachedMeetingData(updatedData);

    try {
      // Save to server if online
      if (this.isOnline) {
        await dataService.createMeeting(newMeeting);
        this.lastSync = new Date();
      } else {
        console.warn("Server connection unavailable, saving locally only");
      }
    } catch (error) {
      console.error("Failed to save meeting to server:", error);
      this.isOnline = false;
    }

    // Trigger update event
    this._triggerMeetingUpdate(updatedData);

    return newMeeting;
  }

  /**
   * Generate unique meeting ID
   */
  _generateMeetingId() {
    return `meeting_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }

  /**
   * Get day of week from date
   */
  _getDayOfWeek(dateStr) {
    const dateParts = dateStr.split("/");
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const year = parseInt(dateParts[2], 10);

    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();

    // Map day of week (0-6) to Vietnamese format
    const days = ["CN", "2", "3", "4", "5", "6", "7"];
    return days[dayOfWeek];
  }

  /**
   * Update an existing meeting
   */
  updateMeeting(meetingId, updatedData) {
    const currentData = this.getCachedMeetingData();
    const meetingIndex = currentData.findIndex(
      (meeting) => meeting.id === meetingId
    );

    if (meetingIndex === -1) {
      throw new Error("Meeting not found");
    }

    const existingMeeting = currentData[meetingIndex];
    const updatedMeeting = {
      ...existingMeeting,
      ...updatedData,
      lastUpdated: new Date().getTime(),
    };

    // Validate the updated meeting
    if (!this.validateMeetingData(updatedMeeting)) {
      throw new Error("Invalid meeting data");
    }

    // Check for conflicts (excluding the current meeting)
    const otherMeetings = currentData.filter((m) => m.id !== meetingId);
    const conflicts = this.checkMeetingConflicts(updatedMeeting, otherMeetings);
    if (conflicts.length > 0) {
      throw new Error(
        `Meeting conflicts with existing meeting(s): ${conflicts
          .map((m) => `${m.content} (${m.startTime}-${m.endTime})`)
          .join(", ")}`
      );
    }

    // Update the meeting
    const newData = [...currentData];
    newData[meetingIndex] = updatedMeeting;

    this.setCachedMeetingData(newData);
    this._triggerMeetingUpdate(newData);

    return updatedMeeting;
  }

  /**
   * Delete a meeting
   */
  deleteMeeting(meetingId) {
    const currentData = this.getCachedMeetingData();
    const updatedData = currentData.filter(
      (meeting) => meeting.id !== meetingId
    );

    if (updatedData.length === currentData.length) {
      throw new Error("Meeting not found");
    }

    this.setCachedMeetingData(updatedData);
    this._triggerMeetingUpdate(updatedData);

    return true;
  }

  /**
   * End a meeting
   */
  endMeeting(meetingId) {
    const currentData = this.getCachedMeetingData();
    const meetingIndex = currentData.findIndex(
      (meeting) => meeting.id === meetingId
    );

    if (meetingIndex === -1) {
      throw new Error("Meeting not found");
    }

    const currentTime = DateTimeUtils.getCurrentTime();
    const meeting = currentData[meetingIndex];

    const updatedMeeting = {
      ...meeting,
      endTime: currentTime,
      isEnded: true,
      forceEndedByUser: true,
      originalEndTime: meeting.endTime,
      lastUpdated: new Date().getTime(),
    };

    const updatedData = [...currentData];
    updatedData[meetingIndex] = updatedMeeting;

    this.setCachedMeetingData(updatedData);
    this._triggerMeetingUpdate(updatedData);
    this._showEndMeetingSuccess();

    return updatedMeeting;
  }

  /**
   * End meeting by room and current time
   */
  endMeetingByRoom(roomName) {
    const data = this.getCachedMeetingData();
    const currentTime = DateTimeUtils.getCurrentTime();

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

        this.setCachedMeetingData(updatedData);
        this._triggerMeetingUpdate(updatedData);
        this._showEndMeetingSuccess();
        return updatedData[currentMeetingIndex];
      }
    }

    throw new Error("No active meeting found for this room");
  }

  /**
   * Check for meeting time conflicts
   */
  checkMeetingConflicts(meeting, existingMeetings) {
    const sameDay = existingMeetings.filter(
      (m) => m.date === meeting.date && m.room === meeting.room
    );

    return sameDay.filter((m) => DateTimeUtils.checkTimeConflict(meeting, m));
  }

  /**
   * Validate meeting data structure
   */
  validateMeetingData(meeting) {
    // Check required fields
    if (
      !meeting.date ||
      !meeting.room ||
      !meeting.startTime ||
      !meeting.endTime
    ) {
      console.error("Missing required meeting fields");
      return false;
    }

    // Validate date format (dd/mm/yyyy)
    if (!ValidationUtils.isValidDate(meeting.date)) {
      console.error("Invalid date format:", meeting.date);
      return false;
    }

    // Validate time formats (HH:MM)
    if (
      !ValidationUtils.isValidTime(meeting.startTime) ||
      !ValidationUtils.isValidTime(meeting.endTime)
    ) {
      console.error("Invalid time format:", meeting.startTime, meeting.endTime);
      return false;
    }

    // Check if end time is after start time
    const startMinutes = DateTimeUtils.timeToMinutes(meeting.startTime);
    const endMinutes = DateTimeUtils.timeToMinutes(meeting.endTime);
    if (endMinutes <= startMinutes) {
      console.error("End time must be after start time");
      return false;
    }

    return true;
  }

  /**
   * Get meetings for today
   */
  getTodayMeetings(data) {
    const today = DateTimeUtils.getCurrentDate();
    return data.filter((meeting) => meeting.date === today);
  }

  /**
   * Get meetings for specific date
   */
  getMeetingsByDate(date, data) {
    return data.filter((meeting) => meeting.date === date);
  }

  /**
   * Get meetings for specific room
   */
  getRoomMeetings(roomName, data) {
    return data.filter(
      (meeting) =>
        FormatUtils.normalizeRoomName(meeting.room) ===
        FormatUtils.normalizeRoomName(roomName)
    );
  }

  /**
   * Get current active meeting for a room
   */
  getCurrentMeeting(roomName, data) {
    const currentTime = DateTimeUtils.getCurrentTime();
    const roomMeetings = this.getRoomMeetings(roomName, data);

    return roomMeetings.find(
      (meeting) =>
        DateTimeUtils.isTimeInRangeWithSeconds(
          currentTime,
          meeting.startTime,
          meeting.endTime
        ) &&
        !meeting.isEnded &&
        !meeting.forceEndedByUser
    );
  }

  /**
   * Get upcoming meetings for a room
   */
  getUpcomingMeetings(roomName, data) {
    const currentTime = DateTimeUtils.getCurrentTime();
    const roomMeetings = this.getRoomMeetings(roomName, data);

    return roomMeetings.filter(
      (meeting) =>
        DateTimeUtils.timeToMinutes(meeting.startTime) >
          DateTimeUtils.timeToMinutes(currentTime) &&
        !meeting.isEnded &&
        !meeting.forceEndedByUser
    );
  }

  /**
   * Trigger meeting data update event
   */
  _triggerMeetingUpdate(data) {
    // Dispatch custom event for meeting data update
    const event = new CustomEvent("meetingDataUpdated", {
      detail: { meetings: data, todayMeetings: this.getTodayMeetings(data) },
    });
    document.dispatchEvent(event);
  }

  /**
   * Trigger room status update event
   */
  _triggerRoomStatusUpdate(todayMeetings) {
    // Dispatch custom event for room status update only
    const event = new CustomEvent("roomStatusUpdate", {
      detail: { todayMeetings },
    });
    document.dispatchEvent(event);
  }

  /**
   * Show end meeting success notification
   */
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
