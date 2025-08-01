/**
 * Event Handlers
 * Manages all DOM event listeners and user interactions
 */

import { DateTimeUtils } from "../utils/core.js";

export class EventHandlers {
  constructor(managers) {
    this.meetingDataManager = managers.meetingDataManager;
    this.uiManager = managers.uiManager;
    this.roomManager = managers.roomManager;
    this.deviceManager = managers.deviceManager;

    this.setupEventListeners();
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    this._setupDocumentReady();
    this._setupFileUpload();
    this._setupDatePicker();
    this._setupEndMeetingHandlers();
    this._setupRoomNavigation();
    this._setupACControlHandlers();
    this._setupCustomEvents();
  }

  /**
   * Document ready event
   */
  _setupDocumentReady() {
    document.addEventListener("DOMContentLoaded", () => {
      console.log("Document ready - initializing application...");

      // Initialize all managers
      this.deviceManager.initialize();

      // Load any cached data on startup
      this._loadCachedDataOnStartup();

      // Setup basic check for updates
      this._setupBasicCheck();

      // Add UI feedback for buttons
      this._setupButtonFeedback();
    });
  }

  /**
   * File upload event handlers
   */
  _setupFileUpload() {
    document.addEventListener("DOMContentLoaded", () => {
      const uploadButton = document.getElementById("uploadButton");
      const fileInput = document.getElementById("fileInput");

      if (!uploadButton || !fileInput) {
        console.warn("Upload elements not found");
        return;
      }

      uploadButton.addEventListener("click", () => {
        fileInput.click();
      });

      fileInput.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (file) {
          await this._handleFileUpload(file);
        }
      });
    });
  }

  /**
   * Date picker event handler
   */
  _setupDatePicker() {
    document.addEventListener("DOMContentLoaded", () => {
      const datePicker = document.getElementById("meetingDatePicker");

      if (datePicker) {
        datePicker.addEventListener("change", (event) => {
          const selectedDate = new Date(event.target.value);
          const data = this.meetingDataManager.getCachedMeetingData();

          if (data && data.length > 0) {
            const filteredData = data.filter((meeting) => {
              const meetingDate = new Date(
                meeting.date.split("/").reverse().join("-")
              );
              return meetingDate.toDateString() === selectedDate.toDateString();
            });
            this.roomManager.updateScheduleTable(filteredData);
          }
        });
      }
    });
  }

  /**
   * Setup end meeting event handlers
   */
  _setupEndMeetingHandlers() {
    document.addEventListener("DOMContentLoaded", () => {
      this._setupEndMeetingHandlers();
    });

    // Handle end meeting requests from room pages
    document.addEventListener("endMeetingRequested", (event) => {
      this.meetingDataManager.handleEndMeeting(event.detail.event);
    });

    // Handle early end meeting events
    document.addEventListener("meetingEndedEarly", (event) => {
      console.log("Meeting ended early event received:", event.detail);

      const { meeting, originalEndTime, newEndTime } = event.detail;

      // Force refresh all UI components
      setTimeout(() => {
        // Refresh room status
        if (this.roomManager) {
          this.roomManager.updateRoomStatus(window.currentMeetingData || []);
        }

        // Refresh schedule view
        if (window.scheduleBookingManager) {
          window.scheduleBookingManager._renderMeetingsForCurrentWeek();
        }

        // Show UI notification
        if (this.uiManager) {
          this.uiManager.showNotification(
            `Cuộc họp "${
              meeting.title || meeting.content
            }" đã kết thúc sớm (${originalEndTime} → ${newEndTime})`,
            "success",
            4000
          );
        }
      }, 500);
    });
  }

  /**
   * Setup room navigation handlers
   */
  _setupRoomNavigation() {
    document.addEventListener("DOMContentLoaded", () => {
      // Room button handlers
      const roomButtons = document.querySelectorAll(".room-button");

      roomButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
          const roomType =
            event.target.dataset.room || event.target.textContent.toLowerCase();

          if (roomType.includes("3") || roomType.includes("lầu 3")) {
            this.roomManager.loadDynamicPage("room3");
          } else if (roomType.includes("4") || roomType.includes("lầu 4")) {
            this.roomManager.loadDynamicPage("room4");
          }
        });
      });

      // Back to main view handlers
      document.addEventListener("click", (event) => {
        if (event.target.classList.contains("back-to-main")) {
          // Use proper navigation instead of reload
          console.log("🏠 Back to main view requested");

          // Dispatch navigation event for proper handling
          document.dispatchEvent(
            new CustomEvent("navigateToHome", {
              detail: { from: "backToMainHandler" },
            })
          );

          // Prevent default behavior
          event.preventDefault();
          event.stopPropagation();
        }
      });
    });
  }

  /**
   * Setup AC control handlers
   */
  _setupACControlHandlers() {
    document.addEventListener("click", (event) => {
      const acCard = event.target.closest(".ac-card");
      if (!acCard) return;

      // Get room from data attribute
      const room = acCard.dataset.room;
      if (!room) return;

      // Check if it's a control button
      if (event.target.closest(".controls .btn:first-child")) {
        // Toggle AC state
        const currentState = this.deviceManager.acStates[room]?.isOn || false;
        const newAction = currentState ? "off" : "on";

        this.deviceManager.handleACControl(room, newAction);
        this.deviceManager.updateACStatus(acCard, room);
      }
    });
  }

  /**
   * Setup custom application events
   */
  _setupCustomEvents() {
    // Meeting data update events
    document.addEventListener("meetingDataUpdated", (event) => {
      const { meetings, todayMeetings } = event.detail;

      // Update UI components
      this.roomManager.updateScheduleTable(todayMeetings);
      this.roomManager.updateRoomStatus(meetings);

      this.uiManager.showNotification(
        "Meeting data updated successfully",
        "success",
        2000
      );
    });

    // Room status update events
    document.addEventListener("roomStatusUpdate", (event) => {
      const { todayMeetings } = event.detail;
      this.roomManager.updateRoomStatus(todayMeetings);
    });

    // File monitoring events
    document.addEventListener("fileMonitoringStarted", (event) => {
      this.uiManager.showNotification(
        "File monitoring started - changes will be detected automatically",
        "info",
        3000
      );
    });

    document.addEventListener("fileMonitoringStopped", () => {
      this.uiManager.showNotification(
        "File monitoring stopped",
        "warning",
        2000
      );
    });
  }

  /**
   * Handle file upload process
   */
  async _handleFileUpload(file) {
    try {
      this.uiManager.updateProgress(10, "Initializing...");
      this.uiManager.showProgressBar();

      this.uiManager.updateProgress(40, "Processing data...");
      const data = await this.meetingDataManager.processExcelFile(file);

      // Store the current meeting data in memory
      let processedData = data.map((meeting) => ({
        ...meeting,
        isEnded: false,
        forceEndedByUser: false,
      }));

      // Filter meetings for today
      const todayMeetings =
        this.meetingDataManager.getTodayMeetings(processedData);

      this.uiManager.updateProgress(60, "Updating schedule...");

      // Check if there are any meetings today
      if (todayMeetings.length > 0) {
        this.roomManager.updateScheduleTable(todayMeetings);
        this.roomManager.updateRoomStatus(todayMeetings);
      } else {
        this.roomManager.updateScheduleTable([]);
        this.roomManager.updateRoomStatus([]);
        this.uiManager.showNoMeetingsNotification();
      }

      this.roomManager.startAutoUpdate(processedData);

      this.uiManager.updateProgress(80, "Saving to memory...");
      this.meetingDataManager.setCachedMeetingData(processedData);

      this.uiManager.updateProgress(90, "Setting up monitoring...");

      // Start file monitoring if file handle is available
      if (file.handle) {
        await this.meetingDataManager.startFileMonitoring(file.handle);
      }

      this.uiManager.updateProgress(100, "Complete!");

      setTimeout(() => {
        this.uiManager.hideProgressBar();
      }, 1000);

      console.log("File upload completed successfully");
    } catch (error) {
      console.error("Error handling file upload:", error);
      this.uiManager.hideProgressBar();
      this.uiManager.showErrorModal(`Lỗi xử lý file: ${error.message}`);
    }
  }

  /**
   * Load cached data on startup
   */
  _loadCachedDataOnStartup() {
    console.log("[App] Local mode - waiting for file upload");

    // Show empty state initially
    this.roomManager.updateScheduleTable([]);
    this.roomManager.updateRoomStatus([]);
  }

  /**
   * Setup basic check for display updates
   */
  _setupBasicCheck() {
    const checkDisplayUpdate = () => {
      const now = new Date();
      console.log("[App] Basic display update check");

      // Simply refresh cached data every hour to keep display updated
      const cachedData = this.meetingDataManager.getCachedMeetingData();
      if (cachedData && Array.isArray(cachedData)) {
        // Filter today's meetings
        const todayMeetings =
          this.meetingDataManager.getTodayMeetings(cachedData);
        this.roomManager.updateRoomStatus(todayMeetings);
      }
    };

    // Check every 30 minutes
    setInterval(checkDisplayUpdate, 30 * 60 * 1000);

    // Initial check
    setTimeout(checkDisplayUpdate, 5000);
  }

  /**
   * Setup button visual feedback
   */
  _setupButtonFeedback() {
    setTimeout(() => {
      document.querySelectorAll(".btn").forEach((btn) => {
        btn.addEventListener("click", function () {
          this.classList.add("btn-feedback");
          setTimeout(() => this.classList.remove("btn-feedback"), 300);
        });
      });
    }, 500);
  }

  /**
   * Specific event handler for end meeting functionality
   */
  _setupEndMeetingHandlers() {
    // This function sets up end meeting button handlers for dynamically created content
    const setupHandlers = () => {
      const endMeetingButtons = document.querySelectorAll(".end-meeting");

      endMeetingButtons.forEach((button) => {
        // Remove existing listeners to prevent duplicates
        button.replaceWith(button.cloneNode(true));

        // Add new listener
        const newButton = document.querySelector(".end-meeting");
        if (newButton) {
          newButton.addEventListener("click", (event) => {
            this.meetingDataManager.handleEndMeeting(event);
          });
        }
      });
    };

    // Setup handlers for initially loaded content
    document.addEventListener("DOMContentLoaded", setupHandlers);

    // Setup handlers for dynamically loaded content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          const addedNodes = Array.from(mutation.addedNodes);
          const hasEndMeetingButton = addedNodes.some(
            (node) =>
              node.nodeType === Node.ELEMENT_NODE &&
              (node.classList?.contains("end-meeting") ||
                node.querySelector?.(".end-meeting"))
          );

          if (hasEndMeetingButton) {
            setTimeout(setupHandlers, 100);
          }
        }
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Cleanup event listeners
   */
  cleanup() {
    // Clean up any intervals or observers
    this.roomManager.stopAutoUpdate();

    // Check if stopFileMonitoring method exists before calling
    if (
      this.meetingDataManager &&
      typeof this.meetingDataManager.stopFileMonitoring === "function"
    ) {
      this.meetingDataManager.stopFileMonitoring();
    }

    this.deviceManager.cleanup();
  }

  /**
   * Cleanup event handlers and managers
   */
  cleanup() {
    // Clean up any intervals or observers
    this.roomManager.stopAutoUpdate();

    // Check if stopFileMonitoring method exists before calling
    if (
      this.meetingDataManager &&
      typeof this.meetingDataManager.stopFileMonitoring === "function"
    ) {
      this.meetingDataManager.stopFileMonitoring();
    }

    this.deviceManager.cleanup();
  }
}

export default EventHandlers;
