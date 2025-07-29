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

    console.log("✅ Meeting Detail Tooltip Manager initialized");
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

      // Get actual room status from meeting-info status-text
      const actualStatus = this.getRoomStatus(meetingData.room);
      if (actualStatus) {
        meetingData.actualRoomStatus = actualStatus;
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

    // Use actual room status if available, otherwise fallback to default logic
    let statusText = "Sắp diễn ra"; // default
    let statusClass = "status-dot inactive"; // default

    if (meetingData.actualRoomStatus) {
      // Use the actual status from the room's meeting-info
      statusText = meetingData.actualRoomStatus;

      // Determine status class based on actual status text
      switch (meetingData.actualRoomStatus.toLowerCase()) {
        case "đang họp":
          statusClass = "status-dot";
          break;
        case "sắp họp":
          statusClass = "status-dot inactive";
          break;
        case "trống":
          statusClass = "status-dot inactive";
          statusText = "Đã họp";
          break;
        default:
          statusClass = "status-dot inactive";
      }
    } else {
      // Fallback to old logic if room status is not available
      statusClass =
        meetingData.status === "active" ? "status-dot" : "status-dot inactive";
      statusText =
        meetingData.status === "active" ? "Đang diễn ra" : "Sắp diễn ra";
    }

    this.currentTooltip.innerHTML = `
      <div class="tooltip-header">
        <h3 class="tooltip-title">
          <i class="fas fa-calendar-check tooltip-title-icon"></i>
          ${meetingData.title}
        </h3>
        <div class="tooltip-meeting-status">
          <div class="${statusClass}"></div>
          ${statusText}
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
        <button class="tooltip-action-btn secondary" onclick="window.meetingTooltip.viewDetails('${
          meetingData.id
        }')">
          <i class="fas fa-eye"></i>
          Xem chi tiết
        </button>
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

  getRoomStatus(roomName) {
    try {
      if (!roomName) return null;

      // Normalize room name for searching
      const normalizedRoomName = roomName.toLowerCase().trim();

      // Find all room sections
      const roomSections = document.querySelectorAll(".room-section");

      for (const roomSection of roomSections) {
        const roomNumberElement = roomSection.querySelector(".room-number");
        if (!roomNumberElement) continue;

        const sectionRoomName = roomNumberElement.textContent
          .toLowerCase()
          .trim();

        // Check if this room section matches the meeting's room
        if (
          sectionRoomName.includes(normalizedRoomName) ||
          normalizedRoomName.includes(sectionRoomName) ||
          this.isRoomNameMatch(normalizedRoomName, sectionRoomName)
        ) {
          // Find the status-text element in this room's meeting-info
          const statusTextElement = roomSection.querySelector(
            ".meeting-info .status-text"
          );
          if (statusTextElement) {
            const statusText = statusTextElement.textContent.trim();
            console.log(`🔍 Found room status for ${roomName}: ${statusText}`);
            return statusText;
          }
        }
      }

      console.warn(`⚠️ Could not find room status for: ${roomName}`);
      return null;
    } catch (error) {
      console.error("Error getting room status:", error);
      return null;
    }
  }

  isRoomNameMatch(roomName1, roomName2) {
    // Helper method to match room names more flexibly
    // Extract numbers and key words for matching
    const extractRoomInfo = (name) => {
      const match = name.match(/(\d+)/);
      const floor = match ? match[0] : "";
      return { floor, original: name };
    };

    const room1Info = extractRoomInfo(roomName1);
    const room2Info = extractRoomInfo(roomName2);

    // Match by floor number if both have numbers
    if (room1Info.floor && room2Info.floor) {
      return room1Info.floor === room2Info.floor;
    }

    // Fallback to partial string matching
    return (
      room1Info.original.includes(room2Info.original) ||
      room2Info.original.includes(room1Info.original)
    );
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
    // Implement edit meeting logic here
    // You can integrate with existing booking modal
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
