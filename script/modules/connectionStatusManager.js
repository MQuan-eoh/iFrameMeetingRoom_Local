/**
 * Connection Status Component
 * Shows the connection status to the server
 */

export class ConnectionStatusManager {
  constructor(meetingDataManager) {
    this.meetingDataManager = meetingDataManager;
    this.statusElement = null;
    this._initialize();
  }

  /**
   * Initialize the connection status display
   */
  _initialize() {
    // Create status element
    this._createStatusElement();

    // Update status initially
    this._updateStatus();

    // Set interval to update status
    setInterval(() => this._updateStatus(), 30000);

    // Listen for connection events
    window.addEventListener("online", () => this._updateStatus());
    window.addEventListener("offline", () => this._updateStatus());
    window.addEventListener("apiConnectionError", () => this._updateStatus());
  }

  /**
   * Create the status element in the UI
   */
  _createStatusElement() {
    // Check if element already exists
    if (document.getElementById("connection-status")) {
      this.statusElement = document.getElementById("connection-status");
      return;
    }

    // Create status container
    this.statusElement = document.createElement("div");
    this.statusElement.id = "connection-status";
    this.statusElement.className = "connection-status";
    this.statusElement.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 5px;
      opacity: 0.8;
      transition: opacity 0.3s ease;
    `;

    // Add hover effect
    this.statusElement.addEventListener("mouseenter", () => {
      this.statusElement.style.opacity = "1";
    });
    this.statusElement.addEventListener("mouseleave", () => {
      this.statusElement.style.opacity = "0.8";
    });

    // Add sync button
    const syncButton = document.createElement("button");
    syncButton.className = "sync-button";
    syncButton.textContent = "⟲";
    syncButton.title = "Đồng bộ dữ liệu";
    syncButton.style.cssText = `
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 14px;
      padding: 2px;
    `;

    syncButton.addEventListener("click", () => this._forceSyncData());

    this.statusElement.appendChild(syncButton);

    // Add to body
    document.body.appendChild(this.statusElement);
  }

  /**
   * Update the connection status display
   */
  _updateStatus() {
    if (!this.statusElement || !this.meetingDataManager) return;

    const isOnline = this.meetingDataManager.isOnline && navigator.onLine;

    // Update status styles based on connection
    if (isOnline) {
      this.statusElement.style.backgroundColor = "rgba(46, 125, 50, 0.8)";
      this.statusElement.style.color = "white";
    } else {
      this.statusElement.style.backgroundColor = "rgba(198, 40, 40, 0.8)";
      this.statusElement.style.color = "white";
    }

    // Update status text
    let statusHtml = "";

    // Connection indicator dot
    statusHtml += `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color: ${
      isOnline ? "#4CAF50" : "#F44336"
    }"></span>`;

    // Status text
    statusHtml += isOnline ? " Đã kết nối" : " Ngoại tuyến";

    // Last sync time if available
    if (this.meetingDataManager.lastSync) {
      const lastSyncTime = new Date(
        this.meetingDataManager.lastSync
      ).toLocaleTimeString("vi-VN");
      statusHtml += ` (Đã đồng bộ ${lastSyncTime})`;
    }

    // Update HTML content
    this.statusElement.innerHTML = statusHtml;

    // Re-add the sync button
    const syncButton = document.createElement("button");
    syncButton.className = "sync-button";
    syncButton.textContent = "⟲";
    syncButton.title = "Đồng bộ dữ liệu";
    syncButton.style.cssText = `
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 14px;
      padding: 2px;
      color: white;
    `;

    syncButton.addEventListener("click", () => this._forceSyncData());

    this.statusElement.appendChild(syncButton);
  }

  /**
   * Force data synchronization with server
   */
  _forceSyncData() {
    if (!this.meetingDataManager) return;

    // Show syncing indicator
    this.statusElement.innerHTML =
      '<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color: #FFC107"></span> Đang đồng bộ...';

    // Use the new force refresh method for complete UI update
    this.meetingDataManager
      .forceRefresh()
      .then((meetings) => {
        // Show success briefly
        this.statusElement.innerHTML =
          '<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color: #4CAF50"></span> Đồng bộ thành công!';

        // Reset to normal display after a moment
        setTimeout(() => this._updateStatus(), 2000);

        // Show notification
        this._showNotification(
          "Đồng bộ thành công",
          `Dữ liệu đã được đồng bộ với máy chủ (${meetings.length} cuộc họp).`
        );

        // Force another room status update after a delay (for reliable UI update)
        setTimeout(() => {
          const todayMeetings =
            this.meetingDataManager.getTodayMeetings(meetings);
          document.dispatchEvent(
            new CustomEvent("refreshRoomStatus", {
              detail: { todayMeetings },
            })
          );
        }, 1000);
      })
      .catch((error) => {
        console.error("Sync failed:", error);
        this.statusElement.innerHTML =
          '<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color: #F44336"></span> Đồng bộ thất bại';

        // Reset to normal display after a moment
        setTimeout(() => this._updateStatus(), 2000);

        // Show error notification
        this._showNotification(
          "Đồng bộ thất bại",
          "Không thể đồng bộ dữ liệu với máy chủ. Vui lòng kiểm tra kết nối mạng.",
          true
        );
      });
  }

  /**
   * Check server connection
   */
  async _checkServerConnection() {
    try {
      if (!this.meetingDataManager) return false;

      const online = await fetch(
        `${window.location.protocol}//${
          window.location.hostname
        }:3000/api/meetings?t=${Date.now()}`,
        {
          method: "HEAD",
          cache: "no-cache",
          headers: {
            "Cache-Control": "no-cache",
          },
        }
      )
        .then((res) => res.ok)
        .catch(() => false);

      this.meetingDataManager.isOnline = online;
      return online;
    } catch (error) {
      console.error("Connection check failed:", error);
      this.meetingDataManager.isOnline = false;
      return false;
    }
  }

  /**
   * Show a notification
   */
  _showNotification(title, message, isError = false) {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = "sync-notification";
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px;
      background-color: ${isError ? "#f44336" : "#4CAF50"};
      color: white;
      border-radius: 4px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s ease;
      max-width: 300px;
    `;

    notification.innerHTML = `
      <div style="font-weight: bold;">${title}</div>
      <div style="font-size: 14px; margin-top: 5px;">${message}</div>
    `;

    // Add to body
    document.body.appendChild(notification);

    // Fade in
    setTimeout(() => {
      notification.style.opacity = "1";
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
}

export default ConnectionStatusManager;
