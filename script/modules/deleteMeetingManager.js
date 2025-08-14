/**
 * Delete Meeting Manager
 * Handles meeting deletion functionality with authentication and confirmation
 */

import DeleteAuthenticationManager from "./deleteAuthenticationManager.js";

class DeleteMeetingManager {
  constructor(authManager, dataService, scheduleManager) {
    this.authManager = authManager; // Keep for potential future use
    this.dataService = dataService;
    this.scheduleManager = scheduleManager;

    // Create dedicated delete authentication manager
    this.deleteAuthManager = new DeleteAuthenticationManager();

    // State management
    this.isDeleteMode = false;
    this.selectedMeetings = new Set();
    this.deleteModeControls = null;
    this.confirmModal = null;

    // UI references
    this.deleteButton = null;
    this.scheduleContainer = null;

    console.log("#################### Delete Meeting Manager initialized");
    this.init();
  }

  /**
   * Initialize delete meeting functionality
   */
  init() {
    this.createDeleteButton();
    this.createDeleteModeControls();
    this.createConfirmModal();
    this.attachEventListeners();
  }

  /**
   * Create delete meeting button
   */
  createDeleteButton() {
    const scheduleActions = document.querySelector(".schedule-actions");
    if (!scheduleActions) {
      console.error("Schedule actions container not found");
      return;
    }

    // Create delete button
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-meeting-button";
    deleteButton.id = "deleteMeetingBtn";
    deleteButton.innerHTML = `Delete Meeting`;

    // Insert after create meeting button
    const createButton = scheduleActions.querySelector(
      ".create-meeting-button"
    );
    if (createButton) {
      scheduleActions.insertBefore(deleteButton, createButton.nextSibling);
    } else {
      scheduleActions.appendChild(deleteButton);
    }

    this.deleteButton = deleteButton;
    console.log("#################### Delete meeting button created");
  }

  /**
   * Create delete mode controls
   */
  createDeleteModeControls() {
    const controlsHtml = `
      <div id="deleteModeControls" class="delete-mode-controls">
        <div class="delete-mode-info">
          Chế độ xóa cuộc họp
        </div>
        <div class="delete-mode-counter">
          <span id="selectedCount">0</span> đã chọn
        </div>
        <div class="delete-action-buttons">
          <button class="delete-save-btn" id="deleteSaveBtn" disabled>
            Xóa
          </button>
          <button class="delete-cancel-btn" id="deleteCancelBtn">
            Hủy
          </button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", controlsHtml);
    this.deleteModeControls = document.getElementById("deleteModeControls");
  }

  /**
   * Create confirmation modal
   */
  createConfirmModal() {
    const modalHtml = `
      <div id="deleteConfirmModal" class="delete-confirm-modal-overlay">
        <div class="delete-confirm-modal">
          <div class="delete-confirm-header">
            <h3 class="delete-confirm-title">
              Xác nhận xóa cuộc họp
            </h3>
          </div>
          
          <div class="delete-confirm-body">
            <div class="delete-confirm-info-grid">
              <div class="delete-confirm-warning">
                <div class="delete-info-content">
                  <div class="delete-info-label">Cảnh báo quan trọng</div>
                  <div class="delete-info-value">Hành động này không thể hoàn tác. Tất cả dữ liệu cuộc họp sẽ bị xóa vĩnh viễn.</div>
                </div>
              </div>
              
              <div class="delete-confirm-count">
                <div class="delete-info-content">
                  <div class="delete-info-label">Số cuộc họp sẽ xóa</div>
                  <div class="delete-info-value" id="deleteCountText">0 cuộc họp</div>
                </div>
              </div>
              
              <div class="delete-confirm-list">
                <div class="delete-info-content">
                  <div class="delete-info-label">Danh sách cuộc họp sẽ xóa</div>
                  <div class="delete-meetings-list" id="deleteMeetingsList">
                    <!-- Meeting list will be populated here -->
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="delete-confirm-footer">
            <button class="delete-decline-btn" id="deleteDeclineBtn">
              Không
            </button>
            <button class="delete-confirm-btn" id="deleteConfirmBtn">
              Chắc chắn
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    this.confirmModal = document.getElementById("deleteConfirmModal");
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Delete button click
    if (this.deleteButton) {
      this.deleteButton.addEventListener("click", () => {
        this.handleDeleteButtonClick();
      });
    }

    // Delete mode controls
    if (this.deleteModeControls) {
      const saveBtn = this.deleteModeControls.querySelector("#deleteSaveBtn");
      const cancelBtn =
        this.deleteModeControls.querySelector("#deleteCancelBtn");

      saveBtn?.addEventListener("click", () => {
        this.handleDeleteSave();
      });

      cancelBtn?.addEventListener("click", () => {
        this.exitDeleteMode();
      });
    }

    // Confirmation modal
    if (this.confirmModal) {
      const confirmBtn = this.confirmModal.querySelector("#deleteConfirmBtn");
      const declineBtn = this.confirmModal.querySelector("#deleteDeclineBtn");

      confirmBtn?.addEventListener("click", () => {
        this.executeDelete();
      });

      declineBtn?.addEventListener("click", () => {
        this.hideConfirmModal();
      });
    }

    // Listen for meeting clicks when in delete mode
    document.addEventListener(
      "click",
      (e) => {
        if (this.isDeleteMode && e.target.closest(".meeting-event")) {
          e.preventDefault();
          e.stopPropagation();
          this.handleMeetingClick(e.target.closest(".meeting-event"));
        }
      },
      true
    ); // Use capture phase to handle before other listeners

    // Listen for ESC key to exit delete mode
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isDeleteMode) {
        this.exitDeleteMode();
      }
    });
  }

  /**
   * Handle delete button click
   */
  async handleDeleteButtonClick() {
    try {
      // Request delete authentication - always ask for password
      const isAuthenticated =
        await this.deleteAuthManager.requestDeleteAuthentication();

      if (!isAuthenticated) {
        console.log("Cancel Model delete operation");
        return;
      }

      // Enter delete mode
      this.enterDeleteMode();
    } catch (error) {
      console.error("Error in delete button click:", error);
      this.showNotification("Có lỗi xảy ra khi kích hoạt chế độ xóa", "error");
    }
  }

  /**
   * Enter delete mode
   */
  enterDeleteMode() {
    console.log("#################### Entering delete mode");
    this.isDeleteMode = true;
    this.selectedMeetings.clear();

    // Update UI
    document.body.classList.add("delete-mode-active");
    this.deleteModeControls?.classList.add("show");
    this.deleteButton.disabled = true;

    // Add delete-selectable class to all meetings
    const meetings = document.querySelectorAll(".meeting-event");
    console.log(`Found ${meetings.length} meeting elements to make selectable`);
    meetings.forEach((meeting) => {
      meeting.classList.add("delete-selectable");
      console.log(`Added delete-selectable to meeting: ${meeting.dataset.id}`);
    });

    this.updateSelectedCounter();
    this.showNotification(
      "Chế độ xóa cuộc họp đã được kích hoạt. Click vào các cuộc họp cần xóa.",
      "info"
    );

    console.log("#################### Entered delete mode successfully");
  }

  /**
   * Exit delete mode
   */
  exitDeleteMode() {
    this.isDeleteMode = false;
    this.selectedMeetings.clear();

    // Update UI
    document.body.classList.remove("delete-mode-active");
    this.deleteModeControls?.classList.remove("show");
    this.deleteButton.disabled = false;

    // Remove delete-related classes
    const meetings = document.querySelectorAll(".meeting-event");
    meetings.forEach((meeting) => {
      meeting.classList.remove("delete-selectable", "delete-selected");
    });

    this.updateSelectedCounter();
    console.log("#################### Exited delete mode");
  }

  /**
   * Handle meeting click in delete mode
   */
  handleMeetingClick(meetingElement) {
    console.log(
      "#################### Delete mode meeting click handler called"
    );

    if (!this.isDeleteMode) {
      console.log("Not in delete mode, ignoring click");
      return;
    }

    const meetingId = meetingElement.dataset.id;
    console.log(`Meeting ID from element: ${meetingId}`);

    if (!meetingId) {
      console.log("No meeting ID found on element");
      return;
    }

    if (this.selectedMeetings.has(meetingId)) {
      // Deselect meeting
      this.selectedMeetings.delete(meetingId);
      meetingElement.classList.remove("delete-selected");
      console.log(`Deselected meeting: ${meetingId}`);
    } else {
      // Select meeting
      this.selectedMeetings.add(meetingId);
      meetingElement.classList.add("delete-selected");
      console.log(`Selected meeting: ${meetingId}`);
    }

    console.log(`Total selected meetings: ${this.selectedMeetings.size}`);
    this.updateSelectedCounter();
  }

  /**
   * Update selected counter and save button state
   */
  updateSelectedCounter() {
    const counter = document.getElementById("selectedCount");
    const saveBtn = document.getElementById("deleteSaveBtn");

    if (counter) {
      counter.textContent = this.selectedMeetings.size;
    }

    if (saveBtn) {
      saveBtn.disabled = this.selectedMeetings.size === 0;
    }
  }

  /**
   * Handle delete save
   */
  async handleDeleteSave() {
    if (this.selectedMeetings.size === 0) {
      this.showNotification(
        "Vui lòng chọn ít nhất một cuộc họp để xóa",
        "error"
      );
      return;
    }

    try {
      // Get meeting details for confirmation
      const meetings = await this.getMeetingDetails([...this.selectedMeetings]);
      this.showConfirmModal(meetings);
    } catch (error) {
      console.error("Error preparing delete confirmation:", error);
      this.showNotification("Có lỗi xảy ra khi chuẩn bị xóa cuộc họp", "error");
    }
  }

  /**
   * Get meeting details for selected IDs
   */
  async getMeetingDetails(meetingIds) {
    try {
      const allMeetings = await this.dataService.getMeetings();
      return allMeetings.filter((meeting) =>
        meetingIds.includes(meeting.id.toString())
      );
    } catch (error) {
      console.error("Error getting meeting details:", error);
      return [];
    }
  }

  /**
   * Show confirmation modal
   */
  showConfirmModal(meetings) {
    if (!this.confirmModal) return;

    // Update count
    const countText = document.getElementById("deleteCountText");
    if (countText) {
      countText.textContent = `${meetings.length} cuộc họp`;
    }

    // Update meeting list
    const meetingsList = document.getElementById("deleteMeetingsList");
    if (meetingsList) {
      meetingsList.innerHTML = meetings
        .map(
          (meeting) => `
        <div class="delete-meeting-item">
          <div class="delete-meeting-item-title">${
            meeting.title || "Không có tiêu đề"
          }</div>
          <div class="delete-meeting-item-details">
            ${meeting.room} - ${meeting.date} từ ${meeting.startTime} đến ${
            meeting.endTime
          }
          </div>
        </div>
      `
        )
        .join("");
    }

    // Show modal
    this.confirmModal.style.display = "flex";
    setTimeout(() => {
      this.confirmModal.classList.add("show");
    }, 10);
  }

  /**
   * Hide confirmation modal
   */
  hideConfirmModal() {
    if (!this.confirmModal) return;

    this.confirmModal.classList.remove("show");
    setTimeout(() => {
      this.confirmModal.style.display = "none";
    }, 300);
  }

  /**
   * Execute delete operation
   */
  async executeDelete() {
    try {
      this.hideConfirmModal();

      // Show loading notification
      this.showNotification("Đang xóa các cuộc họp...", "info");

      const meetingIds = [...this.selectedMeetings];

      try {
        // Use batch delete if available and more than 1 meeting
        if (meetingIds.length > 1 && this.dataService.deleteMeetingsBatch) {
          const result = await this.dataService.deleteMeetingsBatch(meetingIds);

          // Handle batch delete result
          if (result.success) {
            this.showNotification(
              result.message || `Đã xóa thành công ${result.deleted} cuộc họp`,
              "success"
            );

            if (result.notFound > 0) {
              setTimeout(() => {
                this.showNotification(
                  `${result.notFound} cuộc họp không tìm thấy`,
                  "warning"
                );
              }, 2000);
            }
          } else {
            throw new Error(result.error || "Batch delete failed");
          }
        } else {
          // Use individual delete for single meeting or fallback
          let successCount = 0;
          let errorCount = 0;

          for (const meetingId of meetingIds) {
            try {
              await this.dataService.deleteMeeting(meetingId);
              successCount++;
            } catch (error) {
              console.error(`Failed to delete meeting ${meetingId}:`, error);
              errorCount++;
            }
          }

          // Show result notification
          if (errorCount === 0) {
            this.showNotification(
              `Đã xóa thành công ${successCount} cuộc họp`,
              "success"
            );
          } else {
            this.showNotification(
              `Đã xóa ${successCount} cuộc họp. ${errorCount} cuộc họp không thể xóa.`,
              "error"
            );
          }
        }
      } catch (error) {
        console.error("Error in delete operation:", error);
        this.showNotification(
          "Có lỗi xảy ra khi xóa cuộc họp: " + error.message,
          "error"
        );
      }

      // Exit delete mode
      this.exitDeleteMode();

      // Refresh the schedule
      if (
        this.scheduleManager &&
        typeof this.scheduleManager.loadMeetings === "function"
      ) {
        await this.scheduleManager.loadMeetings();
      }

      console.log(
        `#################### Delete operation completed for ${meetingIds.length} meetings`
      );
    } catch (error) {
      console.error("Error executing delete:", error);
      this.showNotification(
        "Có lỗi nghiêm trọng xảy ra khi xóa cuộc họp",
        "error"
      );
      this.exitDeleteMode();
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `delete-notification delete-notification-${type}`;

    const iconMap = {
      success: "",
      error: "",
      info: "",
      warning: "",
    };

    const titleMap = {
      success: "Thành công",
      error: "Lỗi",
      info: "Thông tin",
      warning: "Cảnh báo",
    };

    notification.innerHTML = `
      <div class="delete-notification-content">
        <div class="delete-notification-text">
          <div class="delete-notification-title">${titleMap[type]}</div>
          <div class="delete-notification-message">${message}</div>
        </div>
        <button class="delete-notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Show animation
    setTimeout(() => {
      notification.classList.add("show");
    }, 10);

    // Auto remove
    const duration = type === "error" ? 8000 : 5000;
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, duration);
  }

  /**
   * Refresh meetings after external changes
   */
  refreshMeetings() {
    if (this.isDeleteMode) {
      // Clear selections and re-add selectable class to new meetings
      this.selectedMeetings.clear();

      setTimeout(() => {
        const meetings = document.querySelectorAll(".meeting-event");
        meetings.forEach((meeting) => {
          meeting.classList.add("delete-selectable");
          meeting.classList.remove("delete-selected");
        });

        this.updateSelectedCounter();
      }, 100);
    }
  }

  /**
   * Check if in delete mode
   */
  isInDeleteMode() {
    return this.isDeleteMode;
  }

  /**
   * Get selected meetings count
   */
  getSelectedCount() {
    return this.selectedMeetings.size;
  }

  /**
   * Cleanup method
   */
  destroy() {
    this.exitDeleteMode();

    // Destroy delete authentication manager
    if (this.deleteAuthManager) {
      this.deleteAuthManager.destroy();
    }

    // Remove UI elements
    if (this.deleteButton) {
      this.deleteButton.remove();
    }

    if (this.deleteModeControls) {
      this.deleteModeControls.remove();
    }

    if (this.confirmModal) {
      this.confirmModal.remove();
    }

    console.log("#################### Delete Meeting Manager destroyed");
  }
}

export default DeleteMeetingManager;
