/**
 * Data Service
 * Handles API communication for meeting data with cloud deployment support
 */

class DataService {
  constructor() {
    this.apiBaseUrl = this._detectApiBaseUrl();

    // Connection status
    this.isConnected = false;
    this.connectionRetryCount = 0;
    this.maxRetryAttempts = 3;
    this.retryDelay = 2000; // 2 seconds

    // Last fetch time to prevent cache issues
    this.lastFetchTime = 0;

    // Enhanced connection check configuration
    this.connectionCheckInterval = 30000; // 30 seconds
    this.fastCheckInterval = 5000; // 5 seconds for failed connections

    // Print the API URL being used for debugging
    console.log(`API connection using: ${this.apiBaseUrl}`);

    // Check connection on init
    this._checkConnection();

    // Start periodic connection checks
    this._startConnectionMonitoring();
  }

  /**
   * Intelligent API base URL detection for different deployment environments
   */
  _detectApiBaseUrl() {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;

    // Development environment detection
    if (
      protocol === "file:" ||
      hostname === "localhost" ||
      hostname === "127.0.0.1"
    ) {
      // Check if custom server IP is stored for network synchronization
      const serverIP = localStorage.getItem("serverIP");
      if (serverIP && serverIP !== "localhost" && serverIP !== "127.0.0.1") {
        console.log(`Using stored server IP: ${serverIP}`);
        return `http://${serverIP}:3000/api`;
      }
      return "http://localhost:3000/api";
    }

    // Cloud/production environment detection
    if (hostname && hostname !== "localhost") {
      // Use same protocol and host as the current page
      const baseUrl = port
        ? `${protocol}//${hostname}:${port}`
        : `${protocol}//${hostname}`;

      // For cloud deployment, API is typically on same domain with /api path
      return `${baseUrl}/api`;
    }

    // Fallback to localhost for development
    return "http://localhost:3000/api";
  }

  /**
   * Start connection monitoring with adaptive intervals
   */
  _startConnectionMonitoring() {
    // Use faster checks when disconnected, normal interval when connected
    this.connectionTimer = setInterval(
      () => {
        this._checkConnection();
      },
      this.isConnected ? this.connectionCheckInterval : this.fastCheckInterval
    );
  }

  /**
   * Enhanced connection check with retry logic and better error handling
   */
  async _checkConnection() {
    try {
      // Add a cache-busting timestamp to prevent getting cached responses
      const timestamp = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

      const response = await fetch(
        `${this.apiBaseUrl}/meetings?t=${timestamp}`,
        {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      const wasConnected = this.isConnected;
      this.isConnected = response.ok;

      if (this.isConnected) {
        // Reset retry count on successful connection
        this.connectionRetryCount = 0;

        if (!wasConnected) {
          console.log(
            `Connected successfully to API server at: ${this.apiBaseUrl}`
          );
          // Dispatch connection restored event
          document.dispatchEvent(new CustomEvent("connectionRestored"));
        }

        // Switch to normal checking interval
        if (this.connectionTimer) {
          clearInterval(this.connectionTimer);
          this._startConnectionMonitoring();
        }
      } else {
        throw new Error(`Server responded with status ${response.status}`);
      }
    } catch (error) {
      const wasConnected = this.isConnected;
      this.isConnected = false;
      this.connectionRetryCount++;

      if (wasConnected) {
        console.warn(`API connection lost: ${error.message}`);
        console.warn(
          `Retrying connection (attempt ${this.connectionRetryCount}/${this.maxRetryAttempts})`
        );

        // Dispatch connection lost event
        document.dispatchEvent(
          new CustomEvent("connectionLost", {
            detail: {
              error: error.message,
              retryCount: this.connectionRetryCount,
            },
          })
        );
      }

      // Switch to fast checking interval when disconnected
      if (this.connectionTimer) {
        clearInterval(this.connectionTimer);
        this._startConnectionMonitoring();
      }

      // If max retries exceeded, try alternative connection methods
      if (this.connectionRetryCount >= this.maxRetryAttempts) {
        this._tryAlternativeConnections();
      }
    }
  }

  /**
   * Try alternative connection methods when primary connection fails
   */
  async _tryAlternativeConnections() {
    const alternatives = [
      // Try without port for cloud environments
      `${window.location.protocol}//${window.location.hostname}/api`,
      // Try localhost fallback
      "http://localhost:3000/api",
      // Try stored server IP
      localStorage.getItem("serverIP")
        ? `http://${localStorage.getItem("serverIP")}:3000/api`
        : null,
    ].filter(Boolean);

    for (const altUrl of alternatives) {
      if (altUrl !== this.apiBaseUrl) {
        try {
          const response = await fetch(`${altUrl}/meetings?t=${Date.now()}`, {
            method: "GET",
            timeout: 5000,
          });

          if (response.ok) {
            console.log(`Alternative connection successful: ${altUrl}`);
            this.apiBaseUrl = altUrl;
            this.connectionRetryCount = 0;
            this.isConnected = true;

            // Dispatch connection restored event
            document.dispatchEvent(new CustomEvent("connectionRestored"));
            return;
          }
        } catch (error) {
          console.warn(
            `Alternative connection failed for ${altUrl}: ${error.message}`
          );
        }
      }
    }

    // All alternatives failed, reset retry count for next cycle
    this.connectionRetryCount = 0;
  }

  /**
   * Enhanced API request with retry logic
   */
  async _makeApiRequest(endpoint, options = {}) {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout

        const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
          ...options,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`API error: ${response.status} - ${errorData}`);
        }

        this.isConnected = true;
        return response;
      } catch (error) {
        lastError = error;
        this.isConnected = false;

        console.warn(
          `API request attempt ${attempt}/${maxRetries} failed:`,
          error.message
        );

        // Don't retry on client errors (4xx)
        if (error.message.includes("4")) {
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Get all meetings with enhanced error handling
   */
  async getMeetings() {
    try {
      // Add cache-busting timestamp to prevent browser caching
      const timestamp = Date.now();
      this.lastFetchTime = timestamp;

      console.log(
        `Fetching meetings from: ${this.apiBaseUrl}/meetings?t=${timestamp}`
      );

      const response = await this._makeApiRequest(`/meetings?t=${timestamp}`, {
        method: "GET",
      });

      const data = await response.json();
      console.log(`Retrieved ${data.length} meetings from server`);

      // Dispatch a global event that data has been refreshed from server
      window.dispatchEvent(
        new CustomEvent("meetingsRefreshedFromServer", {
          detail: { meetings: data, timestamp: new Date() },
        })
      );

      return data;
    } catch (error) {
      console.error("Failed to fetch meetings:", error);
      this._handleApiError(error);

      // Return empty array as fallback
      return [];
    }
  }

  /**
   * Get a single meeting by ID
   */
  async getMeeting(id) {
    try {
      const response = await this._makeApiRequest(`/meetings/${id}`, {
        method: "GET",
      });

      const data = await response.json();
      console.log(`Retrieved meeting: ${id}`);
      return data;
    } catch (error) {
      console.error(`Failed to fetch meeting ${id}:`, error);
      this._handleApiError(error);
      return null;
    }
  }

  /**
   * Create a new meeting
   */
  async createMeeting(meetingData) {
    try {
      console.log("Creating meeting:", meetingData);

      const response = await this._makeApiRequest("/meetings", {
        method: "POST",
        body: JSON.stringify(meetingData),
      });

      const data = await response.json();
      console.log("Meeting created successfully:", data);

      // Dispatch event for real-time updates
      window.dispatchEvent(
        new CustomEvent("meetingCreated", {
          detail: { meeting: data },
        })
      );

      return data;
    } catch (error) {
      console.error("Failed to create meeting:", error);
      this._handleApiError(error);
      throw error;
    }
  }

  /**
   * Update an existing meeting
   */
  async updateMeeting(id, meetingData) {
    try {
      console.log(`Updating meeting ${id}:`, meetingData);

      const response = await this._makeApiRequest(`/meetings/${id}`, {
        method: "PUT",
        body: JSON.stringify(meetingData),
      });

      const data = await response.json();
      console.log("Meeting updated successfully:", data);

      // Dispatch event for real-time updates
      window.dispatchEvent(
        new CustomEvent("meetingUpdated", {
          detail: { meeting: data },
        })
      );

      return data;
    } catch (error) {
      console.error(`Failed to update meeting ${id}:`, error);
      this._handleApiError(error);
      throw error;
    }
  }

  /**
   * Delete a meeting
   */
  async deleteMeeting(id) {
    try {
      console.log(`Deleting meeting: ${id}`);

      const response = await this._makeApiRequest(`/meetings/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      console.log("Meeting deleted successfully");

      // Dispatch event for real-time updates
      window.dispatchEvent(
        new CustomEvent("meetingDeleted", {
          detail: { meetingId: id },
        })
      );

      return data;
    } catch (error) {
      console.error(`Failed to delete meeting ${id}:`, error);
      this._handleApiError(error);
      throw error;
    }
  }

  /**
   * Update all meetings (bulk update)
   */
  async updateAllMeetings(meetings) {
    try {
      console.log("Updating all meetings:", meetings.length);

      const response = await this._makeApiRequest("/meetings/batch", {
        method: "POST",
        body: JSON.stringify(meetings),
      });

      const data = await response.json();
      console.log("All meetings updated successfully");

      // Dispatch event for real-time updates
      window.dispatchEvent(
        new CustomEvent("allMeetingsUpdated", {
          detail: { meetings: data },
        })
      );

      return data;
    } catch (error) {
      console.error("Failed to update all meetings:", error);
      this._handleApiError(error);
      throw error;
    }
  }

  /**
   * Enhanced error handling for API calls
   */
  _handleApiError(error) {
    console.error("API Error:", error);

    // Dispatch event for UI to handle
    window.dispatchEvent(
      new CustomEvent("apiError", {
        detail: {
          error: error.message,
          url: this.apiBaseUrl,
          timestamp: new Date(),
        },
      })
    );
  }
}

// Export for use in other modules
export default DataService;
