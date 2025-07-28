/**
 * UI Manager
 * Handles progress bars, notifications, modals, settings, and general UI interactions
 */

import { UI_CONFIG, STORAGE_KEYS } from "../config/constants.js";
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
    this._addUIStyles();
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

    // Auto remove
    if (duration > 0) {
      setTimeout(() => {
        this._removeNotification(notification);
      }, duration);
    }

    return notification;
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
      scheduleBgContainer: document.querySelector(".schedule-bg-container"),
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
          elements.scheduleBgContainer,
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
          elements.scheduleBgContainer,
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
    const scheduleBackgroundUploadBtn = document.querySelector(
      ".schedule-background-btn"
    );
    const mainBackgroundUploadInput = document.getElementById(
      "mainBackgroundUpload"
    );
    const scheduleBackgroundUploadInput = document.getElementById(
      "scheduleBackgroundUpload"
    );
    const resetBackgroundButton = document.querySelector(
      ".reset-background-button"
    );

    const meetingScreen = document.querySelector(".meeting-screen");
    const scheduleContent = document.querySelector(".schedule-content");

    if (!mainBackgroundUploadBtn || !scheduleBackgroundUploadBtn) return;

    // Upload handlers
    mainBackgroundUploadBtn.addEventListener("click", () => {
      mainBackgroundUploadInput?.click();
    });

    scheduleBackgroundUploadBtn.addEventListener("click", () => {
      scheduleBackgroundUploadInput?.click();
    });

    mainBackgroundUploadInput?.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        this._handleBackgroundUpload(file, "main", meetingScreen);
      }
    });

    scheduleBackgroundUploadInput?.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        this._handleBackgroundUpload(file, "schedule", scheduleContent);
      }
    });

    resetBackgroundButton?.addEventListener("click", () => {
      this._showResetBackgroundModal(meetingScreen, scheduleContent);
    });

    // Apply stored backgrounds
    this._applyStoredBackgrounds(meetingScreen, scheduleContent);
  }

  /**
   * Clock and Date Display
   */
  initializeClock() {
    const updateClock = () => {
      const timeElements = document.querySelectorAll('[id^="currentTime"]');
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
      const dateElements = document.querySelectorAll('[id^="currentDate"]');
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

      const formattedDate = `${dayOfWeek}, ${day} ${month} ${year}`;

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
    });
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

    applyBtn.addEventListener("click", () => {
      if (type === "main") {
        localStorage.setItem(STORAGE_KEYS.MAIN_BACKGROUND, imageDataUrl);
        targetElement.style.backgroundImage = `url(${imageDataUrl})`;
      } else if (type === "schedule") {
        localStorage.setItem(STORAGE_KEYS.SCHEDULE_BACKGROUND, imageDataUrl);
        targetElement.style.backgroundImage = `url(${imageDataUrl})`;
      }

      targetElement.style.backgroundSize = "cover";
      targetElement.style.backgroundPosition = "center";

      this._removeModal(modal);
    });

    cancelBtn.addEventListener("click", () => {
      this._removeModal(modal);
    });
  }

  _showResetBackgroundModal(meetingScreen, scheduleContent) {
    const modal = DOMUtils.createElement(
      "div",
      "reset-background-modal show",
      `
      <div class="modal-content">
        <h3>Reset hình nền</h3>
        <p>Chọn hình nền muốn reset:</p>
        <div class="modal-buttons">
          <button class="modal-button reset-main-btn">Reset hình nền chính</button>
          <button class="modal-button reset-schedule-btn">Reset hình nền lịch</button>
          <button class="modal-button cancel-btn">Hủy</button>
        </div>
      </div>
    `
    );

    document.body.appendChild(modal);

    const resetMainBtn = modal.querySelector(".reset-main-btn");
    const resetScheduleBtn = modal.querySelector(".reset-schedule-btn");
    const cancelBtn = modal.querySelector(".cancel-btn");

    resetMainBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEYS.MAIN_BACKGROUND);
      meetingScreen.style.backgroundImage = "url(assets/imgs/background.jpg)";
      this._removeModal(modal);
    });

    resetScheduleBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEYS.SCHEDULE_BACKGROUND);
      scheduleContent.style.backgroundImage =
        "url(assets/imgs/default-schedule-background.jpg)";
      this._removeModal(modal);
    });

    cancelBtn.addEventListener("click", () => {
      this._removeModal(modal);
    });
  }

  _applyStoredBackgrounds(meetingScreen, scheduleContent) {
    const savedMainBackground = localStorage.getItem(
      STORAGE_KEYS.MAIN_BACKGROUND
    );
    const savedScheduleBackground = localStorage.getItem(
      STORAGE_KEYS.SCHEDULE_BACKGROUND
    );

    if (savedMainBackground && meetingScreen) {
      meetingScreen.style.backgroundImage = `url(${savedMainBackground})`;
      meetingScreen.style.backgroundSize = "cover";
      meetingScreen.style.backgroundPosition = "center";
    }

    if (savedScheduleBackground && scheduleContent) {
      scheduleContent.style.backgroundImage = `url(${savedScheduleBackground})`;
      scheduleContent.style.backgroundSize = "cover";
      scheduleContent.style.backgroundPosition = "center";
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

  _addUIStyles() {
    const styles = `
      /* Progress Bar Styles */
      #progressContainer {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      /* Notification Styles */
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        min-width: 300px;
        max-width: 500px;
      }

      .notification.show {
        opacity: 1;
        transform: translateX(0);
      }

      .notification.hiding {
        opacity: 0;
        transform: translateX(100%);
      }

      .notification-info {
        border-left: 4px solid #007bff;
      }

      .notification-success {
        border-left: 4px solid #28a745;
      }

      .notification-warning {
        border-left: 4px solid #ffc107;
      }

      .notification-error {
        border-left: 4px solid #dc3545;
      }

      .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
      }

      .notification-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #666;
        margin-left: 10px;
      }

      /* No Meetings Notification */
      .no-meetings-notification {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.8);
        transition: all 0.3s ease;
        text-align: center;
        min-width: 400px;
      }

      .no-meetings-notification.show {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }

      .no-meetings-notification.hiding {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.8);
      }

      .no-meetings-notification .notification-icon {
        font-size: 48px;
        margin-bottom: 15px;
      }

      .no-meetings-notification h3 {
        margin: 0 0 10px 0;
        font-size: 1.5em;
      }

      .no-meetings-notification p {
        margin: 0;
        opacity: 0.9;
      }

      /* Error Modal Styles */
      .error-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .error-modal-overlay.show {
        opacity: 1;
      }

      .error-modal {
        background: white;
        border-radius: 10px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
        transform: scale(0.8);
        transition: transform 0.3s ease;
      }

      .error-modal-overlay.show .error-modal {
        transform: scale(1);
      }

      .error-modal-header {
        background: #dc3545;
        color: white;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .error-modal-body {
        padding: 20px;
        max-height: 400px;
        overflow-y: auto;
      }

      .error-modal-body pre {
        white-space: pre-wrap;
        word-wrap: break-word;
        font-family: monospace;
        font-size: 14px;
      }

      .error-modal-footer {
        padding: 15px 20px;
        text-align: right;
        border-top: 1px solid #eee;
      }

      .error-modal-close,
      .error-modal-ok {
        background: #dc3545;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      }

      /* Background Preview Modal */
      .background-preview-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .background-preview-modal.show {
        opacity: 1;
      }

      .background-preview-modal .modal-content {
        background: white;
        border-radius: 10px;
        padding: 20px;
        text-align: center;
        max-width: 500px;
        width: 90%;
      }

      /* End Meeting Success */
      .end-meeting-success {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
      }

      .success-icon {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }

      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes fadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }
    `;

    DOMUtils.addCSS(styles);
  }
}

export default UIManager;
