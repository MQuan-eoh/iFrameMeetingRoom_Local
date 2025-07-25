function getCurrentDate() {
  const now = new Date();
  now.setHours(now.getHours() + 7);

  const date = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  return `${date}/${month}/${year}`;
}
function formatTime(timeStr) {
  if (!timeStr) return "";

  console.log("Formatting time value:", timeStr, "Type:", typeof timeStr);

  // Handle Date objects from Excel
  if (timeStr instanceof Date) {
    const hours = timeStr.getHours();
    const minutes = timeStr.getMinutes();
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  }

  // Handle Excel time values (numbers between 0 and 1)
  if (typeof timeStr === "number" || !isNaN(timeStr)) {
    const floatTime = parseFloat(timeStr);
    if (floatTime >= 0 && floatTime <= 1) {
      const totalMinutes = Math.round(floatTime * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}`;
    }
  }

  // Handle string format
  if (typeof timeStr === "string") {
    const normalizedTime = timeStr
      .toLowerCase()
      .trim()
      .replace(/[^0-9h:\.]/g, "")
      .replace(/\s+/g, "");

    const timeFormats = {
      colon: /^(\d{1,2}):(\d{2})$/, // 13:30
      hourMinute: /^(\d{1,2})h(\d{2})$/, // 13h30
      decimal: /^(\d{1,2})\.(\d{2})$/, // 13.30
      simple: /^(\d{1,2})(\d{2})$/, // 1330
    };

    for (const [format, regex] of Object.entries(timeFormats)) {
      const match = normalizedTime.match(regex);
      if (match) {
        const [_, hours, minutes] = match;
        const hrs = parseInt(hours, 10);
        const mins = parseInt(minutes, 10);

        if (hrs >= 0 && hrs < 24 && mins >= 0 && mins < 60) {
          return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
            2,
            "0"
          )}`;
        }
      }
    }
  }

  return "";
}

function isTimeInRange(currentTime, startTime, endTime) {
  const current = timeToMinutes(currentTime);

  const start = timeToMinutes(`${startTime}:00`);
  const end = timeToMinutes(`${endTime}:00`);
  return current >= start && current <= end;
}

function formatDayOfWeek(day) {
  if (!day) return "";

  const dayMap = {
    2: "Thứ Hai",
    3: "Thứ Ba",
    4: "Thứ Tư",
    5: "Thứ Năm",
    6: "Thứ Sáu",
    7: "Thứ Bảy",
    CN: "Chủ Nhật",
    "THỨ 2": "Thứ Hai",
    "THỨ 3": "Thứ Ba",
    "THỨ 4": "Thứ Tư",
    "THỨ 5": "Thứ Năm",
    "THỨ 6": "Thứ Sáu",
    "THỨ 7": "Thứ Bảy",
    "CHỦ NHẬT": "Chủ Nhật",
  };

  const normalizedDay = String(day).trim().toUpperCase();
  return dayMap[normalizedDay] || day;
}

function formatRoomName(room) {
  if (!room) return "";

  const normalized = String(room)
    .toLowerCase()
    .replace(
      /[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]/g,
      ""
    )
    .replace(/\s+/g, " ")
    .replace(/(p\.?|phòng)\s*/g, "phòng ")
    .replace(/(lau|lầu)/g, "lầu")
    .trim();

  console.log(`Formatting room: ${room} -> ${normalized}`);

  const mapping = {
    "phòng họp lầu 3": "Phòng họp lầu 3",
    "phòng họp lầu 4": "Phòng họp lầu 4",
    "phong hop lau 3": "Phòng họp lầu 3",
    "p hop lau 3": "Phòng họp lầu 3",
    "p.hop lau 3": "Phòng họp lầu 3",
  };

  return mapping[normalized] || room;
}

function formatDuration(duration) {
  if (!duration) return "";

  console.log("Formatting duration value:", duration, "Type:", typeof duration);

  // Handle Date objects from Excel
  if (duration instanceof Date) {
    const hours = duration.getHours();
    const minutes = duration.getMinutes();
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  }

  // Handle string format "HH:MM"
  if (typeof duration === "string") {
    const match = duration.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      const [_, hours, minutes] = match;
      return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
    }
  }

  // Handle numeric values (Excel time)
  if (typeof duration === "number" || !isNaN(duration)) {
    const floatDuration = parseFloat(duration);
    if (floatDuration > 0) {
      const totalMinutes = Math.round(floatDuration * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}`;
    }
  }

  return "";
}

function determinePurpose(content) {
  if (!content) return "Khác";
  const contentLower = String(content).toLowerCase();
  if (contentLower.includes("họp")) return "Họp";
  if (contentLower.includes("đào tạo")) return "Đào tạo";
  if (contentLower.includes("phỏng vấn") || contentLower.includes("pv"))
    return "Phỏng vấn";
  return "Khác";
}

function processExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {
          type: "array",
          cellDates: true,
          dateNF: "dd/mm/yyyy",
        });

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(firstSheet, {
          raw: true,
          defval: "",
          header: 1,
        });

        // Tìm và xử lý header
        const headerRowIndex = rawData.findIndex((row) =>
          row.some((cell) =>
            String(cell)
              .toLowerCase()
              .match(/giờ|thời gian|start|end|duration/i)
          )
        );

        if (headerRowIndex === -1) {
          console.warn("Warning: Header row not found");
          return reject(new Error("Cannot find header row"));
        }

        // Get header row and find column indices
        const headers = rawData[headerRowIndex].map((h) =>
          String(h).toLowerCase().trim()
        );
        console.log("Headers found:", headers);

        // More flexible column matching
        const columnIndices = {
          startTime: headers.findIndex(
            (h) =>
              h.includes("GIỜ BẮT ĐẦU") ||
              h.includes("start") ||
              h.includes("bắt đầu") ||
              h === "start time"
          ),
          endTime: headers.findIndex(
            (h) =>
              h.includes("GIỜ KẾT THÚC") ||
              h.includes("end") ||
              h.includes("kết thúc") ||
              h === "end time"
          ),
          duration: headers.findIndex(
            (h) =>
              h.includes("THỜI GIAN SỬ DỤNG") ||
              h.includes("duration") ||
              h.includes("thời gian") ||
              h === "duration time"
          ),
        };

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

          // Log raw values for debugging
          console.log(`Processing row ${i}:`, {
            rawStartTime: row[columnIndices.startTime],
            rawEndTime: row[columnIndices.endTime],
            rawDuration: row[columnIndices.duration],
          });

          // Extract time values with fallback to specific columns if needed
          const startTimeValue = row[columnIndices.startTime] || row[3]; // Fallback to column D
          const endTimeValue = row[columnIndices.endTime] || row[4]; // Fallback to column E
          const durationValue = row[columnIndices.duration] || row[5]; // Fallback to column F

          const meeting = {
            id: meetings.length + 1,
            date: formatDate(row[0]),
            dayOfWeek: formatDayOfWeek(row[1]),
            room: formatRoomName(row[2]),
            startTime: formatTime(startTimeValue),
            endTime: formatTime(endTimeValue),
            duration: formatDuration(durationValue),
            content: row[7] || "",
            purpose: determinePurpose(row[7]),
          };

          console.log(`Processed meeting data:`, meeting);
          meetings.push(meeting);
        }
        const conflicts = await validateMeetings(meetings);

        if (conflicts.length > 0) {
          let errorMessage = "Phát hiện xung đột trong lịch họp:\n\n";
          conflicts.forEach((conflict) => {
            errorMessage += `${conflict.message}\n\n`;
          });

          showErrorModal(errorMessage);
          reject(new Error("CONFLICT_ERROR"));
          return;
        }

        resolve(meetings);
      } catch (error) {
        console.error("Error processing file:", error);
        reject(error);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function formatDate(dateInput) {
  console.log("formatDate input:", dateInput, "type:", typeof dateInput);

  if (!dateInput) return "";

  try {
    if (dateInput instanceof Date) {
      if (!isNaN(dateInput.getTime())) {
        const adjustedDate = new Date(dateInput);
        const day = adjustedDate.getDate();
        const month = adjustedDate.getMonth() + 1;
        const year = adjustedDate.getFullYear();

        return `${String(day).padStart(2, "0")}/${String(month).padStart(
          2,
          "0"
        )}/${year}`;
      }
    }

    if (typeof dateInput === "string") {
      const dateStr = dateInput.trim();
      const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match) {
        const [_, day, month, year] = match;
        return `${String(day).padStart(2, "0")}/${String(month).padStart(
          2,
          "0"
        )}/${year}`;
      }
    }

    //Processing numeric date values (Excel serial date)
    if (typeof dateInput === "number" || !isNaN(Number(dateInput))) {
      const numDate = Number(dateInput);
      // Excel bắt đầu từ 1/1/1900, và trừ đi 2 để điều chỉnh lỗi năm nhuận
      const excelEpoch = new Date(1900, 0, -1);
      const offsetDays = numDate - 1;
      const resultDate = new Date(excelEpoch);
      resultDate.setDate(resultDate.getDate() + offsetDays);

      if (!isNaN(resultDate.getTime())) {
        const day = resultDate.getDate();
        const month = resultDate.getMonth() + 1;
        const year = resultDate.getFullYear();
        return `${String(day).padStart(2, "0")}/${String(month).padStart(
          2,
          "0"
        )}/${year}`;
      }
    }

    console.log("Could not parse date:", dateInput);
    return "";
  } catch (error) {
    console.error("Error in formatDate:", error);
    return "";
  }
}

function parseMeetingInfo(cellContent) {
  if (!cellContent) return { purpose: "", content: "" };

  const lines = cellContent.split("\r\n");
  const content = lines[0];
  let purpose = "";

  // Extract purpose from common patterns
  if (content.toLowerCase().includes("họp")) {
    purpose = "Họp";
  } else if (content.toLowerCase().includes("đào tạo")) {
    purpose = "Đào tạo";
  } else if (content.toLowerCase().includes("pv")) {
    purpose = "Phỏng vấn";
  } else {
    purpose = "Khác";
  }

  return {
    purpose,
    content,
  };
}

function calculateEndTime(startTime) {
  if (!startTime) return "";

  // Convert time format (e.g., "7H30" to "8:00")
  const time = startTime.replace("H", ":").replace("h", ":");
  const [hours, minutes] = time.split(":").map(Number);

  // Add 30 minutes for default meeting duration
  let endHours = hours;
  let endMinutes = minutes + 30;

  if (endMinutes >= 60) {
    endHours += 1;
    endMinutes -= 60;
  }

  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(
    2,
    "0"
  )}`;
}

function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return "";

  const start = startTime.replace("H", ":").replace("h", ":");
  const [startHours, startMinutes] = start.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  const durationMinutes =
    endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

function updateScheduleTable(data) {
  const tableBody = document.querySelector(".schedule-table");
  const headerRow = tableBody.querySelector(".table-header");
  updateProgress(40, "Synchronizing data...");

  // Remove old rows
  Array.from(tableBody.children)
    .filter((child) => child !== headerRow)
    .forEach((child) => child.remove());

  // If no data, show an empty state row
  if (!data || data.length === 0) {
    const emptyRow = document.createElement("div");
    emptyRow.className = "table-row empty-state";
    emptyRow.setAttribute("role", "row");

    // Fix: Instead of using colspan which doesn't work with grid layouts,
    // create a proper full-width cell that spans across the entire row
    emptyRow.innerHTML = `
      <div role="cell" class="empty-message">No meetings scheduled for today.</div>
    `;
    tableBody.appendChild(emptyRow);

    // Add specific styling for this empty message cell
    const style = document.createElement("style");
    style.textContent = `
      .table-row.empty-state {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100px;
        min-width:180px;
        background-color: rgba(245, 245, 245, 0.8);
      }
      
      .empty-message {
        text-align: center;
        width: 100%;
        min-width: 380px !important;
        padding: 20px;
        color: #666;
        font-style: italic;
        font-size: 16px;
      }
    `;
    document.head.appendChild(style);

    updateProgress(100, "Update complete");
    hideProgressBar();
    return;
  }
  // Add new data
  data.forEach((meeting) => {
    const row = document.createElement("div");
    row.className = "table-row";
    row.setAttribute("role", "row");
    updateProgress(70, "Updating data...");
    console.log("Updating data with processing bar");
    row.innerHTML = `
            <div role="cell">${meeting.id}</div>
            <div role="cell">${meeting.date}</div>
            <div role="cell">${meeting.dayOfWeek}</div>
            <div role="cell">${meeting.room}</div>
            <div role="cell">${meeting.startTime}</div>
            <div role="cell">${meeting.endTime}</div>
            <div role="cell">${meeting.duration}</div>
            <div role="cell">${meeting.purpose}</div>
            <div role="cell">${meeting.content}</div>
        `;
    tableBody.appendChild(row);
    updateProgress(100, "Update successful");
    console.log("Data synchronized successfully!");
    hideProgressBar();
  });
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  const seconds = parts.length > 2 ? parseInt(parts[2]) : 0;
  return hours * 3600 + minutes * 60 + seconds;
}

// Function to show the progress bar
function showProgressBar() {
  const progressContainer = document.querySelector(".window");
  if (progressContainer) {
    progressContainer.classList.add("show");
    progressContainer.style.display = "block"; // Show the progress bar
    overlay.style.display = "block";
  }
}

// Function to hide the progress bar
function hideProgressBar() {
  const progressContainer = document.querySelector(".window");
  if (progressContainer) {
    progressContainer.classList.remove("show");
    progressContainer.style.display = "none"; // Hide the progress bar
    overlay.style.display = "none";
  }
}

// Event listener for the upload button
document.addEventListener("DOMContentLoaded", function () {
  PeopleDetectionSystem.initialize();

  // Load any cached data on startup
  loadCachedData();
  setupBasicCheck();
  const uploadButton = document.querySelector(".upload-button");
  showProgressBar();
  uploadButton.addEventListener("click", async function (event) {
    event.preventDefault();
    try {
      if (fileHandle) {
        const file = await fileHandle.getFile();
        await handleFileUpload(file);
        return;
      }
    } catch (error) {
      console.error("Không thể sử dụng file handle cũ:", error);
      fileHandle = null;
    }

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".xlsx, .xls";
    fileInput.style.display = "none";

    fileInput.addEventListener("change", function (e) {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        handleFileUpload(file);
        showProgressBar();
      }
    });

    fileInput.click();
  });

  // Event listener for clicks outside the upload button
  document.addEventListener("click", function (event) {
    if (!uploadButton.contains(event.target)) {
    }
  });
});
function setupBasicCheck() {
  const checkDisplayUpdate = () => {
    const now = new Date();
    console.log("[App] Basic display update check");

    // Simply refresh cached data every hour to keep display updated
    const cachedData = getCachedMeetingData();
    if (cachedData && Array.isArray(cachedData)) {
      // Filter today's meetings
      const today = new Date();
      const todayMeetings = cachedData.filter((meeting) => {
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

      updateRoomStatus(todayMeetings);
    }
  };

  // Kiểm tra mỗi 30 phút
  setInterval(checkDisplayUpdate, 30 * 60 * 1000);

  // Kiểm tra ngay khi setup
  setTimeout(checkDisplayUpdate, 5000);
}
document
  .getElementById("stopUploadBtn")
  .addEventListener("click", hideProgressBar);

async function handleFileUpload(file) {
  const progressContainer = document.getElementById("progressContainer");
  const progressStatus = document.getElementById("progressStatus");

  try {
    updateProgress(10, "Initializing...");
    updateProgress(40, "Processing data...");
    const data = await processExcelFile(file);

    // Store the current meeting data in memory for local processing
    let processedData = data.map((meeting) => ({
      ...meeting,
      isEnded: false,
      forceEndedByUser: false,
    }));

    // Filter meetings for today
    const today = new Date();
    const todayMeetings = processedData.filter((meeting) => {
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

    updateProgress(60, "Updating schedule...");

    // Check if there are any meetings today
    if (todayMeetings.length > 0) {
      // If there are meetings today, display them
      updateScheduleTable(todayMeetings);
      updateRoomStatus(todayMeetings);
    } else {
      // If no meetings today, show empty table and display a notification
      updateScheduleTable([]);
      updateRoomStatus([]);

      // Create and show notification popup
      showNoMeetingsNotification();
    }

    startAutoUpdate(processedData);

    updateProgress(80, "Saving to memory...");

    // Store in memory for local session management
    window.currentMeetingData = processedData;

    updateProgress(90, "Setting up monitoring...");
    if (fileHandle) {
      if (window.fileCheckInterval) {
        clearInterval(window.fileCheckInterval);
      }
      window.fileCheckInterval = setInterval(checkFileChanges, 5000);
    }

    updateProgress(100, "Complete!");
    hideProgressBar();

    setTimeout(() => {
      progressContainer.style.display = "none";
      progressContainer.classList.remove("upload-complete");
    }, 2000);

    return processedData;
  } catch (error) {
    console.error("Error processing file:", error);
    progressStatus.textContent = "Upload failed!";
    progressStatus.style.color = "#f44336";

    setTimeout(() => {
      progressContainer.style.display = "none";
    }, 2000);

    if (error.message !== "CONFLICT_ERROR") {
      alert("Error processing file. Please try again.");
    }

    throw error;
  }
}

// New function to show notification for no meetings
function showNoMeetingsNotification() {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = "no-meetings-notification";
  notification.textContent = "HÔM NAY CHƯA CÓ LỊCH HỌP";
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 20px 30px;
    border-radius: 10px;
    font-size: 18px;
    font-weight: bold;
    z-index: 1000;
    animation: fadeIn 0.3s ease-out;
  `;

  // Add animation styles
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    .no-meetings-notification.hiding {
      animation: fadeOut 0.3s ease-in forwards;
    }
  `;
  document.head.appendChild(styleEl);

  // Add to document
  document.body.appendChild(notification);

  // Remove after 2 seconds
  setTimeout(() => {
    notification.classList.add("hiding");
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 2000);
}

async function uploadToServer(file, processedData) {
  const formData = new FormData();
  formData.append("meetingFile", file);
  formData.append("processedData", JSON.stringify(processedData));

  try {
    const response = await fetch("/api/upload-meeting", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Upload thành công:", result);
    return result;
  } catch (error) {
    console.error("Lỗi khi upload:", error);
    throw error;
  }
}

//========================Update Time ====================

function updateClock() {
  const now = new Date();
  const hours = padZero(now.getHours());
  const minutes = padZero(now.getMinutes());
  const seconds = padZero(now.getSeconds());
  const time = `${hours}:${minutes}`;

  const days = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const dayName = days[now.getDay()];
  const date = padZero(now.getDate());
  const month = padZero(now.getMonth() + 1);
  const year = now.getFullYear();
  const dateStr = `${dayName}, ${date}/${month}/${year}`;

  const logoElement = document.querySelector(".logo");

  if (logoElement) {
    logoElement.innerHTML = `
    <div class="clock-container">
      ${time}
    </div>
  `;
  }

  const currentDateElement = document.querySelector(".current-date");
  if (currentDateElement) {
    currentDateElement.style.fontSize = "15px";
    currentDateElement.style.color = "#ffffff";
    currentDateElement.style.fontWeight = "bold";
    currentDateElement.style.paddingRight = "25px";
  }
}
function getFormattedDate() {
  const days = [
    "Chủ Nhật",
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
  ];
  const now = new Date();

  const dayOfWeek = days[now.getDay()];
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  return `${dayOfWeek},\n${day}/${month}/${year}`;
}

function updateDate() {
  const currentDateElement = document.querySelector(".current-date");
  if (currentDateElement) {
    currentDateElement.textContent = getFormattedDate();
  }
}

setInterval(updateDate, 1000);

updateDate();

function initClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

function checkTimeConflict(meeting1, meeting2) {
  const start1 = timeToMinutes(meeting1.startTime);
  const end1 = timeToMinutes(meeting1.endTime);
  const start2 = timeToMinutes(meeting2.startTime);
  const end2 = timeToMinutes(meeting2.endTime);
  return start1 < end2 && start2 < end1;
}

async function validateMeetings(meetings) {
  const conflicts = [];
  const processedMeetings = new Set();

  for (let i = 0; i < meetings.length; i++) {
    const currentMeeting = meetings[i];
    const key = `${currentMeeting.date}_${currentMeeting.room}`;

    for (let j = 0; j < meetings.length; j++) {
      if (i === j) continue;
      const otherMeeting = meetings[j];

      if (
        currentMeeting.date === otherMeeting.date &&
        normalizeRoomName(currentMeeting.room) ===
          normalizeRoomName(otherMeeting.room)
      ) {
        if (checkTimeConflict(currentMeeting, otherMeeting)) {
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

function checkTimeConflict(meeting1, meeting2) {
  const start1 = timeToMinutes(meeting1.startTime);
  const end1 = timeToMinutes(meeting1.endTime);
  const start2 = timeToMinutes(meeting2.startTime);
  const end2 = timeToMinutes(meeting2.endTime);

  return start1 < end2 && start2 < end1;
}

function validateNewMeeting(newMeeting, existingMeetings) {
  const conflicts = [];

  const relevantMeetings = existingMeetings.filter(
    (meeting) =>
      meeting.date === newMeeting.date &&
      normalizeRoomName(meeting.room) === normalizeRoomName(newMeeting.room)
  );

  for (const existingMeeting of relevantMeetings) {
    if (checkTimeConflict(newMeeting, existingMeeting)) {
      conflicts.push({
        conflictWith: existingMeeting,
        type: "TIME_OVERLAP",
        message: `Xung đột với cuộc họp "${
          existingMeeting.content || existingMeeting.purpose
        }" 
                 từ ${existingMeeting.startTime} đến ${
          existingMeeting.endTime
        }`,
      });
    }
  }

  return {
    isValid: conflicts.length === 0,
    conflicts,
  };
}

function showErrorModal(message) {
  const modalContainer = document.createElement("div");
  modalContainer.className = "error-modal-container";
  modalContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;

  const modalContent = document.createElement("div");
  modalContent.className = "error-modal-content";
  modalContent.style.cssText = `
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    max-width: 80%;
    max-height: 80%;
    overflow-y: auto;
    position: relative;
  `;

  const title = document.createElement("h3");
  title.textContent = "Lỗi Xung Đột Lịch Họp";
  title.style.color = "#dc3545";

  const content = document.createElement("pre");
  content.textContent = message;
  content.style.whiteSpace = "pre-wrap";
  content.style.marginTop = "10px";

  const closeButton = document.createElement("button");
  closeButton.textContent = "Đóng";
  closeButton.style.cssText = `
    margin-top: 15px;
    padding: 8px 16px;
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;
  closeButton.onclick = () => modalContainer.remove();

  modalContent.appendChild(title);
  modalContent.appendChild(content);
  modalContent.appendChild(closeButton);
  modalContainer.appendChild(modalContent);
  document.body.appendChild(modalContainer);
}

/*======Change Background Feature========= */
document.addEventListener("DOMContentLoaded", function () {
  const elements = {
    settingsIcon: document.querySelector(".settings-icon"),
    settingsContent: document.querySelector(".settings-content"),
    mainBgContainer: document.querySelector(".main-bg-container"),
    scheduleBgContainer: document.querySelector(".schedule-bg-container"),
    resetBackgroundButton: document.querySelector(".reset-background-button"),
    changeNameContainer: document.querySelector(".change-name-container"),
    welcomeMessage: document.querySelector(".welcome-message"),
  };

  // Template cho modal
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

  // Khởi tạo modal
  function initializeModal() {
    document.body.insertAdjacentHTML("beforeend", modalTemplate);
    return {
      modal: document.querySelector(".name-change-modal"),
      overlay: document.querySelector(".modal-overlay"),
      input: document.getElementById("newNameInput"),
      saveBtn: document.querySelector(".save-button"),
      cancelBtn: document.querySelector(".cancel-button"),
    };
  }

  const modalElements = initializeModal();

  // Các functions xử lý modal
  const modalHandlers = {
    open() {
      modalElements.modal.classList.add("active");
      modalElements.overlay.classList.add("active");
      modalElements.input.value = elements.welcomeMessage.textContent;
      modalElements.input.focus();
    },

    close() {
      modalElements.modal.classList.remove("active", "keyboard-active");
      modalElements.overlay.classList.remove("active");
      elements.changeNameContainer.classList.remove("keyboard-visible");
      modalElements.input.blur();
    },

    save() {
      const newName = modalElements.input.value.trim();
      if (newName) {
        elements.welcomeMessage.textContent = newName;
        localStorage.setItem("welcomeMessage", newName);
      }
      this.close();
    },
  };

  // Functions xử lý settings menu
  const settingsHandlers = {
    toggleMenu(event) {
      event.stopPropagation();
      const classes = [
        elements.settingsContent,
        elements.mainBgContainer,
        elements.scheduleBgContainer,
        elements.resetBackgroundButton,
        elements.changeNameContainer,
      ];

      classes.forEach((element) => element.classList.toggle("active"));

      elements.settingsIcon.style.transform =
        elements.settingsContent.classList.contains("active")
          ? "rotate(90deg)"
          : "rotate(0deg)";
    },

    closeMenu() {
      const classes = [
        elements.settingsContent,
        elements.mainBgContainer,
        elements.scheduleBgContainer,
        elements.resetBackgroundButton,
        elements.changeNameContainer,
      ];

      classes.forEach((element) => element.classList.remove("active"));
      elements.settingsIcon.style.transform = "rotate(0deg)";
    },
  };

  // Event Listeners cho keyboard
  modalElements.input.addEventListener("focus", () => {
    modalElements.modal.classList.add("keyboard-active");
    elements.changeNameContainer.classList.add("keyboard-visible");
  });

  modalElements.input.addEventListener("blur", () => {
    modalElements.modal.classList.remove("keyboard-active");
    elements.changeNameContainer.classList.remove("keyboard-visible");
  });

  // Event Listeners cho các buttons
  elements.settingsIcon.addEventListener("click", settingsHandlers.toggleMenu);

  document
    .querySelector(".change-name-button")
    .addEventListener("click", (e) => {
      e.stopPropagation();
      modalHandlers.open();
    });

  modalElements.saveBtn.addEventListener("click", () => modalHandlers.save());
  modalElements.cancelBtn.addEventListener("click", () =>
    modalHandlers.close()
  );

  // Event Listener cho phím Enter
  modalElements.input.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      modalHandlers.save();
    }
  });

  // Event Listener cho click outside
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".background-management")) {
      settingsHandlers.closeMenu();
    }
  });

  // Load saved welcome message
  const savedMessage = localStorage.getItem("welcomeMessage");
  if (savedMessage) {
    elements.welcomeMessage.textContent = savedMessage;
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // Lấy các phần tử cần thiết
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

  // Thêm Font Awesome nếu chưa có
  function addFontAwesome() {
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const fontAwesomeLink = document.createElement("link");
      fontAwesomeLink.rel = "stylesheet";
      fontAwesomeLink.href =
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css";
      document.head.appendChild(fontAwesomeLink);
    }
  }
  addFontAwesome();

  // Tạo modal preview
  function createPreviewModal(imageDataUrl, type) {
    const modal = document.createElement("div");
    modal.className = "background-preview-modal";

    modal.innerHTML = `
      <div class="background-preview-content">
        <img src="${imageDataUrl}" alt="Background Preview">
        <div class="background-preview-actions">
          <button class="background-confirm-btn">Xác Nhận</button>
          <button class="background-cancel-btn">Hủy</button>
        </div>
      </div> 
    `;

    const modalContainer = document.querySelector(".modal-container");
    modalContainer.appendChild(modal);

    // Trigger show effect
    setTimeout(() => {
      modal.classList.add("show");
    }, 10);

    const confirmBtn = modal.querySelector(".background-confirm-btn");
    const cancelBtn = modal.querySelector(".background-cancel-btn");

    confirmBtn.addEventListener("click", () => {
      if (type === "main") {
        localStorage.setItem("customMainBackground", imageDataUrl);
        meetingScreen.style.backgroundImage = `url(${imageDataUrl})`;
        meetingScreen.style.backgroundSize = "cover";
        meetingScreen.style.backgroundPosition = "center";
      } else if (type === "schedule") {
        localStorage.setItem("customScheduleBackground", imageDataUrl);
        scheduleContent.style.backgroundImage = `url(${imageDataUrl})`;
        scheduleContent.style.backgroundSize = "cover";
        scheduleContent.style.backgroundPosition = "center";
      }

      modal.classList.remove("show");
      setTimeout(() => {
        modalContainer.removeChild(modal);
      }, 300);
    });

    cancelBtn.addEventListener("click", () => {
      modal.classList.remove("show");
      setTimeout(() => {
        modalContainer.removeChild(modal);
      }, 300);
    });
  }

  mainBackgroundUploadBtn.addEventListener("click", function () {
    mainBackgroundUploadInput.click();
  });

  mainBackgroundUploadInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        createPreviewModal(e.target.result, "main");
      };
      reader.readAsDataURL(file);
    }
  });

  scheduleBackgroundUploadBtn.addEventListener("click", function () {
    scheduleBackgroundUploadInput.click();
  });

  scheduleBackgroundUploadInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        createPreviewModal(e.target.result, "schedule");
      };
      reader.readAsDataURL(file);
    }
  });

  // Reset background
  resetBackgroundButton.addEventListener("click", function () {
    // Tạo modal xác nhận
    const modalContainer = document.querySelector(".modal-container");
    const confirmModal = document.createElement("div");
    confirmModal.className = "background-preview-modal";
    confirmModal.innerHTML = `
      <div class="background-preview-content">
           <h3 style="color: rgba(255, 255, 255, 0.9);margin-bottom: 25px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">Bạn muốn Reset Background nào?</h3>
        <div class="background-preview-actions">
          <button class="reset-main-btn">Background Chính</button>
          <button class="reset-schedule-btn">Background Lịch</button>
          <button class="background-cancel-btn">Hủy</button>
        </div>
      </div>
    `;
    modalContainer.appendChild(confirmModal);

    // Trigger show effect
    setTimeout(() => {
      confirmModal.classList.add("show");
    }, 10);

    const resetMainBtn = confirmModal.querySelector(".reset-main-btn");
    const resetScheduleBtn = confirmModal.querySelector(".reset-schedule-btn");
    const cancelBtn = confirmModal.querySelector(".background-cancel-btn");

    resetMainBtn.addEventListener("click", () => {
      localStorage.removeItem("customMainBackground");
      meetingScreen.style.backgroundImage = "url(assests/imgs/background.jpg)";
      confirmModal.classList.remove("show");
      setTimeout(() => {
        modalContainer.removeChild(confirmModal);
      }, 300);
    });

    resetScheduleBtn.addEventListener("click", () => {
      localStorage.removeItem("customScheduleBackground");
      scheduleContent.style.backgroundImage =
        "url(assests/imgs/default-schedule-background.jpg)";
      confirmModal.classList.remove("show");
      setTimeout(() => {
        modalContainer.removeChild(confirmModal);
      }, 300);
    });

    cancelBtn.addEventListener("click", () => {
      confirmModal.classList.remove("show");
      setTimeout(() => {
        modalContainer.removeChild(confirmModal);
      }, 300);
    });
  });

  function applyStoredBackgrounds() {
    const savedMainBackground = localStorage.getItem("customMainBackground");
    const savedScheduleBackground = localStorage.getItem(
      "customScheduleBackground"
    );

    if (savedMainBackground) {
      meetingScreen.style.backgroundImage = `url(${savedMainBackground})`;
      meetingScreen.style.backgroundSize = "cover";
      meetingScreen.style.backgroundPosition = "center";
    }

    if (savedScheduleBackground) {
      scheduleContent.style.backgroundImage = `url(${savedScheduleBackground})`;
      scheduleContent.style.backgroundSize = "cover";
      scheduleContent.style.backgroundPosition = "center";
    }
  }

  applyStoredBackgrounds();
});

//==========Function Update info from Excel file to MeetingInfo Section========
function updateRoomStatus(data) {
  console.log("Updating room status with data at:", getCurrentTime());

  const currentDate = getCurrentDate();
  const currentTime = getCurrentTime();

  console.log("Current date:", currentDate);
  console.log("Current time:", currentTime);

  // Filter for today's meetings
  const todayMeetings = data.filter((meeting) => {
    const isToday = meeting.date === currentDate;
    console.log(`Meeting date: ${meeting.date}, Is today: ${isToday}`);
    return isToday;
  });

  console.log("Today's meetings:", todayMeetings);

  const roomsToUpdate = ["Phòng họp lầu 4", "Phòng họp lầu 3"];
  roomsToUpdate.forEach((roomName) => {
    // If no data or empty data, pass empty array to indicate no meetings
    if (!data || data.length === 0) {
      updateSingleRoomStatus(roomName, [], currentTime);
    } else {
      updateSingleRoomStatus(roomName, todayMeetings, currentTime);
    }
  });
}
// Add this to your existing style element or create a new one
const additionalStyles = document.createElement("style");
additionalStyles.textContent = `
  .table-row.empty-state {
    background-color: rgba(245, 245, 245, 0.8);
    font-style: italic;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  .no-meetings-notification {
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    letter-spacing: 1px;
    text-align: center;
  }
  
  .no-meetings-notification.hiding {
    animation: fadeOut 0.3s ease-in forwards;
  }
`;
document.head.appendChild(additionalStyles);
function normalizeRoomName(roomname) {
  if (!roomname) return "";
  return String(roomname)
    .toLowerCase()
    .replace(
      /[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]/g,
      ""
    )
    .replace(/\s+/g, " ")
    .replace(/(p\.?|phòng)\s*/g, "phòng ")
    .replace(/(lau|lầu)/g, "lầu")
    .trim();
}
function normalizeRoomName(name) {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
}

function isTimeOverdue(endTime, currentTime) {
  const endTimeParts = endTime.split(":");
  const endTimeWithSeconds = `${endTimeParts[0]}:${endTimeParts[1]}:00`;
  const isOverdue =
    timeToMinutes(currentTime) > timeToMinutes(endTimeWithSeconds);

  if (isOverdue) {
    console.log(
      `Meeting overdue check at ${currentTime} for end time ${endTime}`
    );
  }

  return isOverdue;
}

//==== Function related times, overdueTime=======
function startAutoUpdate(data) {
  updateRoomStatus(data);

  // Clear existing interval if any
  if (window.autoUpdateInterval) {
    clearInterval(window.autoUpdateInterval);
  }

  const intervalId = setInterval(() => {
    const now = new Date();
    const currentTime = getCurrentTime();

    // Cập nhật UI mỗi phút
    if (currentTime.endsWith(":00")) {
      console.log("Auto updating at:", currentTime);
      updateRoomStatus(data);
    }
  }, 1000);

  window.autoUpdateInterval = intervalId;
  return () => clearInterval(intervalId);
}

let previousStates = {};
function updateSingleRoomStatus(roomCode, meetings, currentTime) {
  console.log("Updating room status for:", roomCode);

  const normalizeRoomName = (name) =>
    name.toLowerCase().replace(/\s+/g, " ").trim();

  // Debug room sections
  const roomSections = document.querySelectorAll(".room-section");
  console.log(`Found ${roomSections.length} room sections in DOM`);

  // Log all room sections for debugging
  Array.from(roomSections).forEach((section, index) => {
    const roomElement = section.querySelector(".room-number");
    const roomText = roomElement
      ? roomElement.textContent.trim()
      : "No room-number element";
    console.log(`Room section ${index}: "${roomText}"`);
  });

  // Improved room matching with multiple strategies
  const roomSection = findRoomSection(roomCode);

  if (!roomSection) {
    console.warn(`No room section found for room code: ${roomCode}`);
    return;
  }

  const titleElement = roomSection.querySelector(".meeting-title");
  const startTimeElement = roomSection.querySelector(".start-time");
  const endTimeElement = roomSection.querySelector(".end-time");
  const statusIndicator = roomSection.querySelector(
    ".status-indicator .status-text"
  );
  const indicatorDot = roomSection.querySelector(
    ".status-indicator .indicator-dot"
  );

  // Log which elements were found for debugging
  console.log(`Room elements found for ${roomCode}:`, {
    titleElement: !!titleElement,
    startTimeElement: !!startTimeElement,
    endTimeElement: !!endTimeElement,
    statusIndicator: !!statusIndicator,
    indicatorDot: !!indicatorDot,
  });

  // Lọc cuộc họp cho phòng hiện tại
  const roomMeetings = meetings.filter(
    (meeting) => normalizeRoomName(meeting.room) === normalizeRoomName(roomCode)
  );

  console.log(`Found ${roomMeetings.length} meetings for room "${roomCode}"`);

  // Tìm cuộc họp đang diễn ra (thêm kiểm tra null)
  const activeMeeting = roomMeetings.find(
    (meeting) =>
      isTimeInRangeWithSeconds(
        currentTime,
        meeting.startTime,
        meeting.endTime
      ) &&
      !meeting.isEnded &&
      !meeting.forceEndedByUser
  );

  // Cập nhật giao diện với kiểm tra null
  updateRoomUIElements(
    roomCode,
    {
      titleElement,
      startTimeElement,
      endTimeElement,
      statusIndicator,
      indicatorDot,
    },
    activeMeeting,
    roomMeetings,
    currentTime
  );
  // Helper function to check if time is in range with seconds precision
  function isTimeInRangeWithSeconds(currentTime, startTime, endTime) {
    if (!currentTime || !startTime || !endTime) return false;

    // Add seconds if not present
    const fullStartTime =
      startTime.includes(":") && startTime.split(":").length === 2
        ? `${startTime}:00`
        : startTime;

    const fullEndTime =
      endTime.includes(":") && endTime.split(":").length === 2
        ? `${endTime}:00`
        : endTime;

    const current = timeToMinutes(currentTime);
    const start = timeToMinutes(fullStartTime);
    const end = timeToMinutes(fullEndTime);

    return current >= start && current <= end;
  }
  function updateRoomUIElements(
    roomCode,
    elements,
    activeMeeting,
    allMeetings,
    currentTime
  ) {
    const {
      titleElement,
      startTimeElement,
      endTimeElement,
      statusIndicator,
      indicatorDot,
    } = elements;

    if (activeMeeting) {
      // Active meeting found - update UI elements
      if (titleElement) {
        titleElement.innerHTML = `<span>Thông tin cuộc họp:</span> ${
          activeMeeting.content || activeMeeting.purpose || "Không có tiêu đề"
        }`;
      }

      if (startTimeElement) {
        startTimeElement.innerHTML = `<span>Thời gian bắt đầu:</span> ${
          activeMeeting.startTime || "--:--"
        }`;
      }

      if (endTimeElement) {
        endTimeElement.innerHTML = `<span>Thời gian kết thúc:</span> ${
          activeMeeting.endTime || "--:--"
        }`;
      }

      if (statusIndicator) {
        statusIndicator.textContent = "Đang họp";
      }

      if (indicatorDot) {
        indicatorDot.classList.remove("available");
        indicatorDot.classList.add("busy");
      }

      console.log(
        `Updated room ${roomCode} with active meeting: "${activeMeeting.content}"`
      );
    } else {
      // No active meeting - check for upcoming meetings
      const upcomingMeeting = allMeetings.find(
        (meeting) =>
          !meeting.isEnded &&
          !meeting.forceEndedByUser &&
          timeToMinutes(meeting.startTime) > timeToMinutes(currentTime)
      );

      if (upcomingMeeting) {
        // Upcoming meeting found
        if (titleElement) {
          titleElement.innerHTML = `<span>Thông tin cuộc họp sắp diễn ra:</span> ${
            upcomingMeeting.content ||
            upcomingMeeting.purpose ||
            "Không có tiêu đề"
          }`;
        }

        if (startTimeElement) {
          startTimeElement.innerHTML = `<span>Thời gian bắt đầu:</span> ${
            upcomingMeeting.startTime || "--:--"
          }`;
        }

        if (endTimeElement) {
          endTimeElement.innerHTML = `<span>Thời gian kết thúc:</span> ${
            upcomingMeeting.endTime || "--:--"
          }`;
        }

        if (statusIndicator) {
          statusIndicator.textContent = "Sắp họp";
        }

        if (indicatorDot) {
          indicatorDot.classList.remove("busy");
          indicatorDot.classList.add("available");
        }

        console.log(
          `Updated room ${roomCode} with upcoming meeting: "${upcomingMeeting.content}"`
        );
      } else {
        // No meetings
        if (titleElement) {
          titleElement.innerHTML = `<span>Thông tin cuộc họp:</span> Trống`;
        }

        if (startTimeElement) {
          startTimeElement.innerHTML = `<span>Thời gian bắt đầu:</span> --:--`;
        }

        if (endTimeElement) {
          endTimeElement.innerHTML = `<span>Thời gian kết thúc:</span> --:--`;
        }

        if (statusIndicator) {
          statusIndicator.textContent = "Trống";
        }

        if (indicatorDot) {
          indicatorDot.classList.remove("busy");
          indicatorDot.classList.add("available");
        }

        console.log(`Updated room ${roomCode} as empty`);
      }
    }
  }
}
if (!Element.prototype.contains) {
  Element.prototype.contains = function (text) {
    return this.textContent.trim().includes(text);
  };
}

let fileHandle = null;
let lastFileData = null;

async function checkFileChanges() {
  if (!fileHandle) return;

  try {
    const file = await fileHandle.getFile();
    const fileData = await file.text();

    if (lastFileData === null) {
      lastFileData = fileData;
      return;
    }

    // Use current memory data to preserve ended meeting states
    const currentData = getCachedMeetingData();
    const endedMeetings = currentData.filter(
      (meeting) => meeting.isEnded && meeting.forceEndedByUser
    );

    if (fileData !== lastFileData) {
      console.log("File changed, updating...");
      const newData = await processExcelFile(file);
      showProgressBar();
      updateProgress(0, "Reading data from file...");

      // Merge new data with ended meetings status
      const mergedData = newData.map((meeting) => {
        updateProgress(30, "Analyzing data...");
        const endedMeeting = endedMeetings.find(
          (ended) =>
            ended.id === meeting.id &&
            ended.room === meeting.room &&
            ended.date === meeting.date
        );

        if (endedMeeting) {
          // Keep ended meeting information
          return endedMeeting;
        }
        return meeting;
      });

      updateProgress(60, "Merging with current data...");

      // Filter meetings for today
      const today = new Date();
      const todayMeetings = mergedData.filter((meeting) => {
        const meetingDate = new Date(
          meeting.date.split("/").reverse().join("-")
        );
        return meetingDate.toDateString() === today.toDateString();
      });

      updateProgress(75, "Updating schedule...");

      // Check if there are any meetings today
      if (todayMeetings.length > 0) {
        // If there are meetings today, display them
        updateScheduleTable(todayMeetings);
        updateRoomStatus(todayMeetings);
      } else {
        // If no meetings today, show empty table and display a notification
        updateScheduleTable([]);
        updateRoomStatus([]);
        showNoMeetingsNotification();
      }

      // Store in memory instead of localStorage
      window.currentMeetingData = mergedData;

      updateProgress(95, "Saving to memory...");
      lastFileData = fileData;
      updateProgress(100, "Update successful!");
      setTimeout(hideProgressBar, 1000);
    } else {
      // When file hasn't changed, use current memory data
      const today = new Date();
      const todayMeetings = currentData.filter((meeting) => {
        const meetingDate = new Date(
          meeting.date.split("/").reverse().join("-")
        );
        return meetingDate.toDateString() === today.toDateString();
      });

      console.log("Using data from memory:", todayMeetings);

      // Only update room status, not the table
      updateRoomStatus(todayMeetings);
    }
  } catch (error) {
    console.error("Error checking file:", error);
    if (error.name === "NotAllowedError") {
      clearInterval(window.fileCheckInterval);
      fileHandle = null;
    }
  }
}

const overlay = document.createElement("div");
overlay.style.position = "fixed";
overlay.style.top = "0";
overlay.style.left = "0";
overlay.style.width = "100%";
overlay.style.height = "100%";
overlay.style.background = "rgba(0, 0, 0, 0.8)";
overlay.style.filter = "blur(15px)";
overlay.style.zIndex = "999";
overlay.style.display = "none";
document.body.appendChild(overlay);

function updateProgress(percent, statusText) {
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const progressStatus = document.getElementById("progressStatus");
  progressFill.style.width = `${percent}%`;
  progressText.textContent = `${percent}%`;
  progressStatus.textContent = statusText;
}
//========================Update Time ====================
function padZero(num) {
  return num < 10 ? `0${num}` : num;
}
// Gọi hàm khởi tạo khi trang đã load
document.addEventListener("DOMContentLoaded", initClock);
document.addEventListener("DOMContentLoaded", function () {
  const datePicker = document.getElementById("meetingDate");
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];
  datePicker.value = formattedDate;
  hideProgressBar();

  datePicker.addEventListener("change", function () {
    // Lấy dữ liệu từ memory
    const cachedData = getCachedMeetingData();

    if (cachedData && Array.isArray(cachedData)) {
      const selectedDate = new Date(this.value);
      const filteredData = cachedData.filter((meeting) => {
        const meetingDate = new Date(
          meeting.date.split("/").reverse().join("-")
        );
        return meetingDate.toDateString() === selectedDate.toDateString();
      });
      updateScheduleTable(filteredData);
    }
  });
});

/*================Full Screen Feature===============*/
document.addEventListener("DOMContentLoaded", function () {
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const meetingContainer = document.querySelector(".meeting-container");
  const meetingPage = document.querySelector(".meeting-page");
  const previewModal = document.querySelector(".modal-container");
  const changeNameContainer = document.querySelector(".change-name-container");
  const nameChangeModal = document.querySelector(".name-change-modal");
  const modalOverlay = document.querySelector(".modal-overlay");

  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (meetingPage.requestFullscreen) {
        meetingPage.requestFullscreen();
      } else if (meetingPage.mozRequestFullScreen) {
        meetingPage.mozRequestFullScreen();
      } else if (meetingPage.webkitRequestFullscreen) {
        meetingPage.webkitRequestFullscreen();
      } else if (meetingPage.msRequestFullscreen) {
        meetingPage.msRequestFullscreen();
      }

      meetingContainer.classList.add("fullscreen-mode");
      fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';

      // Đảm bảo modal và overlay được append vào element đang fullscreen
      meetingPage.appendChild(nameChangeModal);
      meetingPage.appendChild(modalOverlay);
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }

      meetingContainer.classList.remove("fullscreen-mode");
      fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';

      // Đưa modal và overlay trở lại body
      document.body.appendChild(nameChangeModal);
      document.body.appendChild(modalOverlay);
    }
  }

  // Xử lý hiển thị modal
  const changeNameButton = document.querySelector(".change-name-button");
  const welcomeMessage = document.querySelector(".welcome-message");
  const newNameInput = document.getElementById("newNameInput");

  changeNameButton.addEventListener("click", function (event) {
    event.stopPropagation();
    changeNameContainer.classList.add("move-to-top");
    // Đảm bảo modal được append vào element đúng
    if (document.fullscreenElement) {
      document.fullscreenElement.appendChild(nameChangeModal);
      document.fullscreenElement.appendChild(modalOverlay);
    }

    modal.classList.add("active");
    modalOverlay.classList.add("active");
    newNameInput.value = welcomeMessage.textContent;
    newNameInput.focus();
  });

  // Xử lý fullscreen change
  function handleFullscreenChange() {
    if (!document.fullscreenElement) {
      meetingContainer.classList.remove("fullscreen-mode");
      fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';

      // Đưa modal và overlay về body khi thoát fullscreen
      document.body.appendChild(nameChangeModal);
      document.body.appendChild(modalOverlay);
    }
  }

  // Fullscreen change event listeners
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
  document.addEventListener("mozfullscreenchange", handleFullscreenChange);
  document.addEventListener("MSFullscreenChange", handleFullscreenChange);

  // Add click event to fullscreen button
  fullscreenBtn.addEventListener("click", toggleFullScreen);
  document
    .querySelector(".cancel-button")
    .addEventListener("click", function () {
      nameChangeModal.classList.remove("active");
      modalOverlay.classList.remove("active");
      changeNameContainer.classList.remove("move-to-top"); // Chỉ remove class move-to-top khi click nút Hủy
    });

  document.querySelector(".save-button").addEventListener("click", function () {
    const newName = newNameInput.value.trim();
    if (newName) {
      welcomeMessage.textContent = newName;
      localStorage.setItem("welcomeMessage", newName);
      changeNameContainer.classList.remove("move-to-top");
    }
    nameChangeModal.classList.remove("active");
    modalOverlay.classList.remove("active");
  });

  modalOverlay.addEventListener("click", function () {
    nameChangeModal.classList.remove("active");
    modalOverlay.classList.remove("active");
  });

  // Optional: Escape key to exit fullscreen
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.fullscreenElement) {
      toggleFullScreen();
    }
  });

  // Load saved welcome message if exists
  const savedMessage = localStorage.getItem("welcomeMessage");
  if (savedMessage) {
    welcomeMessage.textContent = savedMessage;
  }
});

//====================Feature Go to Page 2=======================
document.addEventListener("DOMContentLoaded", function () {
  const roomButtons = document.querySelectorAll(".room-button");
  roomButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const roomText = this.querySelector(".button-text").textContent;
      if (roomText === "P.HỌP LẦU 3") {
        loadDynamicPage("room1");
      }
      if (roomText === "P.HỌP LẦU 4") {
        loadDynamicPage("room2");
      }
    });
  });
});
let statusAirConditioner = null;

let action = {
  "Phòng họp lầu 3": {
    actionOn: false,
    actionOff: false,
  },
  "Phòng họp lầu 4": {
    actionOn2: false,
    actionOff2: false,
  },
};

let acStates = {
  "Phòng họp lầu 3": {
    isOn: false,
  },
  "Phòng họp lầu 4": {
    isOn: false,
  },
};
const roomSuffixMap = {
  "Phòng họp lầu 3": "eRa",
  "Phòng họp lầu 4": "eRa2",
};
const roomEraMap = {
  "Phòng họp lầu 3": "eRa",
  "Phòng họp lầu 4": "eRa2",
};

function normalizeRoomKey(roomName) {
  return roomName.toLowerCase().replace(/\s+/g, " ").trim();
}
function getRoomPowerStats(roomKey) {
  const roomStats = {
    "phòng họp lầu 3": {
      temp: latestValues[configTemp?.id]?.value || 0,
      humi: latestValues[configHumi?.id]?.value || 0,
    },
    "phòng họp lầu 4": {
      temp: latestValues[configTemp2?.id]?.value || 0,
      humi: latestValues[configHumi2?.id]?.value || 0,
    },
  };

  return roomStats[roomKey.toLowerCase()] || { temp: 0, humi: 0 };
}

let acActions = {
  "Phòng họp lầu 3": { on: null, off: null },
  "Phòng họp lầu 4": { on: null, off: null },
};
let roomUpdateIntervals = {};
// Hàm render trang động riêng biệt
function renderRoomPage(data, roomKeyword, roomName) {
  console.log("Rendering room page for:", roomName);
  console.log("Data received:", data);
  console.log("=== INITIAL ROOM RENDER ===", {
    roomKeyword,
    roomName,
  });

  console.log(
    "Data received:",
    data.map((m) => m.room)
  );
  console.log(
    "roomKeyword:",
    roomKeyword,
    "normalized:",
    normalizeRoomKey(roomKeyword)
  );
  console.log(
    "All normalized meeting rooms:",
    data.map((m) => normalizeRoomKey(m.room))
  );

  // Lọc các cuộc họp cho phòng
  const roomMeetings = data.filter(
    (meeting) =>
      normalizeRoomKey(meeting.room) === normalizeRoomKey(roomKeyword)
  );
  console.log("Filtered room meetings:", roomMeetings);

  // Lọc các cuộc họp diễn ra trong ngày
  const today = new Date();
  const filteredData = roomMeetings.filter((meeting) => {
    const meetingDate = new Date(meeting.date.split("/").reverse().join("-"));
    return meetingDate.toDateString() === today.toDateString();
  });
  console.log("Today's meetings:", filteredData);

  const roomKey = normalizeRoomKey(roomKeyword);
  const eraSuffix = roomEraMap[roomKey];
  const normalizedRoomKey = roomKey.toLowerCase();
  const powerStats = getRoomPowerStats(normalizedRoomKey);

  console.log("Normalized room key:", roomKey);
  console.log("ERA suffix:", eraSuffix);
  console.log("Initial power stats:", powerStats);

  // Initialize room state if it doesn't exist
  if (!acStates[roomKey]) {
    console.log(`Initializing new state for room ${roomKey}`);
    acStates[roomKey] = {
      isOn: false,
      temproom: powerStats.tempValue,
      humidity: powerStats.humiValue,
    };
  } else {
    console.log(`Updating existing state for room ${roomKey}`);
    console.log("Previous state:", acStates[roomKey]);
    acStates[roomKey].temproom = powerStats.tempValue;
    acStates[roomKey].power = powerStats.humiValue;
    console.log("Updated state:", acStates[roomKey]);
  }
  // Cleanup existing interval nếu có
  // if (roomUpdateIntervals[roomKey]) {
  //   console.log(`Cleaning up existing interval for ${roomKey}`);
  //   clearInterval(roomUpdateIntervals[roomKey]);
  // }

  // Add debug logging to the eraWidget onValues callback
  const valueAirMap = {
    "phòng họp lầu 3": valueAir1,
    "phòng họp lầu 4": valueAir2,
  };
  const updateRoomStats = () => {
    const powerStats = getRoomPowerStats(roomKey);

    const tempElement = document.getElementById(
      `temperature-${normalizedRoomKey}`
    );
    const humiElement = document.getElementById(
      `humidity-${normalizedRoomKey}`
    );

    if (tempElement) tempElement.textContent = powerStats.temp.toFixed(1);
    if (humiElement) humiElement.textContent = powerStats.humi.toFixed(2);

    console.log(`Updated ${roomKey} stats:`, powerStats);
  };

  // Lấy thời gian hiện tại
  const currentTime = new Date();
  const currentTimeStr = `${String(currentTime.getHours()).padStart(
    2,
    "0"
  )}:${String(currentTime.getMinutes()).padStart(2, "0")}`;

  // Find active meeting (current time within meeting timeframe and not ended)
  const currentMeeting = filteredData.find((meeting) => {
    const startTime = meeting.startTime;
    const endTime = meeting.endTime;
    return (
      currentTimeStr >= startTime &&
      currentTimeStr <= endTime &&
      !meeting.isEnded &&
      !meeting.forceEndedByUser
    );
  });
  console.log("Current meeting:", currentMeeting);

  // Filter upcoming meetings (not ended and start time is after current time)
  const upcomingMeetings = filteredData
    .filter((meeting) => {
      const startTime = meeting.startTime;
      return (
        currentTimeStr <= startTime &&
        !meeting.isEnded &&
        !meeting.forceEndedByUser
      );
    })
    .sort((a, b) => {
      const timeA = a.startTime.split(":").map(Number);
      const timeB = b.startTime.split(":").map(Number);
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
    });
  console.log("Upcoming meetings:", upcomingMeetings);
  setTimeout(() => {
    const container = document.querySelector(".container");
    if (!container) return;

    container.addEventListener("click", (e) => {
      const acCard = e.target.closest(".ac-card");
      if (!acCard) return;

      // Normalize room name to lowercase
      const room = acCard.dataset.room.toLowerCase();

      // Use normalized room name
      const valueAir = valueAirMap[room];

      if (!valueAir) {
        console.error(`Không tìm thấy valueAir cho phòng: ${room}`);
        return;
      }

      // Kiểm tra và khởi tạo acStates nếu chưa có phòng này
      if (!acStates[room]) {
        acStates[room] = {
          isOn: false,
        };
      }

      // Xử lý nút bật/tắt
      if (e.target.closest(".controls .btn:first-child")) {
        acStates[room].isOn = !acStates[room].isOn;
        updateACStatus(acCard, room);
      }
    });
  }, 0);
  const suffix = roomSuffixMap[roomKey];
  const template = `
    <div class="container">
      <div class="left-panel">
        <div>
          <div class="clock-container">
            <div class="time-1" id="currentTime-1"></div>
          </div>
          <div class="currentDateElement-1" id="currentDate-1"></div>
        </div>
        <div>
          <div class="device online">
            <img
              alt="Power meter icon"
              height="30"
              src="https://storage.googleapis.com/a1aa/image/sp20aym45F4OONkBFWtn8r5qRfuruyCtUwgjpyI96eXQQdCUA.jpg"
              width="30"
            />
            <div>
              <div>Thông tin phòng họp</div>
                  <div>
                    Nhiệt độ: <span id="temperature-${normalizedRoomKey}">${powerStats.temp.toFixed(
    1
  )}</span> °C
                        Độ ẩm: <span id="humidity-${normalizedRoomKey}">${powerStats.humi.toFixed(
    2
  )}</span> %
                  </div>
            <div class="status">
              <i class="fas fa-circle"> </i>
              <div>
              <span> Online </span>
              </div>
            </div>
            </div>
          </div>
          <div class="ac-card"data-room="${roomName.toLowerCase()}">
            <div class="card-content">
              <img alt="Air conditioner icon" height="30" src="https://storage.googleapis.com/a1aa/image/njDqCVkQeJWBSiJfuEdErKceXH7wtLOLqr3glGdBuqpkg6EoA.jpg" width="30" />
              <div class="main-content">
                <h3 class="title">Đèn ${roomName}</h3>

                <div class="controls">
                  <button class="btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10" stroke-width="2" />
                    </svg>
                  </button>
                </div>

                <div class="status-air">
                  <div class="status-air-dot"></div>
                  <span>Offline</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button class="home-button">
          <i class="fas fa-home"></i> TRANG CHỦ
        </button>
      </div>
      <div class="main-panel">
        <div>
          <h1>${currentMeeting ? currentMeeting.room : roomName}</h1>
          <div class="current-status">HIỆN TẠI</div>
          <div class="meeting-title-1">${
            currentMeeting ? currentMeeting.content : "Không có cuộc họp"
          }</div>
          <div class="meeting-time-1">
            <div role="cell">
              <span>Bắt đầu: ${
                currentMeeting ? currentMeeting.startTime : "--:--"
              }</span>
              <span> - Kết thúc: ${
                currentMeeting ? currentMeeting.endTime : "--:--"
              }</span>
            </div>
          </div>
          <div class="purpose">MỤC ĐÍCH SỬ DỤNG</div>
          <div class="purpose-value">${
            currentMeeting ? currentMeeting.purpose : "Chưa xác định"
          }</div>
        </div>
        ${
          currentMeeting
            ? '<button class="end-meeting">END MEETING</button>'
            : '<div class="no-meeting-placeholder">Không có cuộc họp đang diễn ra</div>'
        }
      </div>
      <div class="right-panel">
        <h2>LỊCH HỌP PHÒNG ${roomName.toUpperCase()}</h2>
        ${upcomingMeetings
          .map(
            (meeting) => `
          <div class="upcoming-meeting">
            <div class="meeting-title">${meeting.content}</div>
            <div class="meeting-time-1">${meeting.startTime} - ${meeting.endTime}</div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
  // Set up continuous updates
  setTimeout(() => {
    console.log(`Setting up continuous updates for ${roomKey}`);

    // Chạy update ngay lập tức
    updateRoomStats();

    // Set up interval cho updates liên tục
    roomUpdateIntervals[roomKey] = setInterval(updateRoomStats, 1000);

    // Cleanup khi container bị remove
    const container = document.getElementById(`room-${roomKey}-container`);
    if (container) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.removedNodes.length > 0) {
            clearInterval(roomUpdateIntervals[roomKey]);
            delete roomUpdateIntervals[roomKey];
            observer.disconnect();
            console.log(`Cleaned up updates for ${roomKey}`);
          }
        });
      });

      observer.observe(container.parentNode, {
        childList: true,
        subtree: true,
      });
    }
  }, 0);

  return template;
}

function loadDynamicPage(pageType) {
  console.log("Loading dynamic page for:", pageType);

  const dynamicContent = document.getElementById("dynamicPageContent");
  const mainContent = document.querySelector(".content-wrapper");

  if (!dynamicContent || !mainContent) {
    console.error("Required elements not found!");
    return;
  }

  try {
    const data = getCachedMeetingData();
    if (!data || !Array.isArray(data)) {
      console.error("No cached data found!");
      return;
    }

    console.log("Loaded data from memory:", data);

    let roomKeyword, roomName;
    switch (pageType) {
      case "room1":
        roomKeyword = "Phòng họp lầu 3";
        roomName = "Phòng họp lầu 3";
        break;
      case "room2":
        roomKeyword = "Phòng họp lầu 4";
        roomName = "Phòng họp lầu 4";
        break;
      default:
        console.error("Unknown room type:", pageType);
        return;
    }

    // Render trang
    dynamicContent.innerHTML = renderRoomPage(data, roomKeyword, roomName);

    // Cập nhật đồng hồ
    const currentTimeElement = document.getElementById("currentTime-1");
    const currentDateElement = document.getElementById("currentDate-1");

    const updateTimeAndDate = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const day = now.toLocaleString("vi-VN", { weekday: "long" });
      const date = now.toLocaleDateString("vi-VN");

      if (currentTimeElement && currentDateElement) {
        currentTimeElement.textContent = `${hours}:${minutes}`;
        currentDateElement.textContent = `${day}, ${date}`;
      }
    };

    // Khởi tạo đồng hồ
    updateTimeAndDate();
    const timeInterval = setInterval(updateTimeAndDate, 60000);

    // Hiển thị trang động
    dynamicContent.style.display = "block";
    mainContent.style.display = "none";

    // Xử lý nút Home
    const homeButton = dynamicContent.querySelector(".home-button");
    if (homeButton) {
      homeButton.addEventListener("click", () => {
        clearInterval(timeInterval);
        dynamicContent.style.display = "none";
        mainContent.style.display = "flex";
      });
    }
  } catch (error) {
    console.error("Error loading dynamic page:", error);
  }
}

//======================End Meeting Feature==================
function setupEndMeetingHandlers() {
  const dynamicContent = document.getElementById("dynamicPageContent");
  if (!dynamicContent) return;

  // Xóa event listener cũ nếu có
  const oldHandler = dynamicContent._endMeetingHandler;
  if (oldHandler) {
    dynamicContent.removeEventListener("click", oldHandler);
  }

  // Tạo handler mới
  const newHandler = function (event) {
    if (event.target.classList.contains("end-meeting")) {
      handleEndMeeting(event);
    }
  };

  // Lưu và thêm handler mới
  dynamicContent._endMeetingHandler = newHandler;
  dynamicContent.addEventListener("click", newHandler);
}
// Thêm hàm kiểm tra trạng thái kết thúc của cuộc họp
function isValidMeetingState(meeting, currentTime) {
  if (!meeting) return false;

  // Nếu cuộc họp đã được đánh dấu kết thúc, luôn trả về false
  if (meeting.isEnded) return false;

  // Kiểm tra thời gian hiện tại có nằm trong khoảng thời gian họp hay không
  const isTimeValid =
    currentTime >= meeting.startTime && currentTime <= meeting.endTime;

  return isTimeValid;
}

function handleEndMeeting(event) {
  // Show confirmation dialog first
  const isConfirmed = confirm(
    "Bạn có chắc chắn muốn kết thúc cuộc họp này không?"
  );

  // If user selects "No", exit the function
  if (!isConfirmed) {
    console.log("End meeting rejected by user");
    return;
  }

  // Get cached data from memory
  const data = getCachedMeetingData();
  if (!data || !Array.isArray(data)) {
    console.error("No meeting data found!");
    return;
  }
  const currentTime = getCurrentTime();
  const currentDate = getCurrentDate();

  // Get room name from DOM - try multiple selectors to be safe
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

  // If still no room name, try to determine from URL or context
  if (!roomName) {
    console.error("Could not determine room name from DOM");
    return;
  }

  console.log("Ending meeting for room:", roomName);

  // Find current meeting using the extracted room name
  const roomMeetings = data.filter(
    (meeting) => normalizeRoomKey(meeting.room) === normalizeRoomKey(roomName)
  );

  const currentMeeting = roomMeetings.find((meeting) =>
    isValidMeetingState(meeting, currentTime)
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
        forceEndedByUser: true, // Add new flag to mark meeting ended by user
      };

      // Update memory storage
      window.currentMeetingData = updatedData;

      // Filter meetings for today
      const todayMeetings = updatedData.filter((meeting) => {
        const meetingDate = new Date(
          meeting.date.split("/").reverse().join("-")
        );
        const currentDateObj = new Date(
          currentDate.split("/").reverse().join("-")
        );
        return meetingDate.toDateString() === currentDateObj.toDateString();
      });

      // Update UI - first update room status and schedule table
      updateRoomStatus(updatedData);
      updateScheduleTable(todayMeetings);

      // Re-render the current room page with updated data
      const roomKeywordForRender = roomName.toLowerCase().replace(/\s+/g, "-");
      renderRoomPage(updatedData, roomName, roomName);

      console.log(`Meeting ended early:`, {
        room: roomName,
        originalEndTime: currentMeeting.endTime,
        actualEndTime: currentTime,
        isEnded: true,
        forceEndedByUser: true,
      });

      // Show success notification
      alert(`Cuộc họp tại ${roomName} đã được kết thúc lúc ${currentTime}`);
    }
  } else {
    console.log("No active meeting found to end");
    alert("Không tìm thấy cuộc họp đang diễn ra để kết thúc");
  }
}

// Đảm bảo handlers được setup khi DOM ready
document.addEventListener("DOMContentLoaded", setupEndMeetingHandlers);

// Thêm CSS cho styling
const style = document.createElement("style");
style.textContent = `
  .controls .btn.active {
    color: white;
  }
  .status-air-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #ff0000;
    margin-right: 5px;
  }
  .no-meeting-placeholder {
    background-color: #f8f9fa;
    border: 2px dashed #dee2e6;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    color: #6c757d;
    font-style: italic;
    margin-top: 20px;
  }
  .end-meeting {
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 15px 30px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 20px;
  }
  .end-meeting:hover {
    background-color: #c82333;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  .end-meeting:active {
    transform: translateY(0);
  }
`;
document.head.appendChild(style);

//====================E-Ra Servies==================
function sanitizeRoomName(room) {
  return room.toLowerCase().replace(/\s+/g, "-");
}
let latestValues = {};
const eraWidget = new EraWidget();
// Lấy các phần tử HTML dựa trên ID, liên kết với giao diện người dùng
const temp = document.getElementById("temperature-eRa");
const humi = document.getElementById("humidity-eRa");
const pm25Index = document.getElementById("current-eRa");
const pm10Index = document.getElementById("voltage-eRa");

const temp2 = document.getElementById("temperature-eRa2");
const humi2 = document.getElementById("humidity-eRa2");
const currentIndex2 = document.getElementById("current-eRa2");
const powerIndex2 = document.getElementById("power-eRa2");

const airConditioner = document.getElementById("temperature-airConditioner");
const airConditioner2 = document.getElementById("temperature-airConditioner");

let currentACTemperature = 20; // Giá trị mặc định
let configTemp = null,
  configHumi = null,
  config25PM = null,
  config10PM = null,
  configPower = null,
  configTemp2 = null,
  configHumi2 = null,
  // configCurrent2 = null,
  // configPower2 = null,
  configAirConditioner = null,
  configAirConditioner2 = null,
  actionOff1 = null,
  actionOff2 = null,
  actionOn1 = null,
  actionOn2 = null,
  valueAir1 = null,
  valueAir2 = null,
  configPeopleDetection1 = null, //Lầu 3
  configPeopleDetection2 = null;

eraWidget.init({
  onConfiguration: (configuration) => {
    // Lưu các cấu hình khi nhận được từ widget
    configTemp = configuration.realtime_configs[0];
    configHumi = configuration.realtime_configs[1];
    config25PM = configuration.realtime_configs[2];
    config10PM = configuration.realtime_configs[3];
    configPeopleDetection1 = configuration.realtime_configs[4];
    configAirConditioner = configuration.realtime_configs[5];
    configTemp2 = configuration.realtime_configs[6];
    configHumi2 = configuration.realtime_configs[7];
    // configCurrent2 = configuration.realtime_configs[6];
    // configPower2 = configuration.realtime_configs[7];
    configAirConditioner2 = configuration.realtime_configs[8];
    // People detection sensors
    configPeopleDetection2 = configuration.realtime_configs[9];
    configAirConditioner2 = configuration.realtime_configs[10];
    // People detection sensors
    configAirConditioner2 = configuration.realtime_configs[12];
    acActions["Phòng họp lầu 3"].on = configuration.actions[0];
    acActions["Phòng họp lầu 3"].off = configuration.actions[1];

    acActions["Phòng họp lầu 4"].on = configuration.actions[2];
    acActions["Phòng họp lầu 4"].off = configuration.actions[3];

    valueAir1 = configuration.actions[4];
    valueAir2 = configuration.actions[5];

    setTimeout(() => {
      // Add visual feedback for UI updates
      document.querySelectorAll(".btn").forEach((btn) => {
        btn.addEventListener("click", function () {
          this.classList.add("btn-feedback");
          setTimeout(() => this.classList.remove("btn-feedback"), 300);
        });
      });
    }, 500);
  },
  // Hàm lấy giá trị từ các ID và cập nhật giao diện
  onValues: (values) => {
    console.log("Configuration:", {
      configTemp,
      configHumi,
      config25PM,
      config10PM,
      configPower,

      configTemp2,
      configHumi2,
      // configCurrent2,
      // configPower2,

      configAirConditioner,
      configAirConditioner2,
    });

    console.log("Actions initialized:", {
      actionOn1,
      actionOff1,
      actionOn2,
      actionOff2,
    });

    console.log("Current values:", values);

    console.log("Received new values from ERA:", values);
    latestValues = values; // Store latest values
    // Create a function to update room elements
    const updateRoomElements = (roomKey, current, power) => {
      const eraSuffix = roomEraMap[roomKey];
      const currentElement = document.getElementById(`current-${eraSuffix}`);
      const powerElement = document.getElementById(`power-${eraSuffix}`);

      if (currentElement && current !== undefined) {
        currentElement.textContent = current.toFixed(1);
        console.log(`Updated ${roomKey} current: ${current}A`);
      }

      if (powerElement && power !== undefined) {
        powerElement.textContent = power.toFixed(2);
        console.log(`Updated ${roomKey} power: ${power}KW`);
      }
    };
    if (configTemp && values[configTemp.id]) {
      const tempValue = values[configTemp.id].value;
      if (temp) temp.textContent = tempValue;
    }

    if (configHumi && values[configHumi.id]) {
      const humidValue = values[configHumi.id].value;
      if (humi) humi.textContent = humidValue;
    }

    if (config25PM && values[config25PM.id]) {
      updateRoomElements(
        " Phòng họp lầu 3",
        values[config25PM.id].value,
        values[config10PM?.id]?.value
      );
    }

    if (config25PM && values[config25PM.id]) {
      const pm25Value = values[config25PM.id].value;
      if (pm25Index) pm25Index.textContent = pm25Value;
    }

    if (config10PM && values[config10PM.id]) {
      const pm10Value = values[config10PM.id].value;
      if (pm10Index) pm10Index.textContent = pm10Value;
    }

    if (configTemp2 && values[configTemp2.id]) {
      const tempValue2 = values[configTemp2.id].value;
      if (temp2) temp2.textContent = tempValue2;
    }

    if (configHumi2 && values[configHumi2.id]) {
      const humidValue2 = values[configHumi2.id].value;
      if (humi2) humi2.textContent = humidValue2;
    }

    // Lavender 1 Room
    // if (configCurrent2 && values[configCurrent2.id]) {
    //   updateRoomElements(
    //     "Phòng họp lầu 4",
    //     values[configCurrent2.id].value,
    //     values[configPower2?.id]?.value
    //   );
    // }

    // if (configPower2 && values[configPower2.id]) {
    //   const powerValue2 = values[configPower2.id].value;
    //   if (powerIndex2) powerIndex2.textContent = powerValue2;
    // }

    if (configPeopleDetection1 && values[configPeopleDetection1.id]) {
      PeopleDetectionSystem.updateStatus(
        "Phòng họp lầu 3",
        values[configPeopleDetection1.id].value
      );
      console.log(
        "Phòng họp lầu 3 have a people detection value:",
        values[configPeopleDetection1.id].value
      );
    }

    if (configPeopleDetection2 && values[configPeopleDetection2.id]) {
      PeopleDetectionSystem.updateStatus(
        "Phòng họp lầu 4",
        values[configPeopleDetection2.id].value
      );
    }

    // Update all active rooms
    Object.keys(roomUpdateIntervals).forEach((roomKey) => {
      const eraSuffix = roomEraMap[roomKey];
      const currentElement = document.getElementById(`current-${eraSuffix}`);
      const powerElement = document.getElementById(`power-${eraSuffix}`);

      if (currentElement && powerElement) {
        if (config25PM && values[config25PM.id]) {
          currentElement.textContent = values[config25PM.id].value.toFixed(1);
        }
        if (configPower && values[configPower.id]) {
          powerElement.textContent = values[configPower.id].value.toFixed(2);
        }
      }
    });
    return latestValues;
  },
});

//=================Air Conditioner =================
let updateIntervals = {};

function updateACStatus(container, room) {
  const roomKey = normalizeRoomKey(room);
  const eraSuffix = roomEraMap[roomKey];
  const powerStats = getRoomPowerStats(eraSuffix);

  // Get all UI elements
  const statusDot = container.querySelector(".status-air-dot");
  const statusText = container.querySelector(".status-air span");
  const powerButton = container.querySelector(".controls .btn");

  // Debug: Log UI elements
  console.log(`[DEBUG] UI Elements for ${room}:`, {
    statusDot: !!statusDot,
    statusText: !!statusText,
    powerButton: !!powerButton,
  });

  // Create status monitor function
  const updateStatusIndicators = () => {
    try {
      // Get current power consumption
      const currentPower = powerStats?.current || 0;
      console.log(`[DEBUG] Power consumption for ${room}: ${currentPower}W`);

      // Determine AC state based on multiple factors
      // but also consider software state for immediate feedback
      const isActuallyRunning = acStates[roomKey]?.isOn || currentPower > 0.5;

      // Update internal state
      acStates[roomKey].isOn = isActuallyRunning;
      acStates[roomKey].powerConsumption = currentPower;

      // Update UI elements with null checks
      if (statusDot && statusText) {
        if (isActuallyRunning) {
          statusDot.style.backgroundColor = "#4CAF50";
          statusText.textContent = "Online";
        } else {
          statusDot.style.backgroundColor = "#ff0000";
          statusText.textContent = "Offline";
        }
      }

      if (powerButton) {
        if (isActuallyRunning) {
          powerButton.classList.add("active");
          powerButton.style.backgroundColor = "#4CAF50";
        } else {
          powerButton.classList.remove("active");
          powerButton.style.backgroundColor = "#6c757d";
        }
      }

      console.log(
        `[STATUS] AC ${room}: ${
          isActuallyRunning ? "ON" : "OFF"
        } | Power: ${currentPower}W`
      );
    } catch (error) {
      console.error(`[ERROR] Failed to update status for ${room}:`, error);
    }
  };

  // Initial update
  updateStatusIndicators();

  // Set up continuous monitoring with error handling
  const monitoringInterval = setInterval(() => {
    try {
      updateStatusIndicators();
    } catch (error) {
      console.error(`[ERROR] Monitoring error for ${room}:`, error);
    }
  }, 2000); // Reduce frequency to 2 seconds for better performance

  // Clean up when container is removed
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if ([...mutation.removedNodes].includes(container)) {
        clearInterval(monitoringInterval);
        observer.disconnect();
        console.log(`[CLEANUP] Monitoring stopped for ${room}`);
      }
    });
  });

  observer.observe(container.parentNode, { childList: true });

  return monitoringInterval;
}
function capitalizeFirst(str) {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

// Update updatePeopleStatus function
function updatePeopleStatus(room, value) {
  const roomKey = normalizeRoomKey(room);
  const isEmpty = value === 1;

  const peopleDetectionStates = {
    "phòng họp lầu 3": { isEmpty: true },
    "phòng họp lầu 4": { isEmpty: true },
  };
  if (peopleDetectionStates[roomKey].isEmpty !== isEmpty) {
    peopleDetectionStates[roomKey].isEmpty = isEmpty;

    const roomSection = findRoomSection(capitalizeFirst(roomKey));
    if (roomSection) {
      const peopleIndicator = roomSection.querySelector(".people-indicator");
      const peopleDot = peopleIndicator?.querySelector(".people-dot");
      const statusText = peopleIndicator?.querySelector(".people-status-text");

      if (peopleDot && statusText) {
        // Update status text using textContent
        statusText.textContent = isEmpty ? "Phòng trống" : "Có người";

        // Update dot color
        dot.style.backgroundColor = isEmpty ? "#4CAF50" : "#ff0000";

        // Add animation
        peopleDot.classList.add("status-update");
        setTimeout(() => peopleDot.classList.remove("status-update"), 500);

        console.log(
          `People detection status updated for ${room}: ${
            isEmpty ? "Empty" : "Occupied"
          }`
        );
      }
    }
  }
}

// Add this utility function at the top of your file
function findRoomSection(roomCode) {
  const normalizeRoomName = (name) =>
    name.toLowerCase().replace(/\s+/g, " ").trim();

  const normalizedRoomCode = normalizeRoomName(roomCode);
  const roomSections = document.querySelectorAll(".room-section");

  // Strategy 1: Find by room-number element text content
  const byRoomNumber = Array.from(roomSections).find((section) => {
    const roomElement = section.querySelector(".room-number");
    return (
      roomElement &&
      normalizeRoomName(roomElement.textContent) === normalizedRoomCode
    );
  });

  if (byRoomNumber) return byRoomNumber;

  // Strategy 2: Find by room-section attribute
  const byAttribute = Array.from(roomSections).find(
    (section) =>
      section.getAttribute("data-room") === roomCode ||
      normalizeRoomName(section.getAttribute("data-room") || "") ===
        normalizedRoomCode
  );

  if (byAttribute) return byAttribute;

  // Strategy 3: Find by heading or title content within the section
  const byHeading = Array.from(roomSections).find((section) => {
    const headings = section.querySelectorAll(
      "h1, h2, h3, h4, h5, .room-title"
    );
    return Array.from(headings).some(
      (h) =>
        normalizeRoomName(h.textContent) === normalizedRoomCode ||
        normalizeRoomName(h.textContent).includes(normalizedRoomCode)
    );
  });

  return byHeading;
}

const PeopleDetectionSystem = {
  // State management
  states: {
    "Phòng họp lầu 3": { isEmpty: true },
    "Phòng họp lầu 4": { isEmpty: true },
  },

  // Configuration mapping
  config: {
    "Phòng họp lầu 3": { sensorId: 4 },
    "Phòng họp lầu 4": { sensorId: 9 },
  },

  // Room name normalization
  normalizeRoomDisplay(roomKey) {
    const names = {
      "P.HỌP LẦU 3": "Phòng họp lầu 3",
      "Phòng họp lầu 4": "Phòng họp lầu 4",
    };
    return names[roomKey] || roomKey;
  },

  // System initialization
  initialize() {
    console.log("Initializing People Detection System...");
    this.validateRoomStructure();

    Object.keys(this.states).forEach((roomKey) => {
      console.log(
        `Initializing state for ${this.normalizeRoomDisplay(roomKey)}`
      );
      this.updateUI(roomKey, this.states[roomKey].isEmpty);
    });

    console.log("People Detection System initialized");
  },

  // Structure validation
  validateRoomStructure() {
    Object.keys(this.states).forEach((roomKey) => {
      const room = this.normalizeRoomDisplay(roomKey);
      const section = findRoomSection(room);

      if (!section) {
        console.error(`Room section missing: ${room}`);
        return;
      }

      this.validateRoomElements(section, room);
    });
  },

  // Element validation
  validateRoomElements(section, room) {
    const required = {
      peopleIndicator: ".people-indicator",
      dot: ".people-dot",
      statusText: ".people-status-text",
    };

    const missing = Object.entries(required)
      .filter(([_, selector]) => !section.querySelector(selector))
      .map(([name]) => name);

    if (missing.length > 0) {
      console.error(`Missing elements for ${room}:`, missing);
    }
  },

  updateStatus(roomKey, value) {
    let isEmpty = value === 0; // Assuming 1 means empty, 0 means occupied
    console.log(`People detection update for ${roomKey}: ${value}`);
    // Convert sensor value to room status (0 = occupied, 1 = empty)
    const roomMap = {
      "P.HỌP LẦU 3": "Phòng họp lầu 3",
      "P.HỌP LẦU 4": "Phòng họp lầu 4",
    };

    const normalizedRoom = roomMap[roomKey] || roomKey;

    if (this.states[normalizedRoom]?.isEmpty !== isEmpty) {
      this.states[normalizedRoom].isEmpty = isEmpty;
      this.updateUI(normalizedRoom, isEmpty);
    }
  },

  updateUI(roomKey, isEmpty) {
    const room = capitalizeFirst(this.normalizeRoomDisplay(roomKey));
    const section = findRoomSection(room);

    if (!section) {
      console.warn(`Room section not found: ${room}`);
      return;
    }

    // Get all required elements
    const peopleIndicator = section.querySelector(".people-indicator");
    if (!peopleIndicator) {
      console.warn(`People indicator not found for ${room}`);
      return;
    }

    // Directly target the status text element
    const statusText = peopleIndicator.querySelector(".people-status-text");
    const dot = peopleIndicator.querySelector(".people-dot");

    if (statusText && dot) {
      // Update status text using textContent
      statusText.textContent = isEmpty ? "Phòng trống" : "Có người";

      // Update dot color
      dot.style.backgroundColor = isEmpty ? "#4CAF50" : "#ff0000";

      // Add animation
      dot.classList.remove("status-update");
      void dot.offsetWidth; // Trigger reflow
      dot.classList.add("status-update");

      console.log(`Updated ${room} status text to: ${statusText.textContent}`);
    } else {
      console.error(`Missing elements for ${room}:`, {
        hasStatusText: !!statusText,
        hasDot: !!dot,
      });
    }
  },
  // Visual indicator update
  updateIndicators(dot, text, isEmpty) {
    dot.style.backgroundColor = isEmpty ? "#ff0000" : "#4CAF50";
    text.textContent = isEmpty ? "Phòng trống" : "Có người";

    // Add animation
    dot.classList.remove("status-update");
    void dot.offsetWidth; // Trigger reflow
    dot.classList.add("status-update");
  },
};

// Helper function to get current meeting data from memory
function getCachedMeetingData() {
  return window.currentMeetingData || [];
}

// Simplified data loading function for local operation
function loadCachedData() {
  // For now, this is a placeholder since we don't have persistent storage
  // When a file is uploaded, data will be stored in window.currentMeetingData
  console.log("[App] Local mode - waiting for file upload");

  // Show empty state initially
  updateScheduleTable([]);
  updateRoomStatus([]);

  return false;
}
