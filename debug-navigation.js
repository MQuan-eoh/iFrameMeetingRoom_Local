// Debug Helper for Navigation Issues
// Add this to browser console to test navigation without reload

// Function to check current state
function checkNavigationState() {
  console.log("🔍 Navigation State Check:");
  console.log(
    "meeting-container:",
    !!document.querySelector(".meeting-container")
  );
  console.log("content-wrapper:", !!document.querySelector(".content-wrapper"));
  console.log("rooms-container:", !!document.querySelector(".rooms-container"));
  console.log(
    "room-page-wrapper:",
    !!document.querySelector(".room-page-wrapper")
  );
  console.log(
    "room sections:",
    document.querySelectorAll(".room-section").length
  );
  console.log(
    "left-column visible:",
    document.querySelector(".left-column")?.style.display !== "none"
  );
  console.log(
    "right-column visible:",
    document.querySelector(".right-column")?.style.display !== "none"
  );
}

// Function to manually restore main dashboard
function restoreMainDashboard() {
  console.log("🔧 Manually restoring main dashboard...");

  // Hide room page wrapper
  const roomPageWrapper = document.querySelector(".room-page-wrapper");
  if (roomPageWrapper) {
    roomPageWrapper.style.display = "none";
    console.log("✅ Hidden room page wrapper");
  }

  // Show content wrapper
  const contentWrapper = document.querySelector(".content-wrapper");
  if (contentWrapper) {
    contentWrapper.style.display = "";
    console.log("✅ Showed content wrapper");
  }

  // Show main columns
  const leftColumn = document.querySelector(".left-column");
  const rightColumn = document.querySelector(".right-column");

  if (leftColumn) {
    leftColumn.style.display = "";
    leftColumn.style.visibility = "visible";
    console.log("✅ Showed left column");
  }

  if (rightColumn) {
    rightColumn.style.display = "";
    rightColumn.style.visibility = "visible";
    console.log("✅ Showed right column");
  }

  // Check room sections
  const roomsContainer = document.querySelector(".rooms-container");
  if (roomsContainer) {
    const roomSections = roomsContainer.querySelectorAll(".room-section");
    console.log(`📊 Found ${roomSections.length} room sections`);

    if (roomSections.length === 0) {
      console.log("🔧 Creating basic room sections...");

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
        console.log(`✅ Created room section for: ${roomName}`);
      });
    }
  }

  console.log("✅ Manual dashboard restoration complete");
  checkNavigationState();
}

// Function to simulate room navigation
function testRoomNavigation(roomName = "Phòng họp lầu 3") {
  console.log(`🧪 Testing room navigation to: ${roomName}`);

  if (window.roomManager && window.roomManager.renderRoomPage) {
    const data = window.currentMeetingData || [];
    window.roomManager.renderRoomPage(data, roomName, roomName);
    console.log("✅ Room navigation completed");
    checkNavigationState();
  } else {
    console.error("❌ Room manager not available");
  }
}

// Function to test back to home
function testBackToHome() {
  console.log("🧪 Testing back to home navigation");

  if (window.meetingRoomApp && window.meetingRoomApp.instance) {
    window.meetingRoomApp.instance._handleBackToHome({ from: "debugTest" });
    console.log("✅ Back to home navigation completed");
    checkNavigationState();
  } else {
    console.error("❌ Meeting room app not available");
  }
}

// Export functions for easy access
window.debugNav = {
  checkState: checkNavigationState,
  restore: restoreMainDashboard,
  testRoom: testRoomNavigation,
  testHome: testBackToHome,
};

console.log("🔧 Debug navigation helpers loaded!");
console.log("Available commands:");
console.log("- debugNav.checkState() - Check current navigation state");
console.log("- debugNav.restore() - Manually restore main dashboard");
console.log("- debugNav.testRoom() - Test room navigation");
console.log("- debugNav.testHome() - Test back to home navigation");
