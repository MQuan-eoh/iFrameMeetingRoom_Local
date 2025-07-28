/**
 * Device Manager
 * Handles IoT device integration including air conditioners, people detection, and sensors
 */

import { FormatUtils, DOMUtils } from "../utils/core.js";
import { ROOM_CONFIG, DEVICE_CONFIG } from "../config/constants.js";

export class DeviceManager {
  constructor() {
    this.acStates = {};
    this.latestValues = {};
    this.configSettings = {};
    this.acActions = { ...DEVICE_CONFIG.AC_ACTIONS };
    this.roomUpdateIntervals = {};
    this.peopleDetectionSystem = new PeopleDetectionSystem();
    this.eraWidget = null;
  }

  /**
   * Initialize device management system
   */
  initialize() {
    console.log("Initializing Device Manager...");
    this.peopleDetectionSystem.initialize();
    this._initializeEraWidget();
    this._addDeviceStyles();
  }

  /**
   * Initialize ERA Widget for IoT communication
   */
  _initializeEraWidget() {
    if (typeof EraWidget !== "undefined") {
      this.eraWidget = new EraWidget();
      this._setupEraConfiguration();
    } else {
      console.warn("EraWidget not available, device features disabled");
    }
  }

  /**
   * Setup ERA Widget configuration and callbacks
   */
  _setupEraConfiguration() {
    if (!this.eraWidget) return;

    // Configuration setup
    this.eraWidget.configuration = {
      // Device configurations will be set from the main app
      setup: (configuration) => {
        console.log("ERA Widget configuration received:", configuration);
        this._processConfiguration(configuration);
      },

      // Real-time values callback
      onValues: (values) => {
        console.log("Received new values from ERA:", values);
        this.latestValues = values;
        this._updateDeviceValues(values);
      },
    };
  }

  /**
   * Process ERA configuration
   */
  _processConfiguration(configuration) {
    // Store configuration settings
    this.configSettings = {
      realtime_configs: configuration.realtime_configs || [],
      actions: configuration.actions || [],
    };

    // Map specific configurations
    if (configuration.realtime_configs) {
      const configs = configuration.realtime_configs;
      this.configSettings.temp = configs[0];
      this.configSettings.humi = configs[1];
      this.configSettings.pm25 = configs[2];
      this.configSettings.pm10 = configs[3];
      this.configSettings.power = configs[4];
      this.configSettings.current = configs[5];
      this.configSettings.temp2 = configs[6];
      this.configSettings.humi2 = configs[7];
      this.configSettings.airConditioner = configs[8];
      this.configSettings.peopleDetection1 = configs[9];
      this.configSettings.airConditioner2 = configs[10];
      this.configSettings.peopleDetection2 = configs[12];
    }

    // Map actions
    if (configuration.actions) {
      this.acActions[ROOM_CONFIG.ROOMS.ROOM_3].on = configuration.actions[0];
      this.acActions[ROOM_CONFIG.ROOMS.ROOM_3].off = configuration.actions[1];
      this.acActions[ROOM_CONFIG.ROOMS.ROOM_4].on = configuration.actions[2];
      this.acActions[ROOM_CONFIG.ROOMS.ROOM_4].off = configuration.actions[3];
    }

    console.log("Device configuration processed:", this.configSettings);
  }

  /**
   * Update device values from ERA
   */
  _updateDeviceValues(values) {
    // Update temperature and humidity displays
    this._updateEnvironmentalSensors(values);

    // Update power consumption displays
    this._updatePowerSensors(values);

    // Update people detection
    this._updatePeopleDetection(values);

    // Update air conditioner status
    this._updateAirConditioners(values);
  }

  /**
   * Update environmental sensors (temperature, humidity, air quality)
   */
  _updateEnvironmentalSensors(values) {
    const { temp, humi, temp2, humi2, pm25, pm10 } = this.configSettings;

    // Room 1 sensors
    if (temp && values[temp.id]) {
      const tempElement = document.getElementById("temperature-eRa");
      if (tempElement) tempElement.textContent = values[temp.id].value;
    }

    if (humi && values[humi.id]) {
      const humiElement = document.getElementById("humidity-eRa");
      if (humiElement) humiElement.textContent = values[humi.id].value;
    }

    // Room 2 sensors
    if (temp2 && values[temp2.id]) {
      const temp2Element = document.getElementById("temperature-eRa2");
      if (temp2Element) temp2Element.textContent = values[temp2.id].value;
    }

    if (humi2 && values[humi2.id]) {
      const humi2Element = document.getElementById("humidity-eRa2");
      if (humi2Element) humi2Element.textContent = values[humi2.id].value;
    }

    // Air quality sensors
    if (pm25 && values[pm25.id]) {
      const pm25Element = document.getElementById("pm25-index");
      if (pm25Element) pm25Element.textContent = values[pm25.id].value;
    }

    if (pm10 && values[pm10.id]) {
      const pm10Element = document.getElementById("pm10-index");
      if (pm10Element) pm10Element.textContent = values[pm10.id].value;
    }
  }

  /**
   * Update power consumption sensors
   */
  _updatePowerSensors(values) {
    const { power, current, pm25 } = this.configSettings;

    // Update room power elements
    const updateRoomPower = (roomKey, currentValue, powerValue) => {
      const eraSuffix = ROOM_CONFIG.SUFFIX_MAP[roomKey];
      const currentElement = document.getElementById(`current-${eraSuffix}`);
      const powerElement = document.getElementById(`power-${eraSuffix}`);

      if (currentElement && currentValue !== undefined) {
        currentElement.textContent = currentValue.toFixed(1);
        console.log(`Updated ${roomKey} current: ${currentValue}A`);
      }

      if (powerElement && powerValue !== undefined) {
        powerElement.textContent = powerValue.toFixed(2);
        console.log(`Updated ${roomKey} power: ${powerValue}KW`);
      }
    };

    // Room 3 power data
    if (pm25 && values[pm25.id]) {
      updateRoomPower(
        ROOM_CONFIG.ROOMS.ROOM_3,
        values[pm25.id].value,
        values[power?.id]?.value
      );
    }
  }

  /**
   * Update people detection sensors
   */
  _updatePeopleDetection(values) {
    const { peopleDetection1, peopleDetection2 } = this.configSettings;

    if (peopleDetection1 && values[peopleDetection1.id]) {
      this.peopleDetectionSystem.updateStatus(
        ROOM_CONFIG.ROOMS.ROOM_3,
        values[peopleDetection1.id].value
      );
      console.log(
        "Room 3 people detection value:",
        values[peopleDetection1.id].value
      );
    }

    if (peopleDetection2 && values[peopleDetection2.id]) {
      this.peopleDetectionSystem.updateStatus(
        ROOM_CONFIG.ROOMS.ROOM_4,
        values[peopleDetection2.id].value
      );
      console.log(
        "Room 4 people detection value:",
        values[peopleDetection2.id].value
      );
    }
  }

  /**
   * Update air conditioner status and controls
   */
  _updateAirConditioners(values) {
    // Update AC status for all active rooms
    Object.keys(this.roomUpdateIntervals).forEach((roomKey) => {
      const container = document.querySelector(
        `[data-room="${roomKey.toLowerCase()}"]`
      );
      if (container) {
        this.updateACStatus(container, roomKey);
      }
    });
  }

  /**
   * Update AC status for a specific room
   */
  updateACStatus(container, room) {
    const roomKey = FormatUtils.normalizeRoomKey(room);
    const powerStats = this._getRoomPowerStats(roomKey.toLowerCase());

    // Get UI elements
    const statusDot = container.querySelector(".status-air-dot");
    const statusText = container.querySelector(".status-air span");
    const powerButton = container.querySelector(".controls .btn");

    console.log(`[DEBUG] UI Elements for ${room}:`, {
      statusDot: !!statusDot,
      statusText: !!statusText,
      powerButton: !!powerButton,
    });

    // Update status indicators
    const updateStatusIndicators = () => {
      try {
        // Get current power consumption
        const currentPower = powerStats?.current || 0;
        console.log(`[DEBUG] Power consumption for ${room}: ${currentPower}W`);

        // Determine AC state
        const isActuallyRunning =
          this.acStates[roomKey]?.isOn || currentPower > 0.5;

        // Update internal state
        if (!this.acStates[roomKey]) {
          this.acStates[roomKey] = {};
        }
        this.acStates[roomKey].isOn = isActuallyRunning;
        this.acStates[roomKey].powerConsumption = currentPower;

        // Update UI elements
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
          } (${currentPower}W)`
        );
      } catch (error) {
        console.error(`Error updating AC status for ${room}:`, error);
      }
    };

    // Update immediately and set up periodic updates
    updateStatusIndicators();

    // Clear existing interval
    if (this.roomUpdateIntervals[roomKey]) {
      clearInterval(this.roomUpdateIntervals[roomKey]);
    }

    // Set up new interval
    this.roomUpdateIntervals[roomKey] = setInterval(
      updateStatusIndicators,
      2000
    );
  }

  /**
   * Handle AC control actions
   */
  handleACControl(roomKey, action) {
    const room = FormatUtils.normalizeRoomKey(roomKey);
    const actionConfig = this.acActions[room];

    if (!actionConfig) {
      console.error(`No AC action configuration for room: ${room}`);
      return;
    }

    const actionToExecute =
      action === "on" ? actionConfig.on : actionConfig.off;

    if (actionToExecute && this.eraWidget) {
      console.log(`Executing AC ${action} for ${room}`);

      // Update local state immediately for UI feedback
      if (!this.acStates[room]) {
        this.acStates[room] = {};
      }
      this.acStates[room].isOn = action === "on";

      // Execute action through ERA
      // This would typically send a command to the IoT device
      // Implementation depends on the ERA widget API
      console.log(`AC ${action} command sent for ${room}`);
    } else {
      console.error(`Action ${action} not configured for room ${room}`);
    }
  }

  /**
   * Get room power statistics
   */
  _getRoomPowerStats(roomKey) {
    const roomStats = {
      [ROOM_CONFIG.ROOMS.ROOM_3.toLowerCase()]: {
        temp: this.latestValues[this.configSettings.temp?.id]?.value || 0,
        humi: this.latestValues[this.configSettings.humi?.id]?.value || 0,
        current: this.latestValues[this.configSettings.pm25?.id]?.value || 0,
        power: this.latestValues[this.configSettings.power?.id]?.value || 0,
      },
      [ROOM_CONFIG.ROOMS.ROOM_4.toLowerCase()]: {
        temp: this.latestValues[this.configSettings.temp2?.id]?.value || 0,
        humi: this.latestValues[this.configSettings.humi2?.id]?.value || 0,
        current: 0, // Configure as needed
        power: 0, // Configure as needed
      },
    };

    return (
      roomStats[roomKey.toLowerCase()] || {
        temp: 0,
        humi: 0,
        current: 0,
        power: 0,
      }
    );
  }

  /**
   * Clean up device intervals
   */
  cleanup() {
    Object.values(this.roomUpdateIntervals).forEach((interval) => {
      clearInterval(interval);
    });
    this.roomUpdateIntervals = {};
  }

  /**
   * Add device-related CSS
   */
  _addDeviceStyles() {
    const styles = `
      /* AC Control Styles */
      .ac-card {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        margin: 10px 0;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .ac-card .controls .btn {
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .ac-card .controls .btn.active {
        background: #4CAF50;
        transform: scale(1.1);
      }

      .ac-card .controls .btn:hover {
        transform: scale(1.05);
      }

      .status-air-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: #ff0000;
        margin-right: 5px;
        transition: background-color 0.3s ease;
      }

      .status-air span {
        font-size: 14px;
        font-weight: bold;
      }

      /* People Detection Styles */
      .people-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 5px;
      }

      .people-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: #ff0000;
        transition: all 0.3s ease;
      }

      .people-dot.status-update {
        animation: pulse 0.6s ease-in-out;
      }

      .people-status-text {
        font-size: 14px;
        color: #333;
      }

      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.2);
          opacity: 0.7;
        }
      }

      /* Sensor Display Styles */
      .sensor-value {
        font-size: 18px;
        font-weight: bold;
        color: #007bff;
      }

      .sensor-unit {
        font-size: 14px;
        color: #666;
        margin-left: 2px;
      }

      /* Device Status Indicators */
      .device-online {
        color: #28a745;
      }

      .device-offline {
        color: #dc3545;
      }

      .device-warning {
        color: #ffc107;
      }
    `;

    DOMUtils.addCSS(styles);
  }
}

/**
 * People Detection System
 */
class PeopleDetectionSystem {
  constructor() {
    this.states = {
      [ROOM_CONFIG.ROOMS.ROOM_3]: { isEmpty: true },
      [ROOM_CONFIG.ROOMS.ROOM_4]: { isEmpty: true },
    };

    this.config = DEVICE_CONFIG.PEOPLE_DETECTION;
  }

  initialize() {
    console.log("Initializing People Detection System...");
    this._validateRoomStructure();

    Object.keys(this.states).forEach((roomKey) => {
      console.log(
        `Initializing state for ${this._normalizeRoomDisplay(roomKey)}`
      );
      this.updateUI(roomKey, this.states[roomKey].isEmpty);
    });

    console.log("People Detection System initialized");
  }

  updateStatus(roomKey, value) {
    const normalizedRoom = this._normalizeRoomDisplay(roomKey);
    console.log(
      `[People Detection] Updating ${normalizedRoom} with value: ${value}`
    );

    // Convert value to boolean (0 = room empty, 1 = people detected)
    const isEmpty = value === 0;

    // Update state
    if (this.states[roomKey]) {
      this.states[roomKey].isEmpty = isEmpty;
    }

    // Update UI
    this.updateUI(roomKey, isEmpty);
  }

  updateUI(roomKey, isEmpty) {
    const room = FormatUtils.capitalizeFirst(
      this._normalizeRoomDisplay(roomKey)
    );
    const section = DOMUtils.findRoomSection(room);

    if (!section) {
      console.warn(`Room section not found: ${room}`);
      return;
    }

    const peopleIndicator = section.querySelector(".people-indicator");
    if (!peopleIndicator) {
      console.warn(`People indicator not found for ${room}`);
      return;
    }

    const statusText = peopleIndicator.querySelector(".people-status-text");
    const dot = peopleIndicator.querySelector(".people-dot");

    if (statusText && dot) {
      statusText.textContent = isEmpty ? "Phòng trống" : "Có người";
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
  }

  _normalizeRoomDisplay(roomKey) {
    return ROOM_CONFIG.NORMALIZED_NAMES[roomKey] || roomKey;
  }

  _validateRoomStructure() {
    Object.keys(this.states).forEach((roomKey) => {
      const room = this._normalizeRoomDisplay(roomKey);
      const section = DOMUtils.findRoomSection(room);

      if (!section) {
        console.error(`Room section missing: ${room}`);
        return;
      }

      this._validateRoomElements(section, room);
    });
  }

  _validateRoomElements(section, room) {
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
  }
}

export default DeviceManager;
