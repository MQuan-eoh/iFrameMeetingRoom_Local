/**
 * Data Service
 * Handles API communication for meeting data
 */

class DataService {
  constructor() {
    // Default to current host with API port
    const host = window.location.hostname || "localhost";
    // Use IP address if available from localStorage for network synchronization
    const serverIP = localStorage.getItem("serverIP") || host;
    this.apiBaseUrl = `http://${serverIP}:3000/api`;

    // Fallback if running directly from file
    if (window.location.protocol === "file:") {
      this.apiBaseUrl = "http://localhost:3000/api";
    }

    // Connection status
    this.isConnected = false;

    // Last fetch time to prevent cache issues
    this.lastFetchTime = 0;

    // Print the API URL being used for debugging
    console.log(`🔌 API connection using: ${this.apiBaseUrl}`);

    // Check connection on init
    this._checkConnection();

    // Periodic connection checks
    setInterval(() => this._checkConnection(), 30000);
  }

  /**
   * Check connection to API server
   */
  async _checkConnection() {
    try {
      // Add a cache-busting timestamp to prevent getting cached responses
      const timestamp = Date.now();
      const response = await fetch(
        `${this.apiBaseUrl}/meetings?t=${timestamp}`,
        {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

      this.isConnected = response.ok;

      if (this.isConnected) {
        console.log(
          `✅ Connected successfully to API server at: ${this.apiBaseUrl}`
        );
      }

      return this.isConnected;
    } catch (error) {
      console.error("API connection failed:", error);
      this.isConnected = false;

      // Dispatch an event so other components can react to the connection failure
      window.dispatchEvent(
        new CustomEvent("apiConnectionError", {
          detail: { error, url: this.apiBaseUrl },
        })
      );

      return false;
    }
  }

  /**
   * Get all meetings
   */
  async getMeetings() {
    try {
      // Add cache-busting timestamp to prevent browser caching
      const timestamp = Date.now();
      this.lastFetchTime = timestamp;

      console.log(
        `📥 Fetching meetings from: ${this.apiBaseUrl}/meetings?t=${timestamp}`
      );

      const response = await fetch(
        `${this.apiBaseUrl}/meetings?t=${timestamp}`,
        {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      this.isConnected = true;

      console.log(`📊 Retrieved ${data.length} meetings from server`);

      // Dispatch a global event that data has been refreshed from server
      window.dispatchEvent(
        new CustomEvent("meetingsRefreshedFromServer", {
          detail: { meetings: data, timestamp: new Date() },
        })
      );

      return data;
    } catch (error) {
      console.error("Error fetching meetings:", error);
      this._handleApiError(error);
      return [];
    }
  }

  /**
   * Get a single meeting by ID
   */
  async getMeeting(id) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/meetings/${id}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching meeting ${id}:`, error);
      this._handleApiError(error);
      return null;
    }
  }

  /**
   * Create a new meeting
   */
  async createMeeting(meetingData) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/meetings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating meeting:", error);
      this._handleApiError(error);
      throw error;
    }
  }

  /**
   * Update an existing meeting
   */
  async updateMeeting(id, meetingData) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/meetings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error updating meeting ${id}:`, error);
      this._handleApiError(error);
      throw error;
    }
  }

  /**
   * Delete a meeting
   */
  async deleteMeeting(id) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/meetings/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error deleting meeting ${id}:`, error);
      this._handleApiError(error);
      throw error;
    }
  }

  /**
   * Batch update all meetings
   */
  async updateAllMeetings(meetings) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/meetings/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(meetings),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error batch updating meetings:", error);
      this._handleApiError(error);
      throw error;
    }
  }

  /**
   * Handle API errors
   */
  _handleApiError(error) {
    // Update connection status if we have connection errors
    if (error.message.includes("Failed to fetch")) {
      this.isConnected = false;
      // Dispatch connection error event
      window.dispatchEvent(
        new CustomEvent("apiConnectionError", {
          detail: { error },
        })
      );
    }
  }
}

// Export as singleton
const dataService = new DataService();
export default dataService;
