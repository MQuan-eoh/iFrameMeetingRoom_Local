/**
 * Meeting Detail Tooltip Manager
 * Handles professional tooltip display for meeting events with smooth hover behavior
 * Prevents flickering and provides excellent UX
 */

class MeetingDetailTooltipManager {
  constructor() {
    this.currentTooltip = null;
    this.hoverTimer = null;
    this.hideTimer = null;
    this.isMouseOverTooltip = false;
    this.isMouseOverMeeting = false;
    this.currentMeetingElement = null;

    // Configuration
    this.showDelay = 200; // ms delay before showing tooltip
    this.hideDelay = 300; // ms delay before hiding tooltip
    this.tooltipOffset = 10; // pixels offset from meeting element

    this.init();
  }

  init() {
    // Create tooltip container if it doesn't exist
    this.createTooltipContainer();

    // Add global styles for preventing text selection during tooltip
    this.addGlobalStyles();

    // Initialize event listeners
    this.attachEventListeners();

    console.log("Meeting Detail Tooltip Manager initialized");
  }

  createTooltipContainer() {
    // Remove existing tooltip if any
    const existingTooltip = document.getElementById("meeting-detail-tooltip");
    if (existingTooltip) {
      existingTooltip.remove();
    }

    // Create new tooltip container
    const tooltip = document.createElement("div");
    tooltip.id = "meeting-detail-tooltip";
    tooltip.className = "meeting-detail-tooltip";
    document.body.appendChild(tooltip);

    this.currentTooltip = tooltip;
  }

  addGlobalStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .meeting-event {
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }
    `;
    document.head.appendChild(style);
  }

  attachEventListeners() {
    // Use event delegation for meeting events with mouseenter/mouseleave on meeting events specifically
    document.addEventListener(
      "mouseenter",
      this.handleMeetingMouseEnter.bind(this),
      true
    );

    document.addEventListener(
      "mouseleave",
      this.handleMeetingMouseLeave.bind(this),
      true
    );

    // Global click to hide tooltip
    document.addEventListener("click", this.handleGlobalClick.bind(this));

    // Handle window scroll and resize
    window.addEventListener("scroll", this.handleWindowScroll.bind(this));
    window.addEventListener("resize", this.handleWindowResize.bind(this));

    // Add better event delegation using MutationObserver to handle dynamically added meeting events
    this.observeMeetingEvents();
  }

  observeMeetingEvents() {
    // Watch for new meeting events being added to the DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              // Element node
              // Check if the added node is a meeting event or contains meeting events
              if (node.classList?.contains("meeting-event")) {
                this.attachMeetingEventListeners(node);
              } else if (node.querySelectorAll) {
                const meetingEvents = node.querySelectorAll(".meeting-event");
                meetingEvents.forEach((meetingEvent) => {
                  this.attachMeetingEventListeners(meetingEvent);
                });
              }
            }
          });
        }
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Attach to existing meeting events
    document.querySelectorAll(".meeting-event").forEach((meetingEvent) => {
      this.attachMeetingEventListeners(meetingEvent);
    });
  }

  attachMeetingEventListeners(meetingElement) {
    if (meetingElement.dataset.tooltipAttached) return; // Avoid duplicate listeners

    meetingElement.addEventListener("mouseenter", (e) => {
      this.isMouseOverMeeting = true;
      this.currentMeetingElement = meetingElement;
      this.clearTimers();

      this.hoverTimer = setTimeout(() => {
        if (
          this.isMouseOverMeeting &&
          this.currentMeetingElement === meetingElement
        ) {
          this.showTooltip(meetingElement, e);
        }
      }, this.showDelay);
    });

    meetingElement.addEventListener("mouseleave", (e) => {
      this.isMouseOverMeeting = false;

      if (this.hoverTimer) {
        clearTimeout(this.hoverTimer);
        this.hoverTimer = null;
      }

      this.hideTimer = setTimeout(() => {
        if (!this.isMouseOverMeeting && !this.isMouseOverTooltip) {
          this.hideTooltip();
        }
      }, this.hideDelay);
    });

    // Mark as attached to avoid duplicates
    meetingElement.dataset.tooltipAttached = "true";
  }

  handleMeetingMouseEnter(event) {
    // Safety check for event.target
    if (!event || !event.target || typeof event.target.closest !== "function") {
      return;
    }

    const meetingElement = event.target.closest(".meeting-event");
    if (!meetingElement) return;

    this.isMouseOverMeeting = true;
    this.currentMeetingElement = meetingElement;

    // Clear any existing timers
    this.clearTimers();

    // Set timer to show tooltip after delay
    this.hoverTimer = setTimeout(() => {
      if (
        this.isMouseOverMeeting &&
        this.currentMeetingElement === meetingElement
      ) {
        this.showTooltip(meetingElement, event);
      }
    }, this.showDelay);
  }

  handleMeetingMouseLeave(event) {
    // Safety check for event.target
    if (!event || !event.target || typeof event.target.closest !== "function") {
      return;
    }

    const meetingElement = event.target.closest(".meeting-event");
    if (!meetingElement) return;

    this.isMouseOverMeeting = false;

    // Clear show timer
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }

    // Set timer to hide tooltip after delay
    this.hideTimer = setTimeout(() => {
      if (!this.isMouseOverMeeting && !this.isMouseOverTooltip) {
        this.hideTooltip();
      }
    }, this.hideDelay);
  }

  showTooltip(meetingElement, event) {
    if (!this.currentTooltip || !meetingElement) return;

    // Get meeting data from element
    const meetingData = this.extractMeetingData(meetingElement);
    if (!meetingData) return;

    // Build tooltip content
    this.buildTooltipContent(meetingData);

    // Position tooltip beside the meeting element (like in the attached image)
    this.positionTooltipBeside(meetingElement);

    // Add tooltip hover listeners
    this.addTooltipHoverListeners();

    // Show tooltip with animation
    this.currentTooltip.classList.add("show");
  }

  hideTooltip() {
    if (!this.currentTooltip) return;

    this.currentTooltip.classList.remove("show");
    this.isMouseOverTooltip = false;
    this.currentMeetingElement = null;

    // Remove tooltip hover listeners
    this.removeTooltipHoverListeners();
  }

  extractMeetingData(meetingElement) {
    try {
      // Extract data from DOM elements
      const roomElement = meetingElement.querySelector(".event-room");
      const titleElement = meetingElement.querySelector(".event-title");
      const timeElement = meetingElement.querySelector(".event-time");

      // Get data from dataset or find in global meeting data
      const meetingId = meetingElement.dataset.id;
      let meetingData = null;

      // Try to find full meeting data from global data
      if (window.currentMeetingData && meetingId) {
        meetingData = window.currentMeetingData.find((m) => m.id === meetingId);
      }

      // If not found, extract from DOM
      if (!meetingData) {
        const timeText = timeElement?.textContent || "";
        const [startTime, endTime] = timeText.split(" - ");

        meetingData = {
          id: meetingId || Date.now().toString(),
          title: titleElement?.textContent || "Cuộc họp",
          room: roomElement?.textContent || "Không xác định",
          startTime: startTime || "",
          endTime: endTime || "",
          purpose: this.extractPurposeFromClass(meetingElement),
          content: titleElement?.textContent || "",
          department: "Không xác định",
          organizer: "Không xác định",
          status: "active",
        };
      }

      return meetingData;
    } catch (error) {
      console.error("Error extracting meeting data:", error);
      return null;
    }
  }

  extractPurposeFromClass(meetingElement) {
    const classList = meetingElement.classList;
    const purposeMap = {
      "purpose-hop": "Họp",
      "purpose-daotao": "Đào tạo",
      "purpose-phongvan": "Phỏng vấn",
      "purpose-thaoluan": "Thảo luận",
      "purpose-baocao": "Báo cáo",
      "purpose-khac": "Khác",
    };

    for (const [className, purpose] of Object.entries(purposeMap)) {
      if (classList.contains(className)) {
        return purpose;
      }
    }
    return "Không xác định";
  }

  buildTooltipContent(meetingData) {
    const purposeClass = this.getPurposeClass(meetingData.purpose);

    // Get meeting status based on time comparison (NOT room status)
    const meetingStatus = this.getMeetingStatus(meetingData);
    const statusDot = meetingStatus.isActive
      ? "status-dot"
      : "status-dot inactive";

    this.currentTooltip.innerHTML = `
      <div class="tooltip-header">
        <h3 class="tooltip-title">
          <i class="fas fa-calendar-check tooltip-title-icon"></i>
          ${meetingData.title}
        </h3>
        <div class="tooltip-meeting-status">
          <div class="${statusDot}"></div>
          ${meetingStatus.text}
        </div>
      </div>
      
      <div class="tooltip-body">
        <div class="tooltip-info-grid">
          <div class="tooltip-info-row">
            <i class="fas fa-clock info-icon"></i>
            <div class="info-content">
              <div class="info-label">Thời gian</div>
              <div class="info-value time">${meetingData.startTime} - ${
      meetingData.endTime
    }</div>
            </div>
          </div>

          <div class="tooltip-info-row">
            <i class="fas fa-door-open info-icon"></i>
            <div class="info-content">
              <div class="info-label">Phòng họp</div>
              <div class="info-value room">${meetingData.room}</div>
            </div>
          </div>
          
          <div class="tooltip-info-row">
            <i class="fas fa-bullseye info-icon"></i>
            <div class="info-content">
              <div class="info-label">Mục đích</div>
              <div class="info-value purpose ${purposeClass}">${
      meetingData.purpose
    }</div>
            </div>
          </div>
          
          ${
            meetingData.department
              ? `
          <div class="tooltip-info-row">
            <i class="fas fa-building info-icon"></i>
            <div class="info-content">
              <div class="info-label">Phòng ban</div>
              <div class="info-value">${meetingData.department}</div>
            </div>
          </div>
          `
              : ""
          }
          
          ${
            meetingData.organizer
              ? `
          <div class="tooltip-info-row">
            <i class="fas fa-user info-icon"></i>
            <div class="info-content">
              <div class="info-label">Người tổ chức</div>
              <div class="info-value">${meetingData.organizer}</div>
            </div>
          </div>
          `
              : ""
          }
          
          ${
            meetingData.content && meetingData.content !== meetingData.title
              ? `
          <div class="tooltip-info-row">
            <i class="fas fa-align-left info-icon"></i>
            <div class="info-content">
              <div class="info-label">Nội dung</div>
              <div class="info-value">${meetingData.content}</div>
            </div>
          </div>
          `
              : ""
          }
        </div>
      </div>
      
      <div class="tooltip-footer">
        <button class="tooltip-action-btn primary" onclick="window.meetingTooltip.editMeeting('${
          meetingData.id
        }')">
          <i class="fas fa-edit"></i>
          Chỉnh sửa
        </button>
      </div>
      
      <div class="tooltip-arrow top"></div>
    `;
  }

  getPurposeClass(purpose) {
    const purposeMap = {
      Họp: "hop",
      "Đào tạo": "daotao",
      "Phỏng vấn": "phongvan",
      "Thảo luận": "thaoluan",
      "Báo cáo": "baocao",
      Khác: "khac",
    };
    return purposeMap[purpose] || "khac";
  }

  /**
   * Get meeting status based on time comparison
   * Returns: Đã họp | Đang họp | Sắp họp
   */
  getMeetingStatus(meetingData) {
    try {
      // Get current date and time
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      // Get current date in DD/MM/YYYY format for comparison
      const currentDay = now.getDate();
      const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
      const currentYear = now.getFullYear();
      const currentDateString = `${currentDay
        .toString()
        .padStart(2, "0")}/${currentMonth
        .toString()
        .padStart(2, "0")}/${currentYear}`;

      // Parse meeting date and times
      const meetingDate = meetingData.date || "";
      const startTime = meetingData.startTime || "";
      const endTime = meetingData.endTime || "";

      if (!startTime || !endTime) {
        return {
          isActive: false,
          text: "Sắp họp",
        };
      }

      // Convert meeting times to minutes
      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);
      const startTimeInMinutes = startHour * 60 + startMin;
      const endTimeInMinutes = endHour * 60 + endMin;

      // Compare dates first
      if (meetingDate && meetingDate !== currentDateString) {
        // Parse meeting date to compare with current date
        const [meetingDay, meetingMonth, meetingYear] = meetingDate
          .split("/")
          .map(Number);
        const meetingDateObj = new Date(
          meetingYear,
          meetingMonth - 1,
          meetingDay
        );
        const currentDateObj = new Date(
          currentYear,
          currentMonth - 1,
          currentDay
        );

        if (meetingDateObj < currentDateObj) {
          // Meeting was on a previous date - always "Đã họp"
          return {
            isActive: false,
            text: "Đã họp",
          };
        } else if (meetingDateObj > currentDateObj) {
          // Meeting is on a future date - always "Sắp họp"
          return {
            isActive: false,
            text: "Sắp họp",
          };
        }
      }

      // If meeting is today (or no date specified), compare times
      if (currentTimeInMinutes >= endTimeInMinutes) {
        // Meeting has ended today
        return {
          isActive: false,
          text: "Đã họp",
        };
      } else if (
        currentTimeInMinutes >= startTimeInMinutes &&
        currentTimeInMinutes < endTimeInMinutes
      ) {
        // Meeting is currently happening today
        return {
          isActive: true,
          text: "Đang họp",
        };
      } else {
        // Meeting hasn't started yet today
        return {
          isActive: false,
          text: "Sắp họp",
        };
      }
    } catch (error) {
      console.error("Error getting meeting status:", error);
      return {
        isActive: false,
        text: "Sắp họp",
      };
    }
  }

  positionTooltipBeside(meetingElement) {
    if (!this.currentTooltip || !meetingElement) return;

    const meetingRect = meetingElement.getBoundingClientRect();
    const tooltipRect = this.currentTooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Get the schedule container bounds for better positioning
    const scheduleContainer = meetingElement.closest(".schedule-week-view");
    const containerRect = scheduleContainer
      ? scheduleContainer.getBoundingClientRect()
      : null;

    let left, top;
    let position = "right"; // Default to right side like in the image

    // Calculate position beside the meeting element (to the right)
    left = meetingRect.right + this.tooltipOffset + 8;
    top = meetingRect.top - 10; // Slightly above meeting element

    // Check if tooltip fits on the right side
    if (left + tooltipRect.width > viewportWidth - 20) {
      // Show on left side instead
      left = meetingRect.left - tooltipRect.width - this.tooltipOffset - 8;
      position = "left";

      // If still doesn't fit on left, center it
      if (left < 20) {
        left = Math.max(20, (viewportWidth - tooltipRect.width) / 2);
        top = meetingRect.bottom + this.tooltipOffset;
        position = "bottom";
      }
    }

    // Ensure tooltip stays within the schedule container if possible
    if (containerRect && position === "right") {
      // Check if tooltip extends beyond the container
      if (left + tooltipRect.width > containerRect.right) {
        left = containerRect.right - tooltipRect.width - 20;
      }
    }

    // Vertical positioning adjustments
    if (position === "right" || position === "left") {
      // Center tooltip vertically relative to meeting element
      top = meetingRect.top + meetingRect.height / 2 - tooltipRect.height / 2;

      // Ensure tooltip doesn't go above viewport
      if (top < 20) {
        top = 20;
      }

      // Ensure tooltip doesn't go below viewport
      if (top + tooltipRect.height > viewportHeight - 20) {
        top = viewportHeight - tooltipRect.height - 20;
      }
    }

    // Apply position with smooth transition
    this.currentTooltip.style.left = `${Math.round(left)}px`;
    this.currentTooltip.style.top = `${Math.round(top)}px`;

    // Store position for arrow adjustment
    this.currentTooltip.dataset.position = position;
  }

  addTooltipHoverListeners() {
    if (!this.currentTooltip) return;

    this.currentTooltip.addEventListener("mouseenter", () => {
      this.isMouseOverTooltip = true;
      // Clear hide timer when mouse enters tooltip
      if (this.hideTimer) {
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }
    });

    this.currentTooltip.addEventListener("mouseleave", () => {
      this.isMouseOverTooltip = false;
      // Set timer to hide tooltip when mouse leaves
      this.hideTimer = setTimeout(() => {
        if (!this.isMouseOverMeeting && !this.isMouseOverTooltip) {
          this.hideTooltip();
        }
      }, this.hideDelay);
    });
  }

  removeTooltipHoverListeners() {
    if (!this.currentTooltip) return;

    // Clone node to remove all event listeners
    const newTooltip = this.currentTooltip.cloneNode(true);
    this.currentTooltip.parentNode.replaceChild(
      newTooltip,
      this.currentTooltip
    );
    this.currentTooltip = newTooltip;
  }

  clearTimers() {
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  handleGlobalClick(event) {
    // Safety check for event.target
    if (!event || !event.target || typeof event.target.closest !== "function") {
      return;
    }

    // Hide tooltip when clicking outside
    if (
      !event.target.closest(".meeting-event") &&
      !event.target.closest(".meeting-detail-tooltip")
    ) {
      this.hideTooltip();
    }
  }

  handleWindowScroll() {
    // Reposition tooltip on scroll
    if (
      this.currentTooltip?.classList.contains("show") &&
      this.currentMeetingElement
    ) {
      this.positionTooltipBeside(this.currentMeetingElement);
    }
  }

  handleWindowResize() {
    // Hide tooltip on resize to prevent positioning issues
    this.hideTooltip();
  }

  // Public methods for tooltip actions
  viewDetails(meetingId) {
    console.log("View details for meeting:", meetingId);
    this.hideTooltip();
    // Implement view details logic here
  }

  editMeeting(meetingId) {
    console.log("Edit meeting:", meetingId);
    this.hideTooltip();

    // Find meeting data
    const meetingData = this.findMeetingData(meetingId);
    if (!meetingData) {
      console.error("Meeting data not found for ID:", meetingId);
      return;
    }

    // Open edit modal with pre-populated data
    this.openEditModal(meetingData);
  }

  /**
   * Find meeting data by ID from various sources
   */
  findMeetingData(meetingId) {
    // Try global meeting data first
    if (window.currentMeetingData && window.currentMeetingData.length > 0) {
      const meeting = window.currentMeetingData.find((m) => m.id === meetingId);
      if (meeting) return meeting;
    }

    // Try to find from meeting data manager
    if (window.meetingDataManager) {
      const allMeetings = window.meetingDataManager.getAllMeetings();
      const meeting = allMeetings.find((m) => m.id === meetingId);
      if (meeting) return meeting;
    }

    // Try to extract from DOM element
    const meetingElement = document.querySelector(`[data-id="${meetingId}"]`);
    if (meetingElement) {
      return this.extractMeetingData(meetingElement);
    }

    return null;
  }

  /**
   * Open edit modal with pre-populated meeting data
   */
  openEditModal(meetingData) {
    // Get or create edit modal
    let editModal = document.getElementById("editMeetingModal");

    if (!editModal) {
      this.createEditModal();
      editModal = document.getElementById("editMeetingModal");

      // Handle fullscreen mode for newly created modal
      if (window.uiManager && window.uiManager.handleNewModalInFullscreen) {
        window.uiManager.handleNewModalInFullscreen();
      }
    }

    // Reset modal state before opening
    this.resetEditModalState();

    // Pre-populate form fields
    this.populateEditForm(meetingData);

    // Show modal
    editModal.style.display = "flex"; // Use flex for centering
    editModal.classList.add("active"); // Use 'active' class for proper styling

    // Store current meeting ID for save operation
    editModal.dataset.editingMeetingId = meetingData.id;
  }

  /**
   * Create edit modal (reusing booking modal structure)
   */
  createEditModal() {
    const modalHTML = `
      <div id="editMeetingModal" class="booking-modal">
        <div class="booking-modal-content">
          <div class="booking-modal-header">
            <h2 class="booking-modal-title">Chỉnh Sửa Cuộc Họp</h2>
            <button class="modal-close" id="closeEditModal">&times;</button>
          </div>

          <div class="booking-modal-body">
            <form id="editMeetingForm" class="booking-form">
              <!-- Room Selection -->
              <div class="form-group">
                <label for="editBookingRoom">Phòng Họp:</label>
                <select id="editBookingRoom" class="form-control" required>
                  <option value="">-- Chọn phòng họp --</option>
                  <option value="Phòng họp lầu 3">Phòng họp lầu 3</option>
                  <option value="Phòng họp lầu 4">Phòng họp lầu 4</option>
                </select>
              </div>

              <!-- Date Picker -->
              <div class="form-group">
                <label for="editBookingDate">Ngày:</label>
                <input type="date" id="editBookingDate" class="form-control" required />
              </div>

              <!-- Time Selection -->
              <div class="form-group">
                <label for="editBookingStartTime">Thời gian bắt đầu:</label>
                <input type="text" id="editBookingStartTime" class="form-control" 
                       placeholder="HH:MM (VD: 09:30)" pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$" required />
                <div id="editStartTimeOptions" class="custom-time-dropdown"></div>
                <small class="form-text text-muted">Nhập thời gian (HH:MM) hoặc chọn từ gợi ý</small>
              </div>

              <div class="form-group">
                <label for="editBookingEndTime">Thời gian kết thúc:</label>
                <input type="text" id="editBookingEndTime" class="form-control" 
                       placeholder="HH:MM (VD: 10:30)" pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$" required />
                <div id="editEndTimeOptions" class="custom-time-dropdown"></div>
                <small class="form-text text-muted">Nhập thời gian (HH:MM) hoặc chọn từ gợi ý</small>
              </div>

              <!-- Purpose Selection -->
              <div class="form-group">
                <label for="editBookingPurpose">Mục đích:</label>
                <select id="editBookingPurpose" class="form-control" required>
                  <option value="">-- Chọn mục đích --</option>
                  <option value="Họp">Họp</option>
                  <option value="Đào tạo">Đào tạo</option>
                  <option value="Phỏng vấn">Phỏng vấn</option>
                  <option value="Thảo luận">Thảo luận</option>
                  <option value="Báo cáo">Báo cáo</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <!-- Department Selection -->
              <div class="form-group">
                <label for="editBookingDepartment">Phòng/Ban:</label>
                <select id="editBookingDepartment" class="form-control">
                  <option value="">-- Chọn phòng ban --</option>
                  <option value="Kỹ thuật">Phòng Kỹ thuật</option>
                  <option value="Kinh doanh">Phòng Kinh doanh</option>
                  <option value="Nhân sự">Phòng Nhân sự</option>
                  <option value="Kế toán">Phòng Kế toán</option>
                  <option value="Marketing">Phòng Marketing</option>
                  <option value="Ban Giám đốc">Ban Giám đốc</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <!-- Meeting Title -->
              <div class="form-group form-full-width">
                <label for="editBookingTitle">Tiêu đề cuộc họp:</label>
                <input type="text" id="editBookingTitle" class="form-control" 
                       placeholder="Nhập tiêu đề cuộc họp" required />
              </div>

              <!-- Meeting Description -->
              <div class="form-group form-full-width">
                <label for="editBookingDescription">Nội dung chi tiết:</label>
                <textarea id="editBookingDescription" class="form-control" rows="4" 
                          placeholder="Nhập nội dung chi tiết cuộc họp"></textarea>
              </div>
            </form>
          </div>

          <div class="booking-modal-footer">
            <button class="btn btn-cancel" id="cancelEditMeeting">Hủy</button>
            <button class="btn btn-save" id="saveEditMeeting">Cập Nhật</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Attach event listeners
    this.attachEditModalEventListeners();
  }

  /**
   * Attach event listeners to edit modal
   */
  attachEditModalEventListeners() {
    const editModal = document.getElementById("editMeetingModal");
    const closeBtn = document.getElementById("closeEditModal");
    const cancelBtn = document.getElementById("cancelEditMeeting");
    const saveBtn = document.getElementById("saveEditMeeting");

    // Close modal handlers
    [closeBtn, cancelBtn].forEach((btn) => {
      btn.addEventListener("click", () => {
        this.closeEditModal();
      });
    });

    // Save button handler
    saveBtn.addEventListener("click", () => {
      this.saveEditedMeeting();
    });

    // Initialize time dropdowns for edit modal
    this.initializeEditTimeDropdowns();
  }

  /**
   * Reset edit modal state
   */
  resetEditModalState() {
    // Reset save button state
    const saveBtn = document.getElementById("saveEditMeeting");
    if (saveBtn) {
      saveBtn.textContent = "Cập Nhật";
      saveBtn.disabled = false;
    }

    // Clear any existing error messages in the modal
    const existingErrors = document.querySelectorAll(
      "#editMeetingModal .error-message"
    );
    existingErrors.forEach((error) => error.remove());

    // Reset form validation states
    const formInputs = document.querySelectorAll(
      "#editMeetingModal .form-control"
    );
    formInputs.forEach((input) => {
      input.classList.remove("error", "success");
    });
  }

  /**
   * Close edit modal
   */
  closeEditModal() {
    const editModal = document.getElementById("editMeetingModal");
    if (editModal) {
      editModal.style.display = "none";
      editModal.classList.remove("show", "active");
      delete editModal.dataset.editingMeetingId;

      // Reset modal state when closing
      this.resetEditModalState();

      // Clear form data
      const form = document.getElementById("editMeetingForm");
      if (form) {
        form.reset();
      }
    }
  }

  /**
   * Populate edit form with meeting data
   */
  populateEditForm(meetingData) {
    // Parse date from meeting data
    let dateValue = "";
    if (meetingData.date) {
      // Convert DD/MM/YYYY to YYYY-MM-DD for input[type="date"]
      const dateParts = meetingData.date.split("/");
      if (dateParts.length === 3) {
        dateValue = `${dateParts[2]}-${dateParts[1].padStart(
          2,
          "0"
        )}-${dateParts[0].padStart(2, "0")}`;
      }
    } else {
      // Use today's date as fallback
      dateValue = new Date().toISOString().split("T")[0];
    }

    // Populate form fields
    document.getElementById("editBookingRoom").value = meetingData.room || "";
    document.getElementById("editBookingDate").value = dateValue;
    document.getElementById("editBookingStartTime").value =
      meetingData.startTime || "";
    document.getElementById("editBookingEndTime").value =
      meetingData.endTime || "";
    document.getElementById("editBookingPurpose").value =
      meetingData.purpose || "";
    document.getElementById("editBookingDepartment").value =
      meetingData.department || "";
    document.getElementById("editBookingTitle").value =
      meetingData.title || meetingData.content || "";
    document.getElementById("editBookingDescription").value =
      meetingData.description || meetingData.content || "";
  }

  /**
   * Initialize time dropdowns for edit modal
   */
  initializeEditTimeDropdowns() {
    // Create time options for edit modal
    const startTimeInput = document.getElementById("editBookingStartTime");
    const endTimeInput = document.getElementById("editBookingEndTime");
    const startTimeOptions = document.getElementById("editStartTimeOptions");
    const endTimeOptions = document.getElementById("editEndTimeOptions");

    // Generate time options
    const timeOptions = this.generateTimeOptions();

    startTimeOptions.innerHTML = timeOptions;
    endTimeOptions.innerHTML = timeOptions;

    // Add event listeners for time selection
    this.attachTimeDropdownListeners(startTimeInput, startTimeOptions);
    this.attachTimeDropdownListeners(endTimeInput, endTimeOptions);
  }

  /**
   * Generate time options HTML
   */
  generateTimeOptions() {
    const times = [];
    for (let hour = 7; hour <= 19; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        times.push(
          `<div class="time-option" data-time="${timeString}">${timeString}</div>`
        );
      }
    }
    return times.join("");
  }

  /**
   * Attach time dropdown listeners
   */
  attachTimeDropdownListeners(input, dropdown) {
    input.addEventListener("focus", () => {
      dropdown.classList.add("show");
    });

    input.addEventListener("blur", () => {
      setTimeout(() => {
        dropdown.classList.remove("show");
      }, 200);
    });

    dropdown.addEventListener("click", (e) => {
      if (e.target.classList.contains("time-option")) {
        input.value = e.target.dataset.time;
        dropdown.classList.remove("show");
      }
    });
  }

  /**
   * Save edited meeting
   */
  async saveEditedMeeting() {
    const editModal = document.getElementById("editMeetingModal");
    const meetingId = editModal.dataset.editingMeetingId;

    if (!meetingId) {
      console.error("No meeting ID found for editing");
      return;
    }

    // Collect form data
    const formData = this.collectEditFormData();
    if (!formData) return; // Validation failed

    // Add the meeting ID and timestamp
    formData.id = meetingId;
    formData.updatedAt = new Date().toISOString();

    // Get save button and store original state
    const saveBtn = document.getElementById("saveEditMeeting");
    const originalText = saveBtn.textContent;
    const originalDisabled = saveBtn.disabled;

    try {
      // Show loading state
      saveBtn.textContent = "Đang cập nhật...";
      saveBtn.disabled = true;

      // Update meeting via data manager
      await this.updateMeetingData(formData);

      // If we reach here, the update was successful
      console.log("####################");
      console.log("Meeting update successful");

      // Close modal
      this.closeEditModal();

      // Show success message
      this.showSuccessMessage("Cuộc họp đã được cập nhật thành công!");

      // Refresh UI (wrapped in try-catch to prevent UI refresh errors from affecting success)
      try {
        this.refreshMeetingDisplay();
      } catch (refreshError) {
        console.warn(
          "UI refresh failed but meeting was updated successfully:",
          refreshError
        );
        // Don't throw - the meeting update was successful
      }
    } catch (error) {
      console.error("Error updating meeting:", error);

      // Determine error message based on error type
      let errorMessage =
        "Có lỗi xảy ra khi cập nhật cuộc họp. Vui lòng thử lại.";

      if (error.message && error.message.includes("conflicts")) {
        errorMessage =
          "Thời gian họp bị trùng với cuộc họp khác. Vui lòng chọn thời gian khác.";
      } else if (error.message && error.message.includes("not found")) {
        errorMessage =
          "Không tìm thấy cuộc họp để chỉnh sửa. Vui lòng tải lại trang.";
      } else if (error.message && error.message.includes("network")) {
        errorMessage =
          "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.";
      }

      this.showErrorMessage(errorMessage);
    } finally {
      // Always reset button state properly
      if (saveBtn) {
        saveBtn.textContent = originalText;
        saveBtn.disabled = originalDisabled;
      }
    }
  }

  /**
   * Collect and validate edit form data
   */
  collectEditFormData() {
    const room = document.getElementById("editBookingRoom").value.trim();
    const date = document.getElementById("editBookingDate").value;
    const startTime = document
      .getElementById("editBookingStartTime")
      .value.trim();
    const endTime = document.getElementById("editBookingEndTime").value.trim();
    const purpose = document.getElementById("editBookingPurpose").value;
    const department = document.getElementById("editBookingDepartment").value;
    const title = document.getElementById("editBookingTitle").value.trim();
    const description = document
      .getElementById("editBookingDescription")
      .value.trim();

    // Validation
    if (!room || !date || !startTime || !endTime || !purpose || !title) {
      this.showErrorMessage("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return null;
    }

    // Time validation
    if (
      !this.isValidTimeFormat(startTime) ||
      !this.isValidTimeFormat(endTime)
    ) {
      this.showErrorMessage(
        "Định dạng thời gian không hợp lệ. Vui lòng sử dụng định dạng HH:MM."
      );
      return null;
    }

    // Time range validation
    if (this.timeToMinutes(endTime) <= this.timeToMinutes(startTime)) {
      this.showErrorMessage("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return null;
    }

    // Format date for display
    const [year, month, day] = date.split("-");
    const formattedDate = `${day}/${month}/${year}`;

    return {
      room,
      date: formattedDate,
      startTime,
      endTime,
      purpose,
      department,
      title,
      content: description || title,
      description,
    };
  }

  /**
   * Validate time format (HH:MM)
   */
  isValidTimeFormat(time) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  /**
   * Convert time to minutes for comparison
   */
  timeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Check if time is within working hours (07:00 - 19:00)
   */
  isWithinWorkingHours(time) {
    const minutes = this.timeToMinutes(time);
    return minutes >= 420 && minutes <= 1140; // 7:00 to 19:00
  }

  /**
   * Update meeting data via data manager and sync
   */
  async updateMeetingData(meetingData) {
    try {
      console.log("####################");
      console.log("Updating meeting data:", meetingData);

      // Update via meeting data manager if available
      if (window.meetingDataManager) {
        // Use the updateMeeting method that accepts a single meetingData object
        const result = await window.meetingDataManager.updateMeeting(
          meetingData
        );
        console.log("Meeting updated via data manager successfully:", result);
        return result;
      }

      // Fallback: direct API call if meetingDataManager is not available
      console.log("Fallback to direct API call");
      const domain =
        localStorage.getItem("domain") ||
        window.location.origin ||
        "http://localhost";

      const response = await fetch(
        `${domain}/api/meetings/${meetingData.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(meetingData),
        }
      );

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Meeting updated via direct API successfully:", result);
      return result;
    } catch (error) {
      console.error("Error updating meeting:", error);

      // Re-throw with more specific error information
      if (error.message.includes("HTTP error")) {
        throw new Error("network: " + error.message);
      } else if (error.message.includes("conflicts")) {
        throw new Error("conflicts: " + error.message);
      } else if (error.message.includes("not found")) {
        throw new Error("not found: " + error.message);
      } else {
        throw error;
      }
    }
  }

  /**
   * Safely call a method if it exists
   */
  _safeMethodCall(object, methodName, ...args) {
    try {
      if (object && typeof object[methodName] === "function") {
        return object[methodName](...args);
      } else {
        console.warn(`Method ${methodName} not available on object:`, object);
        return null;
      }
    } catch (error) {
      console.error(`Error calling ${methodName}:`, error);
      return null;
    }
  }

  /**
   * Refresh meeting display after update
   */
  refreshMeetingDisplay() {
    try {
      console.log("####################");
      console.log("Refreshing meeting display after update...");

      // Trigger UI refresh using safe method call
      if (window.scheduleBookingManager) {
        console.log("Refreshing schedule week view...");
        this._safeMethodCall(window.scheduleBookingManager, "_renderWeekView");
      } else {
        console.warn("scheduleBookingManager not available");
      }

      // Refresh room status with latest data using safe method call
      if (window.roomManager) {
        console.log("Refreshing room status...");
        // Get latest meeting data for room status update
        const latestData = window.meetingDataManager
          ? window.meetingDataManager.getCachedMeetingData()
          : window.currentMeetingData || [];
        this._safeMethodCall(
          window.roomManager,
          "updateRoomStatus",
          latestData
        );
      } else {
        console.warn("roomManager not available");
      }

      // Force refresh meeting data from server using safe method call
      if (window.meetingDataManager) {
        console.log("Force refreshing meeting data from server...");
        const refreshPromise = this._safeMethodCall(
          window.meetingDataManager,
          "forceRefresh"
        );
        if (refreshPromise && typeof refreshPromise.then === "function") {
          refreshPromise
            .then(() =>
              console.log("Meeting data refreshed from server successfully")
            )
            .catch((err) =>
              console.warn("Failed to refresh meeting data:", err)
            );
        }
      }

      // Trigger custom refresh events
      document.dispatchEvent(
        new CustomEvent("meetingDataUpdated", {
          detail: {
            source: "tooltip-edit",
            timestamp: new Date().toISOString(),
          },
        })
      );

      document.dispatchEvent(
        new CustomEvent("roomStatusUpdate", {
          detail: {
            source: "tooltip-edit",
            timestamp: new Date().toISOString(),
          },
        })
      );

      console.log("Meeting display refresh completed successfully");
    } catch (error) {
      console.error("Error refreshing meeting display:", error);
      // Don't re-throw the error to prevent it from affecting the save success
      // Just log it and continue
    }
  }

  /**
   * Show success message
   */
  showSuccessMessage(message) {
    // Create and show success notification
    const notification = document.createElement("div");
    notification.className = "toast-notification success";
    notification.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span>${message}</span>
    `;

    document.body.appendChild(notification);

    // Show with animation
    setTimeout(() => {
      notification.style.opacity = "1";
    }, 10);

    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  /**
   * Show error message
   */
  showErrorMessage(message) {
    // Create and show error notification
    const notification = document.createElement("div");
    notification.className = "toast-notification error";
    notification.innerHTML = `
      <i class="fas fa-exclamation-circle"></i>
      <span>${message}</span>
    `;

    document.body.appendChild(notification);

    // Show with animation
    setTimeout(() => {
      notification.style.opacity = "1";
    }, 10);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  // Cleanup method
  destroy() {
    this.clearTimers();

    if (this.currentTooltip) {
      this.currentTooltip.remove();
    }

    // Remove event listeners
    document.removeEventListener(
      "mouseenter",
      this.handleMeetingMouseEnter.bind(this),
      true
    );
    document.removeEventListener(
      "mouseleave",
      this.handleMeetingMouseLeave.bind(this),
      true
    );
    document.removeEventListener("click", this.handleGlobalClick.bind(this));
    window.removeEventListener("scroll", this.handleWindowScroll.bind(this));
    window.removeEventListener("resize", this.handleWindowResize.bind(this));
  }
}

// Export for ES6 modules
export default MeetingDetailTooltipManager;

// Also expose globally for direct access
window.MeetingDetailTooltipManager = MeetingDetailTooltipManager;
