/**
 * UI Manager
 * Handles progress bars, notifications, modals, settings, and general UI interactions
 */

import { UI_CONFIG, STORAGE_KEYS, API_BASE_URL } from "../config/constants.js";
import { DOMUtils, DateTimeUtils } from "../utils/core.js";

export class UIManager {
  constructor() {
    this.progressContainer = null;
    this.progressBar = null;
    this.progressStatus = null;
    this.init();
  }

  init() {
    this._initializeProgressBar();
    this._initializeSettings();
  }

  /**
   * Progress Bar Management
   */
  showProgressBar() {
    if (!this.progressContainer) return;

    this.progressContainer.style.display = "block";
    setTimeout(() => {
      this.progressContainer.style.opacity = "1";
    }, UI_CONFIG.PROGRESS_BAR_DELAY);
  }

  hideProgressBar() {
    if (!this.progressContainer) return;

    this.progressContainer.style.opacity = "0";
    setTimeout(() => {
      this.progressContainer.style.display = "none";
    }, UI_CONFIG.MODAL_ANIMATION_DELAY);
  }

  updateProgress(percentage, message = "") {
    if (this.progressBar) {
      this.progressBar.style.width = `${percentage}%`;
    }

    if (this.progressStatus && message) {
      this.progressStatus.textContent = message;
    }

    console.log(`Progress: ${percentage}% - ${message}`);
  }

  /**
   * Notification System
   */
  showNotification(
    message,
    type = "info",
    duration = UI_CONFIG.NOTIFICATION_DURATION
  ) {
    const notification = DOMUtils.createElement(
      "div",
      `notification notification-${type}`,
      `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `
    );

    document.body.appendChild(notification);

    // Trigger show animation
    setTimeout(() => {
      notification.classList.add("show");
    }, 10);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        notification.remove();
      }, duration);
    }

    return notification;
  }

  // Alias for internal use
  _showNotification(
    message,
    type = "info",
    duration = UI_CONFIG.NOTIFICATION_DURATION
  ) {
    this.showNotification(message, type, duration);
  }

  showNoMeetingsNotification() {
    const existingNotification = document.querySelector(
      ".no-meetings-notification"
    );
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = DOMUtils.createElement(
      "div",
      "no-meetings-notification",
      `
      <div class="notification-content">
        <div class="notification-icon">📅</div>
        <div class="notification-text">
          <h3>Không có cuộc họp nào hôm nay</h3>
          <p>Hiện tại không có cuộc họp nào được lên lịch cho ngày hôm nay.</p>
        </div>
      </div>
    `
    );

    document.body.appendChild(notification);

    // Show animation
    setTimeout(() => {
      notification.classList.add("show");
    }, 10);

    // Auto hide after 5 seconds
    setTimeout(() => {
      this._removeNotification(notification);
    }, 5000);
  }

  showErrorModal(message) {
    const modal = DOMUtils.createElement(
      "div",
      "error-modal-overlay",
      `
      <div class="error-modal">
        <div class="error-modal-header">
          <h3>Lỗi xử lý dữ liệu</h3>
          <button class="error-modal-close">×</button>
        </div>
        <div class="error-modal-body">
          <pre>${message}</pre>
        </div>
        <div class="error-modal-footer">
          <button class="error-modal-ok">OK</button>
        </div>
      </div>
    `
    );

    document.body.appendChild(modal);

    // Event listeners
    const closeBtn = modal.querySelector(".error-modal-close");
    const okBtn = modal.querySelector(".error-modal-ok");

    const closeModal = () => {
      modal.classList.add("hiding");
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      }, UI_CONFIG.MODAL_ANIMATION_DELAY);
    };

    closeBtn.addEventListener("click", closeModal);
    okBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    // Show animation
    setTimeout(() => {
      modal.classList.add("show");
    }, 10);
  }

  /**
   * Settings Management
   */
  initializeSettingsUI() {
    const elements = {
      settingsIcon: document.querySelector(".settings-icon"),
      settingsContent: document.querySelector(".settings-content"),
      mainBgContainer: document.querySelector(".main-bg-container"),
      resetBackgroundButton: document.querySelector(".reset-background-button"),
      changeNameContainer: document.querySelector(".change-name-container"),
      welcomeMessage: document.querySelector(".welcome-message"),
    };

    if (!elements.settingsIcon) return;

    // Settings menu handlers
    const settingsHandlers = {
      toggleMenu: (event) => {
        event.stopPropagation();
        const classes = [
          elements.settingsContent,
          elements.mainBgContainer,
          elements.resetBackgroundButton,
          elements.changeNameContainer,
        ];

        classes.forEach((element) => element?.classList.toggle("active"));

        elements.settingsIcon.style.transform =
          elements.settingsContent?.classList.contains("active")
            ? "rotate(90deg)"
            : "rotate(0deg)";
      },

      closeMenu: () => {
        const classes = [
          elements.settingsContent,
          elements.mainBgContainer,
          elements.resetBackgroundButton,
          elements.changeNameContainer,
        ];

        classes.forEach((element) => element?.classList.remove("active"));
        elements.settingsIcon.style.transform = "rotate(0deg)";
      },
    };

    // Event listeners
    elements.settingsIcon.addEventListener(
      "click",
      settingsHandlers.toggleMenu
    );

    // Close settings when clicking outside
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".background-management")) {
        settingsHandlers.closeMenu();
      }
    });

    this._initializeNameChangeModal(elements);
    this._loadSavedSettings(elements);

    return { elements, settingsHandlers };
  }

  /**
   * Background Management
   */
  initializeBackgroundManagement() {
    const mainBackgroundUploadBtn = document.querySelector(
      ".main-background-btn"
    );
    const mainBackgroundUploadInput = document.getElementById(
      "mainBackgroundUpload"
    );
    const resetBackgroundButton = document.querySelector(
      ".reset-background-button"
    );

    const meetingScreen = document.querySelector(".meeting-screen");

    if (!mainBackgroundUploadBtn) return;

    // Upload handlers
    mainBackgroundUploadBtn.addEventListener("click", () => {
      mainBackgroundUploadInput?.click();
    });

    mainBackgroundUploadInput?.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        this._handleBackgroundUpload(file, "main", meetingScreen);
      }
    });

    resetBackgroundButton?.addEventListener("click", () => {
      this._showResetBackgroundModal(meetingScreen);
    });

    // Apply stored backgrounds
    this._applyStoredBackgrounds(meetingScreen);
  }

  /**
   * Clock and Date Display
   */
  initializeClock() {
    const updateClock = () => {
      // Only target homepage time elements, not room page elements
      const timeElements = [
        document.getElementById("currentTimeHomePage"),
        // Add other homepage time elements if needed
      ].filter(Boolean); // Remove null elements

      timeElements.forEach((element) => {
        if (element) {
          // Use the proper Vietnam time from DateTimeUtils
          const vietnamTime = DateTimeUtils.getCurrentTime();
          // Extract hours and minutes from the format "HH:MM:SS"
          const timeParts = vietnamTime.split(":");
          const hours = timeParts[0];
          const minutes = timeParts[1];
          element.textContent = `${hours}:${minutes}`;
        }
      });
    };

    const updateDate = () => {
      // Only target homepage date elements, not room page elements
      const dateElements = [
        document.getElementById("currentDateHomePage"),
        // Add other homepage date elements if needed
      ].filter(Boolean); // Remove null elements

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

      // Get proper Vietnam timezone date
      const timezoneOffsetHours = -now.getTimezoneOffset() / 60;
      let vietnamDate;

      if (timezoneOffsetHours === 7) {
        // Already in Vietnam timezone
        vietnamDate = now;
      } else {
        // Convert to Vietnam timezone (UTC+7)
        const offsetDifference = 7 - timezoneOffsetHours;
        vietnamDate = new Date(
          now.getTime() + offsetDifference * 60 * 60 * 1000
        );
      }

      const dayOfWeek = daysOfWeek[vietnamDate.getDay()];
      const day = vietnamDate.getDate();
      const month = months[vietnamDate.getMonth()];
      const year = vietnamDate.getFullYear();

      const formattedDate = `${dayOfWeek}, ${day} ${month}, ${year}`;

      dateElements.forEach((element) => {
        if (element) {
          element.textContent = formattedDate;
        }
      });
    };

    // Update immediately and then every second
    updateClock();
    updateDate();
    setInterval(updateClock, 1000);
    setInterval(updateDate, 1000);
  }

  /**
   * Fullscreen Management
   */
  initializeFullscreen() {
    const fullscreenBtn = document.getElementById("fullscreenBtn");
    const meetingContainer = document.querySelector(".meeting-container");

    if (!fullscreenBtn) return;

    const toggleFullScreen = () => {
      if (!document.fullscreenElement) {
        if (meetingContainer?.requestFullscreen) {
          meetingContainer.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    };

    fullscreenBtn.addEventListener("click", toggleFullScreen);

    // Handle fullscreen change
    document.addEventListener("fullscreenchange", () => {
      const isFullscreen = !!document.fullscreenElement;
      document.body.classList.toggle("fullscreen-mode", isFullscreen);

      // Move booking modal to fullscreen container when entering fullscreen
      this._handleModalInFullscreen(isFullscreen);
    });
  }

  /**
   * Handle modal positioning in fullscreen mode
   */
  _handleModalInFullscreen(isFullscreen) {
    const bookingModal = document.getElementById("bookingModal");
    const editMeetingModal = document.getElementById("editMeetingModal");
    const passwordModal = document.getElementById("passwordModal");
    const meetingDetailTooltip = document.getElementById(
      "meeting-detail-tooltip"
    );
    const meetingContainer = document.querySelector(".meeting-container");
    const modalContainer = document.querySelector(".modal-container");

    if (!meetingContainer) return;

    if (isFullscreen) {
      // Sync background from meeting-screen to fullscreen container
      this._syncBackgroundToFullscreen(meetingContainer);

      // Move booking modal into fullscreen container
      if (bookingModal && bookingModal.parentNode !== meetingContainer) {
        // Store original parent for restoration
        bookingModal.setAttribute("data-original-parent", "body");
        meetingContainer.appendChild(bookingModal);

        // Update booking modal reference in ScheduleBookingManager if it exists
        this._updateBookingModalReference();
      }

      // Move edit meeting modal into fullscreen container
      if (
        editMeetingModal &&
        editMeetingModal.parentNode !== meetingContainer
      ) {
        // Store original parent for restoration
        editMeetingModal.setAttribute("data-original-parent", "body");
        meetingContainer.appendChild(editMeetingModal);

        console.log("Moved edit meeting modal to fullscreen container");
      }

      // Move password modal into fullscreen container
      if (passwordModal && passwordModal.parentNode !== meetingContainer) {
        // Store original parent for restoration
        passwordModal.setAttribute("data-original-parent", "body");
        meetingContainer.appendChild(passwordModal);

        console.log(
          "#################### Moved password modal to fullscreen container"
        );
      }

      // Move meeting detail tooltip into fullscreen container
      if (
        meetingDetailTooltip &&
        meetingDetailTooltip.parentNode !== meetingContainer
      ) {
        // Store original parent for restoration
        meetingDetailTooltip.setAttribute("data-original-parent", "body");
        meetingContainer.appendChild(meetingDetailTooltip);

        // Update tooltip reference in MeetingDetailTooltip if it exists
        this._updateMeetingDetailTooltipReference();
      }

      // Also move modal-container if it exists
      if (modalContainer && modalContainer.parentNode !== meetingContainer) {
        modalContainer.setAttribute("data-original-parent", "body");
        meetingContainer.appendChild(modalContainer);
      }

      console.log("Moved modals and tooltips to fullscreen container");
    } else {
      // Restore booking modal to original position
      if (
        bookingModal &&
        bookingModal.getAttribute("data-original-parent") === "body"
      ) {
        document.body.appendChild(bookingModal);
        bookingModal.removeAttribute("data-original-parent");

        // Update booking modal reference in ScheduleBookingManager if it exists
        this._updateBookingModalReference();
      }

      // Restore edit meeting modal to original position
      if (
        editMeetingModal &&
        editMeetingModal.getAttribute("data-original-parent") === "body"
      ) {
        document.body.appendChild(editMeetingModal);
        editMeetingModal.removeAttribute("data-original-parent");

        console.log("Restored edit meeting modal to original position");
      }

      // Restore password modal to original position
      if (
        passwordModal &&
        passwordModal.getAttribute("data-original-parent") === "body"
      ) {
        document.body.appendChild(passwordModal);
        passwordModal.removeAttribute("data-original-parent");

        console.log(
          "#################### Restored password modal to original position"
        );
      }

      // Restore meeting detail tooltip to original position
      if (
        meetingDetailTooltip &&
        meetingDetailTooltip.getAttribute("data-original-parent") === "body"
      ) {
        document.body.appendChild(meetingDetailTooltip);
        meetingDetailTooltip.removeAttribute("data-original-parent");

        // Update tooltip reference in MeetingDetailTooltip if it exists
        this._updateMeetingDetailTooltipReference();
      }

      // Restore modal-container
      if (
        modalContainer &&
        modalContainer.getAttribute("data-original-parent") === "body"
      ) {
        document.body.appendChild(modalContainer);
        modalContainer.removeAttribute("data-original-parent");
      }

      // Clear background styles when exiting fullscreen
      this._clearFullscreenBackground(meetingContainer);

      console.log("Restored modals and tooltips to original positions");
    }
  }

  /**
   * Update booking modal reference in other managers
   */
  _updateBookingModalReference() {
    // Update reference in ScheduleBookingManager if it exists
    if (
      window.scheduleBookingManager &&
      window.scheduleBookingManager.bookingModal
    ) {
      window.scheduleBookingManager.bookingModal =
        document.getElementById("bookingModal");
      console.log("Updated booking modal reference in ScheduleBookingManager");
    }
  }

  /**
   * Update meeting detail tooltip reference in other managers
   */
  _updateMeetingDetailTooltipReference() {
    // Update reference in MeetingDetailTooltip if it exists
    if (
      window.meetingDetailTooltip &&
      window.meetingDetailTooltip.currentTooltip
    ) {
      window.meetingDetailTooltip.currentTooltip = document.getElementById(
        "meeting-detail-tooltip"
      );
      console.log(
        "Updated meeting detail tooltip reference in MeetingDetailTooltip"
      );
    }
  }

  /**
   * Check and move any new modals to fullscreen container if currently in fullscreen
   */
  _handleDynamicModalInFullscreen() {
    // Only do this if we're currently in fullscreen mode
    if (!document.fullscreenElement) return;

    const meetingContainer = document.querySelector(".meeting-container");
    if (!meetingContainer) return;

    // Check for editMeetingModal that might have been created after fullscreen
    const editMeetingModal = document.getElementById("editMeetingModal");
    if (editMeetingModal && editMeetingModal.parentNode === document.body) {
      editMeetingModal.setAttribute("data-original-parent", "body");
      meetingContainer.appendChild(editMeetingModal);
      console.log(
        "Moved newly created edit meeting modal to fullscreen container"
      );
    }

    // Check for passwordModal that might have been created after fullscreen
    const passwordModal = document.getElementById("passwordModal");
    if (passwordModal && passwordModal.parentNode === document.body) {
      passwordModal.setAttribute("data-original-parent", "body");
      meetingContainer.appendChild(passwordModal);
      console.log(
        "#################### Moved newly created password modal to fullscreen container"
      );
    }

    // Check for any other dynamic modals with booking-modal class
    const dynamicModals = document.querySelectorAll("body > .booking-modal");
    dynamicModals.forEach((modal) => {
      if (
        modal.parentNode === document.body &&
        !modal.getAttribute("data-original-parent")
      ) {
        modal.setAttribute("data-original-parent", "body");
        meetingContainer.appendChild(modal);
        console.log(
          "Moved newly created modal to fullscreen container:",
          modal.id
        );
      }
    });
  }

  /**
   * Expose method for external use when modals are created dynamically
   */
  handleNewModalInFullscreen() {
    this._handleDynamicModalInFullscreen();
  }

  /**
   * Sync background from meeting-screen to fullscreen container
   */
  _syncBackgroundToFullscreen(meetingContainer) {
    const meetingScreen = document.querySelector(".meeting-screen");

    if (!meetingScreen) return;

    // Get computed style from meeting-screen
    const computedStyle = window.getComputedStyle(meetingScreen);
    const backgroundImage = computedStyle.backgroundImage;
    const backgroundSize = computedStyle.backgroundSize;
    const backgroundPosition = computedStyle.backgroundPosition;
    const backgroundRepeat = computedStyle.backgroundRepeat;

    // Apply background to fullscreen container
    if (backgroundImage && backgroundImage !== "none") {
      meetingContainer.style.backgroundImage = backgroundImage;
      meetingContainer.style.backgroundSize = backgroundSize;
      meetingContainer.style.backgroundPosition = backgroundPosition;
      meetingContainer.style.backgroundRepeat = backgroundRepeat;

      console.log(
        "#################### Background synced to fullscreen container"
      );
    }
  }

  /**
   * Clear background styles when exiting fullscreen
   */
  _clearFullscreenBackground(meetingContainer) {
    if (!meetingContainer) return;

    // Remove inline background styles so CSS rules take over
    meetingContainer.style.backgroundImage = "";
    meetingContainer.style.backgroundSize = "";
    meetingContainer.style.backgroundPosition = "";
    meetingContainer.style.backgroundRepeat = "";

    console.log("#################### Cleared fullscreen background styles");
  }

  /**
   * Private helper methods
   */
  _initializeProgressBar() {
    this.progressContainer = document.getElementById("progressContainer");
    this.progressBar = document.getElementById("progressBar");
    this.progressStatus = document.getElementById("progressStatus");

    // Add stop button functionality
    const stopBtn = document.getElementById("stopUploadBtn");
    if (stopBtn) {
      stopBtn.addEventListener("click", () => this.hideProgressBar());
    }
  }

  _initializeSettings() {
    // This will be called when DOM is ready
    document.addEventListener("DOMContentLoaded", () => {
      this.initializeSettingsUI();
      this.initializeBackgroundManagement();
      this.initializeClock();
      this.initializeFullscreen();
    });
  }

  _initializeNameChangeModal(elements) {
    const modalTemplate = `
      <div class="modal-overlay"></div>
      <div class="name-change-modal">
        <input type="text" id="newNameInput" placeholder="Nhập tên mới">
        <div class="modal-buttons">
          <button class="modal-button cancel-button">Hủy</button>
          <button class="modal-button save-button">Lưu</button>
        </div>
      </div>
    `;

    const initializeModal = () => {
      const modalContainer = document.body;
      modalContainer.insertAdjacentHTML("beforeend", modalTemplate);

      return {
        overlay: document.querySelector(".modal-overlay"),
        modal: document.querySelector(".name-change-modal"),
        input: document.getElementById("newNameInput"),
        saveBtn: document.querySelector(".save-button"),
        cancelBtn: document.querySelector(".cancel-button"),
      };
    };

    let modalElements = null;

    const modalHandlers = {
      open: () => {
        if (!modalElements) {
          modalElements = initializeModal();
          this._setupModalEvents(modalElements, elements);
        }
        modalElements.overlay.style.display = "block";
        modalElements.modal.style.display = "block";
        modalElements.input.focus();
      },

      close: () => {
        if (modalElements) {
          modalElements.overlay.style.display = "none";
          modalElements.modal.style.display = "none";
          modalElements.input.value = "";
        }
      },

      save: () => {
        if (modalElements) {
          const newName = modalElements.input.value.trim();
          if (newName) {
            localStorage.setItem(STORAGE_KEYS.WELCOME_MESSAGE, newName);
            if (elements.welcomeMessage) {
              elements.welcomeMessage.textContent = newName;
            }
          }
          modalHandlers.close();
        }
      },
    };

    // Change name button handler
    const changeNameButton = document.querySelector(".change-name-button");
    if (changeNameButton) {
      changeNameButton.addEventListener("click", (event) => {
        event.stopPropagation();
        modalHandlers.open();
      });
    }
  }

  _setupModalEvents(modalElements, settingsElements) {
    modalElements.saveBtn.addEventListener("click", () => {
      const newName = modalElements.input.value.trim();
      if (newName) {
        localStorage.setItem(STORAGE_KEYS.WELCOME_MESSAGE, newName);
        if (settingsElements.welcomeMessage) {
          settingsElements.welcomeMessage.textContent = newName;
        }
      }
      modalElements.overlay.style.display = "none";
      modalElements.modal.style.display = "none";
      modalElements.input.value = "";
    });

    modalElements.cancelBtn.addEventListener("click", () => {
      modalElements.overlay.style.display = "none";
      modalElements.modal.style.display = "none";
      modalElements.input.value = "";
    });

    modalElements.input.addEventListener("keyup", (event) => {
      if (event.key === "Enter") {
        modalElements.saveBtn.click();
      }
    });
  }

  _loadSavedSettings(elements) {
    const savedMessage = localStorage.getItem(STORAGE_KEYS.WELCOME_MESSAGE);
    if (savedMessage && elements.welcomeMessage) {
      elements.welcomeMessage.textContent = savedMessage;
    }
  }

  _handleBackgroundUpload(file, type, targetElement) {
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      this._showNotification(
        `Tệp hình ảnh quá lớn. Vui lòng chọn hình ảnh nhỏ hơn 10MB. (Kích thước hiện tại: ${(
          file.size /
          1024 /
          1024
        ).toFixed(2)}MB)`,
        "error"
      );
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      this._showNotification(
        "Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, GIF, etc.)",
        "error"
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this._createBackgroundPreviewModal(e.target.result, type, targetElement);
    };
    reader.readAsDataURL(file);
  }

  _createBackgroundPreviewModal(imageDataUrl, type, targetElement) {
    const modal = DOMUtils.createElement(
      "div",
      "background-preview-modal show",
      `
      <div class="modal-content">
        <h3>Xem trước hình nền</h3>
        <img src="${imageDataUrl}" alt="Preview" style="max-width: 100%; max-height: 300px;">
        <div class="modal-buttons">
          <button class="modal-button cancel-btn">Hủy</button>
          <button class="modal-button apply-btn">Áp dụng</button>
        </div>
      </div>
    `
    );

    document.body.appendChild(modal);

    const applyBtn = modal.querySelector(".apply-btn");
    const cancelBtn = modal.querySelector(".cancel-btn");

    applyBtn.addEventListener("click", async () => {
      try {
        console.log(" Starting background upload...");
        console.log(" API_BASE_URL:", API_BASE_URL);
        console.log(" Upload type:", type);
        console.log(" Image data size:", imageDataUrl.length, "characters");

        const uploadUrl = `${API_BASE_URL}/api/backgrounds/upload`;
        console.log(" Upload URL:", uploadUrl);

        const payload = {
          type: type,
          imageData: imageDataUrl,
        };

        console.log(" Payload prepared, starting fetch...");

        // Upload to server instead of localStorage
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        console.log("Response received:");
        console.log("   Status:", response.status);
        console.log("   Status Text:", response.statusText);
        console.log(
          "   Headers:",
          Object.fromEntries(response.headers.entries())
        );

        // Get response text first to debug what we're receiving
        const responseText = await response.text();
        console.log("Raw response text:", responseText.substring(0, 500));

        // Check if response failed
        if (!response.ok) {
          console.error(
            `❌ Server error: ${response.status} ${response.statusText}`
          );

          // Try to parse error from HTML if it's an Express error page
          if (responseText.includes("PayloadTooLargeError")) {
            throw new Error(
              "Tệp hình ảnh quá lớn. Vui lòng chọn hình ảnh nhỏ hơn 10MB."
            );
          } else if (responseText.includes("<!DOCTYPE html>")) {
            // Extract error message from HTML if possible
            const errorMatch = responseText.match(/<pre>([^<]+)<br>/);
            const errorMsg = errorMatch
              ? errorMatch[1]
              : "Lỗi máy chủ không xác định";
            throw new Error(`Lỗi máy chủ: ${errorMsg}`);
          } else {
            throw new Error(
              `Lỗi máy chủ: ${response.status} ${response.statusText}`
            );
          }
        }

        // Check if response is JSON
        let result;
        try {
          result = JSON.parse(responseText);
          console.log(" Successfully parsed JSON:", result);
        } catch (parseError) {
          console.error(" JSON Parse Error:", parseError);
          console.error(" Full response text:", responseText);
          throw new Error(
            `Máy chủ trả về phản hồi không hợp lệ. Vui lòng thử lại.`
          );
        }

        if (result.success) {
          // Apply background immediately
          targetElement.style.backgroundImage = `url(${imageDataUrl})`;
          targetElement.style.backgroundSize = "cover";
          targetElement.style.backgroundPosition = "center";

          // If in fullscreen mode, also sync to fullscreen container
          if (document.fullscreenElement) {
            const meetingContainer =
              document.querySelector(".meeting-container");
            if (meetingContainer) {
              this._syncBackgroundToFullscreen(meetingContainer);
            }
          }

          console.log(
            ` ${type} background uploaded successfully:`,
            result.filename
          );

          // Show success notification
          this._showNotification(
            `Hình nền ${type === "main" ? "chính" : "lịch"} đã được cập nhật!`,
            "success"
          );
        } else {
          throw new Error(result.error || "Upload failed");
        }
      } catch (error) {
        console.error(`Failed to upload ${type} background:`, error);
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
        this._showNotification(
          `Lỗi khi tải hình nền: ${error.message}`,
          "error"
        );
      }

      this._removeModal(modal);
    });

    cancelBtn.addEventListener("click", () => {
      this._removeModal(modal);
    });
  }

  _showResetBackgroundModal(meetingScreen) {
    const modal = DOMUtils.createElement(
      "div",
      "reset-background-modal show",
      `
      <div class="modal-content">
        <h3>Reset hình nền</h3>
        <p>Bạn có muốn reset hình nền chính không?</p>
        <div class="modal-buttons">
          <button class="modal-button reset-main-btn">Reset hình nền chính</button>
          <button class="modal-button cancel-btn">Hủy</button>
        </div>
      </div>
    `
    );

    document.body.appendChild(modal);

    const resetMainBtn = modal.querySelector(".reset-main-btn");
    const cancelBtn = modal.querySelector(".cancel-btn");

    resetMainBtn.addEventListener("click", async () => {
      try {
        console.log("Starting main background reset...");
        const resetUrl = `${API_BASE_URL}/api/backgrounds/main`;
        console.log("Reset URL:", resetUrl);

        const response = await fetch(resetUrl, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("   Reset response received:");
        console.log("   Status:", response.status);
        console.log("   Status Text:", response.statusText);

        const responseText = await response.text();
        console.log(" Raw response text:", responseText);

        let result;
        try {
          result = JSON.parse(responseText);
          console.log("Successfully parsed JSON:", result);
        } catch (parseError) {
          console.error("JSON Parse Error in reset:", parseError);
          throw new Error(
            `Server returned non-JSON response: ${responseText.substring(
              0,
              100
            )}...`
          );
        }

        if (result.success) {
          meetingScreen.style.backgroundImage =
            "url(assets/imgs/background.jpg)";

          // If in fullscreen mode, also sync to fullscreen container
          if (document.fullscreenElement) {
            const meetingContainer =
              document.querySelector(".meeting-container");
            if (meetingContainer) {
              this._syncBackgroundToFullscreen(meetingContainer);
            }
          }

          console.log(" Main background reset successfully");
          this._showNotification("Hình nền chính đã được reset!", "success");
        } else {
          throw new Error(result.error || "Reset failed");
        }
      } catch (error) {
        console.error("Failed to reset main background:", error);
        this._showNotification(
          `Lỗi khi reset hình nền: ${error.message}`,
          "error"
        );
      }

      this._removeModal(modal);
    });

    cancelBtn.addEventListener("click", () => {
      this._removeModal(modal);
    });
  }

  async _applyStoredBackgrounds(meetingScreen) {
    try {
      console.log("Loading stored backgrounds...");
      const backgroundsUrl = `${API_BASE_URL}/api/backgrounds`;
      console.log("Backgrounds URL:", backgroundsUrl);

      const response = await fetch(backgroundsUrl);

      console.log("Backgrounds response received:");
      console.log("   Status:", response.status);
      console.log("   Status Text:", response.statusText);

      const responseText = await response.text();
      console.log("Raw response text:", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
        console.log("Successfully parsed JSON:", result);
      } catch (parseError) {
        console.error(
          "JSON Parse Error in _applyStoredBackgrounds:",
          parseError
        );
        throw new Error(
          `Server returned non-JSON response: ${responseText.substring(
            0,
            100
          )}...`
        );
      }

      if (result.success) {
        const { backgrounds } = result;
        console.log("Current backgrounds config:", backgrounds);

        // Apply main background if exists
        if (backgrounds.mainBackground && meetingScreen) {
          const imageUrl = `${API_BASE_URL}/api/backgrounds/${backgrounds.mainBackground}`;
          meetingScreen.style.backgroundImage = `url(${imageUrl})`;
          meetingScreen.style.backgroundSize = "cover";
          meetingScreen.style.backgroundPosition = "center";

          // If in fullscreen mode, also sync to fullscreen container
          if (document.fullscreenElement) {
            const meetingContainer =
              document.querySelector(".meeting-container");
            if (meetingContainer) {
              this._syncBackgroundToFullscreen(meetingContainer);
            }
          }

          console.log(
            "✅ Applied stored main background:",
            backgrounds.mainBackground
          );
        }
      } else {
        console.log("No stored backgrounds found, using defaults");
      }
    } catch (error) {
      console.error("Failed to load stored backgrounds:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      // Fallback to localStorage for backwards compatibility
      console.log("Falling back to localStorage...");
      this._applyStoredBackgroundsFromLocalStorage(meetingScreen);
    }
  }

  _applyStoredBackgroundsFromLocalStorage(meetingScreen) {
    const savedMainBackground = localStorage.getItem(
      STORAGE_KEYS.MAIN_BACKGROUND
    );

    if (savedMainBackground && meetingScreen) {
      meetingScreen.style.backgroundImage = `url(${savedMainBackground})`;
      meetingScreen.style.backgroundSize = "cover";
      meetingScreen.style.backgroundPosition = "center";
    }
  }

  _removeModal(modal) {
    modal.classList.remove("show");
    modal.classList.add("hiding");
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, UI_CONFIG.MODAL_ANIMATION_DELAY);
  }

  _removeNotification(notification) {
    notification.classList.remove("show");
    notification.classList.add("hiding");
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, UI_CONFIG.MODAL_ANIMATION_DELAY);
  }

  /**
   * Main Dashboard Management
   * Renders the main dashboard view without page reload
   */
  renderMainDashboard() {
    console.log("Rendering main dashboard view");

    try {
      // Check if meeting-container has room-specific content that needs to be cleared
      const meetingContainer = document.querySelector(".meeting-container");
      if (meetingContainer) {
        // Hide or remove room page wrapper if it exists
        const roomPageWrapper =
          meetingContainer.querySelector(".room-page-wrapper");
        if (roomPageWrapper) {
          console.log("� Hiding room page wrapper");
          roomPageWrapper.style.display = "none";
        }

        // Show main dashboard content if it was hidden
        const contentWrapper =
          meetingContainer.querySelector(".content-wrapper");
        if (contentWrapper) {
          contentWrapper.style.display = "";
          console.log("Showing main dashboard content");
        } else {
          console.log(
            "content-wrapper missing, meeting-container may have been cleared incorrectly"
          );

          // If the main structure is missing, we need to reload the page
          // But check iframe context first
          if (window.self !== window.top) {
            console.log(
              "🔄 In iframe - redirecting to index.html to restore structure"
            );
            window.location.href = "index.html";
            return false;
          } else {
            console.log("Reloading page to restore main structure");
            window.location.reload();
            return false;
          }
        }

        console.log("Meeting container structure preserved");
      }

      // Ensure main dashboard elements are visible
      const mainDashboardElements = [
        ".left-column",
        ".right-column",
        ".rooms-container",
        ".schedule-section",
      ];

      mainDashboardElements.forEach((selector) => {
        const element = document.querySelector(selector);
        if (element) {
          element.style.display = "";
          element.style.visibility = "visible";
          element.style.opacity = "1";
          console.log(`Restored visibility for: ${selector}`);
        } else {
          console.warn(`Element not found: ${selector}`);
        }
      });

      // Hide any room-specific UI elements
      const roomSpecificElements = [".back-to-home-btn", ".room-detail-page"];

      roomSpecificElements.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
          element.style.display = "none";
        });
      });

      // Ensure room sections exist in rooms-container
      const roomsContainer = document.querySelector(".rooms-container");
      if (roomsContainer) {
        console.log("Found rooms-container, checking room sections...");

        // Check if room sections exist
        const existingRoomSections =
          roomsContainer.querySelectorAll(".room-section");
        console.log(
          `Found ${existingRoomSections.length} existing room sections`
        );

        // If no room sections exist, trigger room manager to recreate them
        if (existingRoomSections.length === 0) {
          console.log("No room sections found, triggering recreation...");

          // Use room manager to ensure room sections
          if (window.roomManager && window.roomManager._ensureRoomSections) {
            window.roomManager._ensureRoomSections(roomsContainer);
          } else {
            console.warn(
              "Room manager not available, creating basic room sections"
            );
            this._createBasicRoomSections(roomsContainer);
          }
        }

        // Trigger room status updates
        this._triggerRoomStatusRefresh();
      } else {
        console.error("rooms-container element not found!");
      }

      // Re-initialize main dashboard components if needed
      this.initializeClock();
      this.initializeFullscreen();

      // Dispatch event to notify other components that main dashboard is rendered
      document.dispatchEvent(
        new CustomEvent("mainDashboardRendered", {
          detail: { timestamp: new Date().toISOString() },
        })
      );

      console.log("Main dashboard rendered successfully");
      return true;
    } catch (error) {
      console.error("Error rendering main dashboard:", error);
      return false;
    }
  }

  /**
   * Create basic room sections as fallback
   */
  _createBasicRoomSections(roomsContainer) {
    console.log("Creating basic room sections");

    const rooms = ["PHÒNG HỌP LẦU 3", "PHÒNG HỌP LẦU 4"];

    rooms.forEach((roomName) => {
      const roomSection = document.createElement("div");
      roomSection.className = "room-section";
      roomSection.innerHTML = `
        <div class="room-number">${roomName}</div>
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

      roomsContainer.appendChild(roomSection);
      console.log(`Created room section for: ${roomName}`);
    });
  }

  /**
   * Trigger room status refresh
   */
  _triggerRoomStatusRefresh() {
    console.log("Triggering room status refresh");

    // Use the global meeting data if available
    const meetingData = window.currentMeetingData || [];

    // Dispatch room status update event
    document.dispatchEvent(
      new CustomEvent("refreshRoomStatus", {
        detail: { meetings: meetingData },
      })
    );

    // Also trigger via room manager if available
    if (window.roomManager && window.roomManager.updateRoomStatus) {
      window.roomManager.updateRoomStatus(meetingData);
    }
  }
}

export default UIManager;
