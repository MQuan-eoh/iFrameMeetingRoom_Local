/**
 * Meeting Data Manager
 * Handles meeting data validation, caching, and meeting operations
 */

import { DateTimeUtils, FormatUtils, ValidationUtils } from "../utils/core.js";
import { TIME_CONFIG } from "../config/constants.js";
import DataService from "../services/dataService.js";

export class MeetingDataManager {
  constructor() {
    // Initialize with empty meeting data
    this.initializeEmptyData();
    this.isOnline = true;
    this.isLoading = false;
    this.lastSync = null;

    // Track page reloads to detect potential issues
    this.pageLoadTime = Date.now();
    this.previousMeetingsCount = 0;

    // Check for localStorage data to restore meetings on unexpected reload
    this._checkForLocalStorageBackup();

    // Setup periodic sync
    this._setupPeriodicSync();
    this.dataService = new DataService();
  }

  /**
   * Check for a local storage backup to restore meetings on unexpected reload
   */
  _checkForLocalStorageBackup() {
    try {
      const lastStoredMeetings = localStorage.getItem("meetingDataBackup");
      if (lastStoredMeetings) {
        const backupData = JSON.parse(lastStoredMeetings);
        const backupTime = localStorage.getItem("meetingDataBackupTime");

        console.log(
          `📦 Found local backup from ${new Date(
            parseInt(backupTime)
          ).toLocaleString()} with ${backupData.length} meetings`
        );

        // If we have a backup and it has meetings, restore it until server data loads
        if (backupData && Array.isArray(backupData) && backupData.length > 0) {
          this.previousMeetingsCount = backupData.length;
          window.currentMeetingData = backupData;
          console.log(
            `📦 Temporarily restored ${backupData.length} meetings from local backup`
          );
        }
      }
    } catch (error) {
      console.warn("Error checking for local storage backup:", error);
    }
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
    // Ensure data is always a proper array
    if (!Array.isArray(data)) {
      console.warn(
        "Attempted to set non-array data, converting to empty array:",
        data
      );
      data = [];
    }

    // Validate each meeting object structure
    const validatedData = data.filter((meeting) => {
      if (!meeting || typeof meeting !== "object") {
        console.warn("Invalid meeting object found, excluding:", meeting);
        return false;
      }
      if (!meeting.id || !meeting.date) {
        console.warn(
          "Meeting missing required fields (id, date), excluding:",
          meeting
        );
        return false;
      }
      return true;
    });

    if (validatedData.length !== data.length) {
      console.warn(
        `Filtered out ${data.length - validatedData.length} invalid meetings`
      );
    }

    window.currentMeetingData = validatedData;

    // Create a local backup to prevent data loss on page reload/refresh
    try {
      if (validatedData && validatedData.length > 0) {
        localStorage.setItem(
          "meetingDataBackup",
          JSON.stringify(validatedData)
        );
        localStorage.setItem("meetingDataBackupTime", Date.now().toString());
        console.log(
          `Created local backup with ${validatedData.length} meetings`
        );
      }
    } catch (error) {
      console.warn("Error creating local data backup:", error);
    }

    return validatedData;
  }

  /**
   * Load meetings from server with enhanced sync protection
   */
  async loadMeetingsFromServer() {
    if (this.isLoading) return this.getCachedMeetingData();

    this.isLoading = true;
    try {
      console.log("Requesting meetings from server...");

      // Check if we're currently saving a new meeting
      if (window.savingNewMeeting && window.newMeetingData) {
        console.log(
          "Detected active meeting save operation, using local data to prevent data loss"
        );
        this.isLoading = false;
        return window.newMeetingData;
      }

      const meetings = await this.dataService.getMeetings();

      // Keep track of current data for comparison
      const currentData = this.getCachedMeetingData();
      const currentCount = currentData.length;

      // Log detailed information about the data we received
      if (Array.isArray(meetings)) {
        console.log(
          `Server returned ${meetings.length} meetings (previously had ${currentCount})`
        );
      } else {
        console.warn("Server returned non-array data:", meetings);
      }

      // Enhanced data protection logic
      if (Array.isArray(meetings) && meetings.length > 0) {
        // If meetings decreased drastically (more than 50%), this might be an error
        if (currentCount > 5 && meetings.length < currentCount * 0.5) {
          console.warn(
            `POTENTIAL DATA LOSS DETECTED: Server returned ${meetings.length} meetings but we had ${currentCount} before`
          );

          // Show a warning to the user
          this._showDataWarning(
            `Potential data loss detected! Server returned ${meetings.length} meetings but we had ${currentCount} before. Using server data anyway.`
          );
        }

        // Special check: if we just created a meeting and server data doesn't include it
        if (
          window.newMeetingData &&
          window.newMeetingData.length > meetings.length
        ) {
          const latestMeeting =
            window.newMeetingData[window.newMeetingData.length - 1];
          const serverHasLatest = meetings.some(
            (m) => m.id === latestMeeting.id
          );

          if (!serverHasLatest) {
            console.warn(
              "Server data missing recently created meeting, retaining local data"
            );
            this.setCachedMeetingData(window.newMeetingData);
            this.isLoading = false;
            return window.newMeetingData;
          }
        }

        // Update cached data - server is source of truth
        this.setCachedMeetingData(meetings);
        console.log(
          `Updated cache with ${meetings.length} meetings from server`
        );
      } else if (
        Array.isArray(meetings) &&
        meetings.length === 0 &&
        currentCount > 0
      ) {
        // If we got an empty array and we had data before, this might be an error
        // Keep the existing data to prevent data loss
        console.warn(
          "Server returned empty meetings array but we have data locally. Keeping existing data to prevent loss."
        );

        // Show a warning to the user
        this._showDataWarning(
          `Server returned no meetings but we have ${currentCount} meetings locally. Keeping existing data to prevent loss.`
        );
      } else if (Array.isArray(meetings)) {
        // Empty array and we had no data before - this is fine
        this.setCachedMeetingData(meetings);
      }

      this.isOnline = true;
      this.lastSync = new Date();

      // Get today's meetings for room status updates
      const finalData = meetings.length > 0 ? meetings : currentData;
      const todayMeetings = this.getTodayMeetings(finalData);
      console.log(`${todayMeetings.length} meetings found for today`);

      // Update localStorage with sync timestamp to help cross-window coordination
      localStorage.setItem("lastServerSync", Date.now().toString());

      // Dispatch events for UI updates - use multiple event types for different components
      document.dispatchEvent(
        new CustomEvent("meetingDataUpdated", {
          detail: {
            meetings: finalData,
            todayMeetings,
            source: "server",
          },
        })
      );

      document.dispatchEvent(
        new CustomEvent("roomStatusUpdate", {
          detail: { todayMeetings },
        })
      );

      // Specific event for dashboard updates
      document.dispatchEvent(
        new CustomEvent("dashboardUpdate", {
          detail: {
            meetings: finalData,
            todayMeetings,
          },
        })
      );

      return finalData;
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
      console.log(`Saving ${meetings.length} meetings to server...`);

      const result = await this.dataService.updateAllMeetings(meetings);
      this.isOnline = true;
      this.lastSync = new Date();

      // Store the update timestamp in localStorage for cross-tab/window synchronization
      localStorage.setItem("meetingDataUpdated", new Date().toISOString());

      console.log(`Successfully saved ${meetings.length} meetings to server`);

      // Trigger events to update the UI
      document.dispatchEvent(
        new CustomEvent("meetingDataUpdated", {
          detail: { meetings, todayMeetings: this.getTodayMeetings(meetings) },
        })
      );

      document.dispatchEvent(
        new CustomEvent("syncCompleted", {
          detail: { success: true, count: meetings.length },
        })
      );

      return true;
    } catch (error) {
      console.error("Failed to save meetings to server:", error);
      this.isOnline = false;

      document.dispatchEvent(
        new CustomEvent("syncCompleted", {
          detail: { success: false, error: error.message },
        })
      );

      return false;
    }
  }

  /**
   * Setup periodic sync with enhanced protection
   */
  _setupPeriodicSync() {
    // More aggressive sync - every 30 seconds for better real-time updates across network
    setInterval(() => {
      // Skip periodic sync if we're actively saving new meetings
      if (window.savingNewMeeting) {
        console.log("Skipping periodic sync - new meeting save in progress");
        return;
      }

      console.log("Performing periodic server data sync...");
      this.loadMeetingsFromServer()
        .then((meetings) => {
          console.log(`Periodic sync complete - ${meetings.length} meetings`);
          // Explicitly trigger room status update to refresh UI
          this._triggerRoomStatusUpdate(this.getTodayMeetings(meetings));
        })
        .catch((err) => console.warn("Periodic sync error:", err));
    }, 30 * 1000);

    // Additional aggressive sync for the first 5 minutes after page load
    // to ensure quick data consistency across network
    let quickSyncCount = 0;
    const quickSyncInterval = setInterval(() => {
      if (quickSyncCount >= 10) {
        // After 10 quick syncs (5 minutes)
        clearInterval(quickSyncInterval);
        return;
      }

      // Skip if saving new meeting
      if (window.savingNewMeeting) {
        console.log("Skipping quick sync - new meeting save in progress");
        quickSyncCount++;
        return;
      }

      console.log("Performing quick initial sync...");
      this.loadMeetingsFromServer()
        .then(() => console.log("Quick sync complete"))
        .catch((err) => console.warn("Quick sync error:", err));

      quickSyncCount++;
    }, 30 * 1000);

    // Listen for online/offline events
    window.addEventListener("online", () => {
      console.log(" Browser went online, syncing data...");
      this.loadMeetingsFromServer().then((meetings) => {
        this.saveMeetingsToServer();
        // Force UI refresh
        this._triggerMeetingUpdate(meetings);
      });
    });

    // Listen for API connection errors
    window.addEventListener("apiConnectionError", () => {
      this.isOnline = false;
      console.log(" API connection error detected, will attempt reconnection");

      // Try to reconnect after a short delay with increasing backoff
      const attemptReconnection = (attempt = 1, maxAttempts = 5) => {
        if (attempt > maxAttempts) {
          console.warn(` Failed to reconnect after ${maxAttempts} attempts`);
          return;
        }

        const delay = Math.min(attempt * 3000, 15000); // Max 15 second delay
        console.log(
          ` Reconnection attempt ${attempt}/${maxAttempts} in ${delay / 1000}s`
        );

        setTimeout(() => {
          this.loadMeetingsFromServer()
            .then((meetings) => {
              if (meetings && meetings.length > 0) {
                console.log(" Reconnection successful");
                this._triggerMeetingUpdate(meetings);
              } else {
                attemptReconnection(attempt + 1, maxAttempts);
              }
            })
            .catch(() => attemptReconnection(attempt + 1, maxAttempts));
        }, delay);
      };

      attemptReconnection();
    });

    // Additional visibility change handler for tab focus/resume
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        console.log("🔄 Tab visible again, syncing latest data...");
        this.loadMeetingsFromServer().then((meetings) => {
          if (meetings && meetings.length > 0) {
            // Force room status update
            this._triggerRoomStatusUpdate(this.getTodayMeetings(meetings));
          }
        });
      }
    });

    // Listen for storage changes from other tabs/windows
    window.addEventListener("storage", (event) => {
      if (event.key === "meetingDataUpdated") {
        console.log(" Meeting data updated in another tab/window, refreshing");
        this.loadMeetingsFromServer();
      }
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
      department: meetingData.department || "",
      title: meetingData.title || meetingData.content,
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

    try {
      // Try to save to server first
      if (this.dataService.isConnected) {
        console.log("📤 Creating meeting on server:", newMeeting);
        const savedMeeting = await this.dataService.createMeeting(newMeeting);
        // If server save successful, update with server data
        if (savedMeeting && savedMeeting.id) {
          newMeeting.id = savedMeeting.id; // Use server-generated ID if available
          console.log(
            " Meeting created successfully on server with ID:",
            savedMeeting.id
          );
        }
        this.lastSync = new Date();
        this.isOnline = true;
      } else {
        console.warn(
          " Server not connected, will attempt to save locally only"
        );
      }
    } catch (error) {
      console.error(" Failed to save meeting to server:", error);
      this.isOnline = false;
      // Continue with local save on error
    }

    // Add to current data
    const updatedData = [...currentData, newMeeting];
    this.setCachedMeetingData(updatedData);

    console.log("🔄 Performing full data sync after creating meeting");

    try {
      // Always try to sync all data to ensure consistency
      await this.saveMeetingsToServer();
      console.log(" Full sync completed successfully");

      // Force a refresh from server to ensure all clients have latest data
      setTimeout(() => {
        console.log(
          " Performing additional data refresh to confirm synchronization"
        );
        this.loadMeetingsFromServer().catch((err) =>
          console.warn("Post-creation data refresh failed:", err)
        );
      }, 2000);
    } catch (err) {
      console.warn(" Background sync failed after create:", err);
    }

    // Trigger update event with explicit data refresh
    this._triggerMeetingUpdate(updatedData);

    // Force UI refresh for room details
    this._triggerRoomStatusUpdate(this.getTodayMeetings(updatedData));

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
  async updateMeeting(meetingId, updatedData) {
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
      lastUpdated: new Date().toISOString(),
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

    // Update the meeting locally first
    const newData = [...currentData];
    newData[meetingIndex] = updatedMeeting;
    this.setCachedMeetingData(newData);

    try {
      // Try to save to server
      if (this.dataService.isConnected) {
        await this.dataService.updateMeeting(meetingId, updatedMeeting);
        this.lastSync = new Date();
        this.isOnline = true;
        console.log(` Meeting ${meetingId} updated on server`);
      } else {
        console.warn("Server connection unavailable, updating locally only");
      }
    } catch (error) {
      console.error("Failed to update meeting on server:", error);
      this.isOnline = false;
    }

    // Always trigger local updates for immediate UI refresh
    this._triggerMeetingUpdate(newData);
    this._triggerRoomStatusUpdate(this.getTodayMeetings(newData));

    // Also try to sync all data to ensure server consistency
    this.saveMeetingsToServer().catch((err) =>
      console.warn("Background sync failed after update:", err)
    );

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
   * End a meeting early with complete server synchronization
   */
  async endMeetingEarly(meetingId) {
    console.log(`####################`);
    console.log(`Starting early end process for meeting ID: ${meetingId}`);

    try {
      const currentData = this.getCachedMeetingData();
      const meetingIndex = currentData.findIndex(
        (meeting) => meeting.id === meetingId
      );

      if (meetingIndex === -1) {
        throw new Error("Meeting not found");
      }

      const currentTime = DateTimeUtils.getCurrentTime();
      const meeting = currentData[meetingIndex];

      console.log(`Ending meeting early: ${meeting.title || meeting.content}`);
      console.log(
        `Original end time: ${meeting.endTime}, New end time: ${currentTime}`
      );

      const updatedMeeting = {
        ...meeting,
        endTime: currentTime,
        endedEarlyByUser: true,
        originalEndTime: meeting.endTime,
        lastUpdated: new Date().toISOString(),
        endedEarlyAt: new Date().toISOString(),
      };

      // Update local cache first
      const updatedData = [...currentData];
      updatedData[meetingIndex] = updatedMeeting;
      this.setCachedMeetingData(updatedData);

      console.log("Local cache updated, now syncing with server...");

      // Try to update server
      try {
        const domain =
          localStorage.getItem("domain") ||
          window.location.origin ||
          "http://localhost";
        const response = await fetch(`${domain}/api/meetings/${meetingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedMeeting),
        });

        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }

        const serverResponse = await response.json();
        console.log("Meeting successfully updated on server:", serverResponse);

        this.lastSync = new Date();
        this.isOnline = true;
      } catch (serverError) {
        console.warn(
          "Failed to update meeting on server, keeping local changes:",
          serverError
        );
        this.isOnline = false;
        // Continue with local changes even if server update fails
      }

      // Trigger comprehensive UI updates
      this._triggerMeetingUpdate(updatedData);
      this._triggerRoomStatusUpdate(this.getTodayMeetings(updatedData));
      this._showEndMeetingSuccess();

      // Broadcast the change to other components
      document.dispatchEvent(
        new CustomEvent("meetingEndedEarly", {
          detail: {
            meeting: updatedMeeting,
            originalEndTime: meeting.endTime,
            newEndTime: currentTime,
          },
        })
      );

      console.log("Meeting ended early successfully, all updates completed");
      return updatedMeeting;
    } catch (error) {
      console.error("Error ending meeting early:", error);
      throw error;
    }
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
          endedEarlyByUser: true,
          lastUpdated: new Date().getTime(),
          originalEndTime: currentMeeting.endTime,
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
    console.log(
      `Checking conflicts for meeting: ${meeting.title || meeting.content} (${
        meeting.date
      }, ${meeting.room}, ${meeting.startTime}-${meeting.endTime})`
    );

    const sameDay = existingMeetings.filter(
      (m) => m.date === meeting.date && m.room === meeting.room
    );

    console.log(
      `Found ${sameDay.length} meetings on same day/room to check conflicts against`
    );

    const conflicts = sameDay.filter((m) => {
      const hasConflict = DateTimeUtils.checkTimeConflict(meeting, m);
      if (hasConflict) {
        console.log(
          `Time conflict detected with: ${m.title || m.content} (${
            m.startTime
          }-${m.endTime})`
        );
      }
      return hasConflict;
    });

    console.log(`Total conflicts found: ${conflicts.length}`);
    return conflicts;
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
   * Get meetings for today with enhanced debugging
   */
  getTodayMeetings(data) {
    const today = DateTimeUtils.getCurrentDate();
    console.log(`Looking for meetings on date: ${today}`);

    if (!Array.isArray(data)) {
      console.warn("getTodayMeetings received non-array data:", data);
      return [];
    }

    console.log(`Searching through ${data.length} total meetings`);

    // Log all meeting dates for debugging
    data.forEach((meeting, index) => {
      console.log(
        `Meeting ${index}: date="${meeting.date}", title="${
          meeting.title || meeting.content
        }"`
      );
    });

    const todayMeetings = data.filter((meeting) => {
      const isToday = meeting.date === today;
      if (isToday) {
        console.log(
          `Found today's meeting: ${meeting.title || meeting.content} at ${
            meeting.startTime
          }`
        );
      }
      return isToday;
    });

    console.log(`Found ${todayMeetings.length} meetings for today (${today})`);
    return todayMeetings;
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
        ) && !meeting.isEnded
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
          DateTimeUtils.timeToMinutes(currentTime) && !meeting.isEnded
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

  /**
   * Show a warning about data issues
   */
  _showDataWarning(message) {
    console.warn("⚠️ " + message);

    // Create toast notification
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="color: #FFD700; font-size: 24px;">⚠️</div>
        <div>${message}</div>
      </div>
    `;
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.opacity = "1";
    }, 100);

    // Remove after 8 seconds
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 8000);
  }

  /**
   * Force a complete refresh of all data and UI updates
   */
  async forceRefresh() {
    console.log("🔄 Forcing complete data and UI refresh");

    try {
      // Clear any cached data first
      const cachedData = this.getCachedMeetingData();

      // Load fresh data from server
      const meetings = await this.dataService.getMeetings();

      if (Array.isArray(meetings)) {
        this.setCachedMeetingData(meetings);
        this.isOnline = true;
        this.lastSync = new Date();

        // Get today's meetings
        const todayMeetings = this.getTodayMeetings(meetings);

        console.log(
          `Force refresh loaded ${meetings.length} meetings, ${todayMeetings.length} for today`
        );

        // Dispatch multiple events for different UI components
        document.dispatchEvent(
          new CustomEvent("meetingDataUpdated", {
            detail: { meetings, todayMeetings },
          })
        );

        document.dispatchEvent(
          new CustomEvent("roomStatusUpdate", {
            detail: { todayMeetings },
          })
        );

        document.dispatchEvent(
          new CustomEvent("dashboardUpdate", {
            detail: { meetings, todayMeetings },
          })
        );

        // Special event just for room refresh
        document.dispatchEvent(
          new CustomEvent("refreshRoomStatus", {
            detail: { todayMeetings },
          })
        );

        return meetings;
      }

      return cachedData;
    } catch (error) {
      console.error("Force refresh failed:", error);
      return this.getCachedMeetingData();
    }
  }

  /**
   * Update a meeting (for tooltip edit functionality)
   * @param {Object} meetingData - Complete meeting data with id
   * @returns {Promise<Object>} Updated meeting data
   */
  async updateMeeting(meetingData) {
    try {
      console.log("🔄 Updating meeting:", meetingData.id);

      // Validate meeting data
      if (!meetingData.id) {
        throw new Error("Meeting ID is required for update");
      }

      // Get current data
      const currentData = this.getCachedMeetingData();
      const meetingIndex = currentData.findIndex(
        (m) => m.id === meetingData.id
      );

      if (meetingIndex === -1) {
        throw new Error("Meeting not found");
      }

      // Preserve original creation data and update
      const existingMeeting = currentData[meetingIndex];
      const updatedMeeting = {
        ...existingMeeting,
        ...meetingData,
        id: meetingData.id, // Ensure ID doesn't change
        createdAt: existingMeeting.createdAt, // Preserve creation time
        updatedAt: new Date().toISOString(), // Add update timestamp
      };

      // Validate the updated meeting
      if (!this.validateMeetingData(updatedMeeting)) {
        throw new Error("Invalid meeting data");
      }

      // Check for conflicts (excluding the current meeting)
      const otherMeetings = currentData.filter((m) => m.id !== meetingData.id);
      console.log(
        `Checking conflicts: total meetings = ${currentData.length}, excluding current meeting = ${otherMeetings.length}`
      );
      console.log(`Current meeting ID being updated: ${meetingData.id}`);

      const conflicts = this.checkMeetingConflicts(
        updatedMeeting,
        otherMeetings
      );
      if (conflicts.length > 0) {
        console.error(
          `Found ${conflicts.length} conflicts for meeting update:`,
          conflicts
        );
        throw new Error(
          `Meeting conflicts with existing meeting(s): ${conflicts
            .map((m) => `${m.content} (${m.startTime}-${m.endTime})`)
            .join(", ")}`
        );
      }

      // Update local cache
      const newData = [...currentData];
      newData[meetingIndex] = updatedMeeting;
      this.setCachedMeetingData(newData);

      // Try to save to server
      try {
        const domain =
          localStorage.getItem("domain") ||
          window.location.origin ||
          "http://localhost" ||
          "http://localhost:3000";

        const response = await fetch(
          `${domain}/api/meetings/${meetingData.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedMeeting),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const serverResponse = await response.json();
        console.log("✅ Meeting updated on server:", serverResponse);

        this.lastSync = new Date();
        this.isOnline = true;
      } catch (serverError) {
        console.warn(
          "Failed to update meeting on server, keeping local changes:",
          serverError
        );
        this.isOnline = false;
      }

      // Always trigger local UI updates
      this._triggerMeetingUpdate(newData);
      this._triggerRoomStatusUpdate(this.getTodayMeetings(newData));

      // Broadcast update to other clients
      this._broadcastMeetingUpdate(updatedMeeting);

      console.log("✅ Meeting updated successfully:", updatedMeeting);
      return updatedMeeting;
    } catch (error) {
      console.error("❌ Error updating meeting:", error);
      throw error;
    }
  }

  /**
   * Broadcast meeting update to other clients
   */
  _broadcastMeetingUpdate(meetingData) {
    // Dispatch custom event for local components
    document.dispatchEvent(
      new CustomEvent("meetingUpdated", {
        detail: { meeting: meetingData },
      })
    );

    // If using WebSockets or other real-time communication, add here
    // For now, we rely on periodic refresh by other clients
  }

  /**
   * Get all meetings (for tooltip access)
   */
  getAllMeetings() {
    return this.getCachedMeetingData();
  }
}

export default MeetingDataManager;
