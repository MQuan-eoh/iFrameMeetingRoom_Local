/**
 * Data Service
 * Handles API communication for meeting data
 */

class DataService {
  constructor() {
    // Default to current host with API port
    const host = window.location.hostname;
    this.apiBaseUrl = `http://${host}:3000/api`;

    // Fallback if running directly from file
    if (window.location.protocol === "file:") {
      this.apiBaseUrl = "http://localhost:3000/api";
    }

    // Connection status
    this.isConnected = false;

    // Check connection on init
    this._checkConnection();
  }

  /**
   * Check connection to API server
   */
  async _checkConnection() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/meetings`);
      this.isConnected = response.ok;
      return this.isConnected;
    } catch (error) {
      console.error("API connection failed:", error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get all meetings
   */
  async getMeetings() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/meetings`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
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
