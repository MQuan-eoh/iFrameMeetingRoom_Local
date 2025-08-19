/**
 * Excel Export Manager
 * Manages exporting meeting data to Excel files with various time period options
 */

import { DateTimeUtils } from "../utils/core.js";

export class ExcelExportManager {
  constructor() {
    this.exportModal = null;
    this.isInitialized = false;
    this.selectedPeriod = "week"; // default to week view
    this.selectedDate = new Date();

    this._initialize();
  }

  /**
   * Initialize the Excel Export Manager
   */
  _initialize() {
    this._createExportButton();
    this._createExportModal();
    this._attachEventListeners();
    this.isInitialized = true;

    console.log("Excel Export Manager initialized successfully");
  }

  /**
   * Create Export Excel button
   */
  _createExportButton() {
    const scheduleActions = document.querySelector(".schedule-actions");
    if (!scheduleActions) {
      console.error("Schedule actions container not found");
      return;
    }

    // Create export button with same styling as create meeting button
    const exportButton = document.createElement("button");
    exportButton.className = "create-meeting-button export-excel-button";
    exportButton.id = "exportExcelBtn";
    exportButton.innerHTML = `
      Export Excel
      <i class="fas fa-file-excel"></i>
    `;

    // Insert after create meeting button
    const createButton = scheduleActions.querySelector(
      ".create-meeting-button"
    );
    if (createButton) {
      scheduleActions.insertBefore(exportButton, createButton.nextSibling);
    } else {
      scheduleActions.appendChild(exportButton);
    }

    this.exportButton = exportButton;
    console.log("Export Excel button created successfully");
  }

  /**
   * Create Export Modal with same design as booking modal
   */
  _createExportModal() {
    // ####################
    // FULLSCREEN CONTAINER DETECTION
    // Detect if we're in fullscreen mode and append to appropriate container
    // ####################
    let targetContainer = document.body;

    // Check for fullscreen element
    const fullscreenElement =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;

    if (fullscreenElement) {
      targetContainer = fullscreenElement;
      console.log(
        "Fullscreen detected, appending export modal to:",
        targetContainer
      );
    } else {
      // Check for custom fullscreen containers
      const fullscreenContainer =
        document.querySelector(".fullscreen") ||
        document.querySelector(".fullscreen-mode") ||
        document.querySelector('[data-fullscreen="true"]');
      if (fullscreenContainer) {
        targetContainer = fullscreenContainer;
        console.log("Custom fullscreen container detected:", targetContainer);
      }
    }

    // Create modal overlay
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "booking-modal export-excel-modal";
    modalOverlay.id = "exportExcelModal";

    // Create modal content
    modalOverlay.innerHTML = `
      <div class="booking-modal-content">
        <div class="booking-modal-header">
          <h2 class="booking-modal-title">Xuất Dữ Liệu Excel</h2>
          <button class="modal-close" id="closeExportModal">&times;</button>
        </div>

        <div class="booking-modal-body">
          <div class="export-form">
            <!-- Export Period Selection -->
            <div class="form-group form-full-width">
              <label for="exportPeriod">Chọn thời gian xuất dữ liệu:</label>
              <select id="exportPeriod" class="form-control" required>
                <option value="day">Theo Ngày</option>
                <option value="week" selected>Theo Tuần</option>
                <option value="month">Theo Tháng</option>
              </select>
            </div>

            <!-- Date Selection -->
            <div class="form-group form-full-width">
              <label for="exportDate">Chọn ngày/tuần/tháng:</label>
              <input 
                type="date" 
                id="exportDate" 
                class="form-control" 
                required
              />
              <small class="form-text text-muted" id="dateHelperText">
                Chọn một ngày trong tuần để xuất dữ liệu cả tuần
              </small>
            </div>

            <!-- Export Info Display -->
            <div class="form-group form-full-width">
              <div class="export-info-panel">
                <h4>Thông tin xuất dữ liệu:</h4>
                <div class="export-preview">
                  <p><strong>Thời gian xuất:</strong> <span id="exportPeriodDisplay">-</span></p>
                  <p><strong>Số cuộc họp:</strong> <span id="exportMeetingCount">0 cuộc họp</span></p>
                  <p><strong>Tên file:</strong> <span id="exportFileName">meeting-export.xlsx</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="booking-modal-footer">
          <button class="btn btn-cancel" id="cancelExport">Hủy</button>
          <button class="btn btn-save" id="saveExport">Xuất Excel</button>
        </div>
      </div>
    `;

    // Add to appropriate container (fullscreen aware)
    targetContainer.appendChild(modalOverlay);
    this.exportModal = modalOverlay;

    // ####################
    // INLINE CSS FOR FULLSCREEN SUPPORT
    // Ensure modal works in fullscreen without separate CSS file
    // ####################
    modalOverlay.style.zIndex = "2147483647";

    console.log(
      "Export Excel modal created successfully and appended to:",
      targetContainer
    );
  }

  /**
   * Create Export Modal in specific container (helper method for fullscreen support)
   */
  _createExportModalInContainer(targetContainer) {
    // Create modal overlay
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "booking-modal export-excel-modal";
    modalOverlay.id = "exportExcelModal";

    // Create modal content (same as original)
    modalOverlay.innerHTML = `
      <div class="booking-modal-content">
        <div class="booking-modal-header">
          <h2 class="booking-modal-title">Xuất Dữ Liệu Excel</h2>
          <button class="modal-close" id="closeExportModal">&times;</button>
        </div>

        <div class="booking-modal-body">
          <div class="export-form">
            <!-- Export Period Selection -->
            <div class="form-group form-full-width">
              <label for="exportPeriod">Chọn thời gian xuất dữ liệu:</label>
              <select id="exportPeriod" class="form-control" required>
                <option value="day">Theo Ngày</option>
                <option value="week" selected>Theo Tuần</option>
                <option value="month">Theo Tháng</option>
              </select>
            </div>

            <!-- Date Selection -->
            <div class="form-group form-full-width">
              <label for="exportDate">Chọn ngày/tuần/tháng:</label>
              <input 
                type="date" 
                id="exportDate" 
                class="form-control" 
                required
              />
              <small class="form-text text-muted" id="dateHelperText">
                Chọn một ngày trong tuần để xuất dữ liệu cả tuần
              </small>
            </div>

            <!-- Export Info Display -->
            <div class="form-group form-full-width">
              <div class="export-info-panel">
                <h4>Thông tin xuất dữ liệu:</h4>
                <div class="export-preview">
                  <p><strong>Thời gian xuất:</strong> <span id="exportPeriodDisplay">-</span></p>
                  <p><strong>Số cuộc họp:</strong> <span id="exportMeetingCount">0 cuộc họp</span></p>
                  <p><strong>Tên file:</strong> <span id="exportFileName">meeting-export.xlsx</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="booking-modal-footer">
          <button class="btn btn-cancel" id="cancelExport">Hủy</button>
          <button class="btn btn-save" id="saveExport">Xuất Excel</button>
        </div>
      </div>
    `;

    // Add to target container
    targetContainer.appendChild(modalOverlay);
    this.exportModal = modalOverlay;

    // ####################
    // INLINE CSS FOR FULLSCREEN SUPPORT
    // Ensure modal works in fullscreen without separate CSS file
    // ####################
    modalOverlay.style.zIndex = "2147483647";

    console.log("Export Excel modal recreated in container:", targetContainer);
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners() {
    // Export button click
    if (this.exportButton) {
      this.exportButton.addEventListener("click", () =>
        this._openExportModal()
      );
    }

    // Modal close events
    document
      .getElementById("closeExportModal")
      ?.addEventListener("click", () => this._closeExportModal());
    document
      .getElementById("cancelExport")
      ?.addEventListener("click", () => this._closeExportModal());

    // Export action
    document
      .getElementById("saveExport")
      ?.addEventListener("click", () => this._performExport());

    // Period selection change
    document
      .getElementById("exportPeriod")
      ?.addEventListener("change", (e) => this._onPeriodChange(e.target.value));

    // Date selection change
    document
      .getElementById("exportDate")
      ?.addEventListener("change", (e) => this._onDateChange(e.target.value));

    console.log("Event listeners attached successfully");
  }

  /**
   * Open export modal
   */
  _openExportModal() {
    // ####################
    // FULLSCREEN AWARE MODAL OPENING
    // Check if modal needs to be recreated for fullscreen compatibility
    // ####################

    // Check if modal exists and is in the correct container
    const currentFullscreenElement =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;

    const fullscreenContainer =
      document.querySelector(".fullscreen") ||
      document.querySelector(".fullscreen-mode") ||
      document.querySelector('[data-fullscreen="true"]');

    let targetContainer =
      currentFullscreenElement || fullscreenContainer || document.body;

    // If modal doesn't exist or is in wrong container, recreate it
    if (!this.exportModal || !targetContainer.contains(this.exportModal)) {
      console.log(
        "Recreating export modal for current container:",
        targetContainer
      );

      // Remove existing modal if it exists
      if (this.exportModal && this.exportModal.parentNode) {
        this.exportModal.parentNode.removeChild(this.exportModal);
      }

      // Recreate modal in correct container
      this._createExportModalInContainer(targetContainer);
      this._attachEventListeners();
    }

    if (!this.exportModal) return;

    // Set default date to current date
    this._setDefaultDate();

    // Update preview information
    this._updateExportPreview();

    // Show modal
    this.exportModal.classList.add("active");
  }

  /**
   * Close export modal
   */
  _closeExportModal() {
    if (!this.exportModal) return;

    this.exportModal.classList.remove("active");

    // Reset form
    const form = this.exportModal.querySelector(".export-form");
    if (form) {
      const dateInput = document.getElementById("exportDate");
      const periodSelect = document.getElementById("exportPeriod");

      if (dateInput) dateInput.value = "";
      if (periodSelect) periodSelect.value = "week";
    }
  }

  /**
   * Set default date to current Vietnam date
   */
  _setDefaultDate() {
    const dateInput = document.getElementById("exportDate");
    if (!dateInput) return;

    // Get current Vietnam date
    const vietnamDate = DateTimeUtils.getCurrentDate(); // Returns "DD/MM/YYYY"
    const [day, month, year] = vietnamDate.split("/");

    // Convert to HTML input format (YYYY-MM-DD)
    const htmlDateFormat = `${year}-${month}-${day}`;
    dateInput.value = htmlDateFormat;

    this.selectedDate = new Date(year, month - 1, day);
  }

  /**
   * Handle period selection change
   */
  _onPeriodChange(period) {
    this.selectedPeriod = period;

    // Update helper text
    const helperText = document.getElementById("dateHelperText");
    if (helperText) {
      switch (period) {
        case "day":
          helperText.textContent = "Chọn ngày cụ thể để xuất dữ liệu";
          break;
        case "week":
          helperText.textContent =
            "Chọn một ngày trong tuần để xuất dữ liệu cả tuần";
          break;
        case "month":
          helperText.textContent =
            "Chọn một ngày trong tháng để xuất dữ liệu cả tháng";
          break;
      }
    }

    this._updateExportPreview();
  }

  /**
   * Handle date selection change
   */
  _onDateChange(dateStr) {
    if (!dateStr) return;

    this.selectedDate = new Date(dateStr);
    this._updateExportPreview();
  }

  /**
   * Update export preview information
   */
  _updateExportPreview() {
    const periodDisplay = document.getElementById("exportPeriodDisplay");
    const meetingCount = document.getElementById("exportMeetingCount");
    const fileName = document.getElementById("exportFileName");

    if (!periodDisplay || !meetingCount || !fileName) return;

    // Calculate date range based on selected period
    const dateRange = this._getDateRange(
      this.selectedPeriod,
      this.selectedDate
    );
    const meetings = this._getMeetingsInRange(dateRange.start, dateRange.end);

    // Update display
    periodDisplay.textContent = `${dateRange.displayText}`;
    meetingCount.textContent = `${meetings.length} cuộc họp`;
    fileName.textContent = this._generateFileName(
      this.selectedPeriod,
      this.selectedDate
    );
  }

  /**
   * Get date range based on period and selected date
   */
  _getDateRange(period, selectedDate) {
    const date = new Date(selectedDate);

    switch (period) {
      case "day":
        return {
          start: new Date(date),
          end: new Date(date),
          displayText: `${date.getDate().toString().padStart(2, "0")}/${(
            date.getMonth() + 1
          )
            .toString()
            .padStart(2, "0")}/${date.getFullYear()}`,
        };

      case "week":
        // Get Monday to Sunday of the week containing the selected date
        const startOfWeek = new Date(date);
        const dayOfWeek = date.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday (0) to 6, others subtract 1
        startOfWeek.setDate(date.getDate() - daysToMonday);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        return {
          start: startOfWeek,
          end: endOfWeek,
          displayText: `${startOfWeek.getDate().toString().padStart(2, "0")}/${(
            startOfWeek.getMonth() + 1
          )
            .toString()
            .padStart(2, "0")}/${startOfWeek.getFullYear()} - ${endOfWeek
            .getDate()
            .toString()
            .padStart(2, "0")}/${(endOfWeek.getMonth() + 1)
            .toString()
            .padStart(2, "0")}/${endOfWeek.getFullYear()}`,
        };

      case "month":
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

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

        return {
          start: startOfMonth,
          end: endOfMonth,
          displayText: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
        };

      default:
        return {
          start: new Date(date),
          end: new Date(date),
          displayText: "Invalid period",
        };
    }
  }

  /**
   * Get meetings within date range
   */
  _getMeetingsInRange(startDate, endDate) {
    const allMeetings = window.currentMeetingData || [];

    return allMeetings.filter((meeting) => {
      // Parse meeting date (DD/MM/YYYY format)
      const [day, month, year] = meeting.date.split("/");
      const meetingDate = new Date(year, month - 1, day);

      // Check if meeting date is within range (inclusive)
      return meetingDate >= startDate && meetingDate <= endDate;
    });
  }

  /**
   * Generate filename based on period and date
   */
  _generateFileName(period, selectedDate) {
    const date = new Date(selectedDate);
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

    switch (period) {
      case "day":
        return `meeting-export-day-${dateStr}.xlsx`;
      case "week":
        return `meeting-export-week-${dateStr}.xlsx`;
      case "month":
        return `meeting-export-month-${date.getFullYear()}-${(
          date.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}.xlsx`;
      default:
        return `meeting-export-${dateStr}.xlsx`;
    }
  }

  /**
   * Perform Excel export
   */
  async _performExport() {
    try {
      // Get date range and meetings
      const dateRange = this._getDateRange(
        this.selectedPeriod,
        this.selectedDate
      );
      const meetings = this._getMeetingsInRange(dateRange.start, dateRange.end);

      if (meetings.length === 0) {
        this._showNotification(
          "Không có cuộc họp nào trong khoảng thời gian đã chọn!",
          "warning"
        );
        return;
      }

      // Show loading state
      const exportBtn = document.getElementById("saveExport");
      const originalText = exportBtn.textContent;
      exportBtn.textContent = "Đang xuất...";
      exportBtn.disabled = true;

      // Create Excel workbook
      const workbook = this._createExcelWorkbook(meetings, dateRange);

      // Generate filename
      const fileName = this._generateFileName(
        this.selectedPeriod,
        this.selectedDate
      );

      // Download the file
      this._downloadExcel(workbook, fileName);

      // Show success message
      this._showNotification(
        `Đã xuất thành công ${meetings.length} cuộc họp ra file Excel!`,
        "success"
      );

      // Close modal
      this._closeExportModal();
    } catch (error) {
      console.error("Error during Excel export:", error);
      this._showNotification(
        "Có lỗi xảy ra khi xuất Excel. Vui lòng thử lại!",
        "error"
      );
    } finally {
      // Reset button state
      const exportBtn = document.getElementById("saveExport");
      if (exportBtn) {
        exportBtn.textContent = "Xuất Excel";
        exportBtn.disabled = false;
      }
    }
  }

  /**
   * Create Excel workbook with meeting data
   */
  _createExcelWorkbook(meetings, dateRange) {
    // Create a simple workbook structure that can be converted to Excel
    const workbook = {
      SheetNames: ["Meeting Data"],
      Sheets: {
        "Meeting Data": this._createWorksheet(meetings, dateRange),
      },
    };

    return workbook;
  }

  /**
   * Create worksheet with meeting data
   */
  _createWorksheet(meetings, dateRange) {
    // Define column headers with descriptions
    const headers = [
      "Date", // Ngày
      "Day of Week", // Thứ
      "Room", // Phòng
      "Start Time", // Giờ bắt đầu
      "End Time", // Giờ kết thúc
      "Duration", // Thời gian sử dụng
      "Purpose", // Mục đích
      "Department", // Phòng/Ban
      "Title", // Tiêu đề
      "Content", // Nội dung
      "Status", // Trạng thái
    ];

    // Create worksheet data array
    const worksheetData = [];

    // Add title row
    worksheetData.push([`MEETING SCHEDULE REPORT - ${dateRange.displayText}`]);
    worksheetData.push([]); // Empty row

    // Add headers
    worksheetData.push(headers);

    // Add meeting data
    meetings.forEach((meeting) => {
      const row = [
        meeting.date, // Date
        meeting.dayOfWeek, // Day of Week
        meeting.room, // Room
        meeting.startTime, // Start Time
        meeting.endTime, // End Time
        meeting.duration, // Duration
        meeting.purpose, // Purpose
        meeting.department || "", // Department
        meeting.title || "", // Title
        meeting.content || "", // Content
        this._getMeetingStatus(meeting), // Status
      ];
      worksheetData.push(row);
    });

    // Add summary information
    worksheetData.push([]); // Empty row
    worksheetData.push([`Total Meetings: ${meetings.length}`]);
    worksheetData.push([
      `Export Date: ${DateTimeUtils.getCurrentDate()} ${DateTimeUtils.getCurrentTime()}`,
    ]);

    // Convert to worksheet format
    return this._arrayToWorksheet(worksheetData);
  }

  /**
   * Get meeting status
   */
  _getMeetingStatus(meeting) {
    if (meeting.isEnded || meeting.forceEndedByUser) {
      return "Ended";
    }

    const currentTime = DateTimeUtils.getCurrentTime();
    const currentDate = DateTimeUtils.getCurrentDate();

    if (meeting.date === currentDate) {
      if (
        DateTimeUtils.isTimeInRangeWithSeconds(
          currentTime,
          meeting.startTime,
          meeting.endTime
        )
      ) {
        return "In Progress";
      } else if (currentTime < meeting.startTime) {
        return "Scheduled";
      } else {
        return "Completed";
      }
    } else {
      const [day, month, year] = meeting.date.split("/");
      const meetingDate = new Date(year, month - 1, day);
      const today = new Date();

      if (meetingDate < today) {
        return "Past";
      } else {
        return "Future";
      }
    }
  }

  /**
   * Convert array data to worksheet format
   */
  _arrayToWorksheet(data) {
    const worksheet = {};
    const range = { s: { c: 0, r: 0 }, e: { c: 0, r: 0 } };

    for (let row = 0; row < data.length; row++) {
      for (let col = 0; col < data[row].length; col++) {
        if (range.s.r > row) range.s.r = row;
        if (range.s.c > col) range.s.c = col;
        if (range.e.r < row) range.e.r = row;
        if (range.e.c < col) range.e.c = col;

        const cellAddress = this._encodeCellAddress(col, row);
        worksheet[cellAddress] = { v: data[row][col], t: "s" };
      }
    }

    worksheet["!ref"] = `${this._encodeCellAddress(
      range.s.c,
      range.s.r
    )}:${this._encodeCellAddress(range.e.c, range.e.r)}`;

    return worksheet;
  }

  /**
   * Encode cell address (e.g., A1, B2, etc.)
   */
  _encodeCellAddress(col, row) {
    let colName = "";
    while (col >= 0) {
      colName = String.fromCharCode(65 + (col % 26)) + colName;
      col = Math.floor(col / 26) - 1;
    }
    return colName + (row + 1);
  }

  /**
   * Download Excel file using simple CSV format as fallback
   */
  _downloadExcel(workbook, fileName) {
    try {
      // For now, we'll use CSV format as a simple Excel-compatible export
      // In a production environment, you would use a library like SheetJS (xlsx)
      const worksheet = workbook.Sheets["Meeting Data"];
      const csvContent = this._worksheetToCSV(worksheet);

      // ####################
      // FIX: Add BOM (Byte Order Mark) for proper UTF-8 encoding in Excel
      // This ensures Vietnamese characters display correctly
      // ####################
      const BOM = "\uFEFF";
      const csvWithBOM = BOM + csvContent;

      // Create blob with proper UTF-8 encoding
      const blob = new Blob([csvWithBOM], {
        type: "text/csv;charset=utf-8;",
      });

      const link = document.createElement("a");

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName.replace(".xlsx", ".csv"));
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Cleanup URL object to prevent memory leaks
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      throw error;
    }
  }

  /**
   * Convert worksheet to CSV format
   */
  _worksheetToCSV(worksheet) {
    if (!worksheet["!ref"]) return "";

    const range = this._decodeRange(worksheet["!ref"]);
    let csv = "";

    for (let row = range.s.r; row <= range.e.r; row++) {
      let rowData = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = this._encodeCellAddress(col, row);
        const cell = worksheet[cellAddress];
        let cellValue = cell ? cell.v : "";

        // Use improved CSV escaping method
        const escapedValue = this._escapeCSVField(cellValue);
        rowData.push(escapedValue);
      }
      csv += rowData.join(",") + "\n";
    }

    return csv;
  }

  /**
   * Decode range string (e.g., "A1:C10")
   */
  _decodeRange(rangeStr) {
    const [start, end] = rangeStr.split(":");
    return {
      s: this._decodeCellAddress(start),
      e: this._decodeCellAddress(end),
    };
  }

  /**
   * Decode cell address (e.g., "A1" -> {c: 0, r: 0})
   */
  _decodeCellAddress(cellAddr) {
    let col = 0;
    let row = 0;

    for (let i = 0; i < cellAddr.length; i++) {
      const char = cellAddr[i];
      if (char >= "A" && char <= "Z") {
        col = col * 26 + (char.charCodeAt(0) - 64);
      } else {
        row = parseInt(cellAddr.substring(i)) - 1;
        break;
      }
    }

    return { c: col - 1, r: row };
  }

  /**
   * Properly escape CSV field value
   * @param {any} value - The value to escape
   * @returns {string} - Escaped CSV field
   */
  _escapeCSVField(value) {
    // Convert to string and handle null/undefined
    let stringValue = String(value || "");

    // ####################
    // VIETNAMESE CHARACTER HANDLING
    // Ensure proper encoding for Vietnamese text
    // ####################

    // Check if field needs quoting (contains CSV special characters)
    const needsQuoting =
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n") ||
      stringValue.includes("\r") ||
      stringValue.includes("\t");

    if (needsQuoting) {
      // Escape internal quotes by doubling them
      stringValue = stringValue.replace(/"/g, '""');
      // Wrap in quotes
      return `"${stringValue}"`;
    }

    return stringValue;
  }

  /**
   * Show notification message
   */
  _showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `export-notification export-notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 25px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 10001;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
      opacity: 0;
      transform: translateY(-20px);
    `;

    // Set background color based on type
    switch (type) {
      case "success":
        notification.style.backgroundColor = "#4CAF50";
        break;
      case "warning":
        notification.style.backgroundColor = "#FF9800";
        break;
      case "error":
        notification.style.backgroundColor = "#F44336";
        break;
      default:
        notification.style.backgroundColor = "#2196F3";
    }

    notification.textContent = message;

    // Add to DOM
    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateY(0)";
    }, 50);

    // Remove after 4 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateY(-20px)";

      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }

  /**
   * Get export statistics
   */
  getExportStats() {
    const allMeetings = window.currentMeetingData || [];
    const today = DateTimeUtils.getCurrentDate();

    return {
      totalMeetings: allMeetings.length,
      todayMeetings: allMeetings.filter((m) => m.date === today).length,
      activeMeetings: allMeetings.filter(
        (m) => !m.isEnded && !m.forceEndedByUser
      ).length,
      endedMeetings: allMeetings.filter((m) => m.isEnded || m.forceEndedByUser)
        .length,
    };
  }

  /**
   * Cleanup method
   */
  cleanup() {
    // Remove event listeners and modal from DOM
    if (this.exportModal && this.exportModal.parentNode) {
      this.exportModal.parentNode.removeChild(this.exportModal);
    }

    if (this.exportButton && this.exportButton.parentNode) {
      this.exportButton.parentNode.removeChild(this.exportButton);
    }

    console.log("Excel Export Manager cleaned up");
  }
}

export default ExcelExportManager;
