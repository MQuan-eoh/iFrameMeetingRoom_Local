//====================E-Ra Servies==================
function sanitizeRoomName(room) {
  return room.toLowerCase().replace(/\s+/g, "-");
}
const roomSuffixMap = {
  "Phòng họp lầu 3": "eRa",
  "Phòng họp lầu 4": "eRa2",
};
const roomEraMap = {
  "Phòng họp lầu 3": "eRa",
  "Phòng họp lầu 4": "eRa2",
};
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

// LED Actions configuration
const ledActions = {
  "Phòng họp lầu 3": { on: null, off: null },
  "Phòng họp lầu 4": { on: null, off: null },
};

// Room update intervals tracker
const roomUpdateIntervals = {};

// Helper function to safely access PeopleDetectionSystem
function updatePeopleDetectionStatus(roomName, value) {
  try {
    if (window.deviceManager && window.deviceManager.peopleDetectionSystem) {
      window.deviceManager.peopleDetectionSystem.updateStatus(roomName, value);
      console.log(`Updated people detection for ${roomName}: ${value}`);
    } else {
      console.warn(
        `DeviceManager not ready for people detection update: ${roomName}`
      );
    }
  } catch (error) {
    console.error(`Error updating people detection for ${roomName}:`, error);
  }
}

// Wait for application to be ready before initializing EraWidget
function initializeEraServices() {
  if (window.deviceManager && window.deviceManager.peopleDetectionSystem) {
    console.log("DeviceManager ready, initializing Era services...");
    initEraWidget();
  } else {
    console.log("⏳ Waiting for DeviceManager to be ready...");
    setTimeout(initializeEraServices, 500);
  }
}

function initEraWidget() {
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
      // People detection sensors
      configPeopleDetection2 = configuration.realtime_configs[9];
      ledActions["Phòng họp lầu 3"].on = configuration.actions[0];
      ledActions["Phòng họp lầu 3"].off = configuration.actions[1];

      ledActions["Phòng họp lầu 4"].on = configuration.actions[2];
      ledActions["Phòng họp lầu 4"].off = configuration.actions[3];

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
        // Use helper function for safe access
        updatePeopleDetectionStatus(
          "Phòng họp lầu 3",
          values[configPeopleDetection1.id].value
        );
        console.log(
          "Phòng họp lầu 3 have a people detection value:",
          values[configPeopleDetection1.id].value
        );
      }

      if (configPeopleDetection2 && values[configPeopleDetection2.id]) {
        // Use helper function for safe access
        updatePeopleDetectionStatus(
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
}

// Export light control function for use by other modules
window.controlRoomLight = function (roomName, turnOn) {
  console.log(`Controlling light for ${roomName}: ${turnOn ? "ON" : "OFF"}`);

  try {
    const action = turnOn
      ? ledActions[roomName]?.on
      : ledActions[roomName]?.off;

    if (!action) {
      console.error(`No LED action found for room: ${roomName}`);
      return false;
    }

    // Execute the Era widget action
    eraWidget.triggerAction(action.action, null);
    console.log(`Light control action triggered for ${roomName}`);
    return true;
  } catch (error) {
    console.error(`Error controlling light for ${roomName}:`, error);
    return false;
  }
};

// Initialize when DOM is ready or application is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeEraServices);
} else {
  initializeEraServices();
}

// Also listen for app initialization event
document.addEventListener("appInitialized", () => {
  console.log("App initialized, ensuring Era services are ready...");
  initializeEraServices();
});
