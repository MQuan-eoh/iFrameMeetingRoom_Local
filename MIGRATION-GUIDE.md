# Migration Guide: From Monolithic to Modular Architecture

## 🎯 Overview

This guide helps developers understand the migration from the original monolithic `index.js` to the new modular architecture. It includes mappings of old functions to new locations and usage patterns.

## 📋 Migration Summary

### **What Was Done**

- ✅ Removed all OneDrive and localStorage sync dependencies
- ✅ Restructured codebase into professional, maintainable modules
- ✅ Maintained all existing functionality
- ✅ Improved error handling and logging
- ✅ Added proper documentation

### **What Was Removed**

- ❌ OneDrive integration code
- ❌ Microsoft authentication (MSAL)
- ❌ localStorage sync for meeting data
- ❌ Cloud storage dependencies
- ❌ Monolithic code structure

## 🔄 Function Migration Map

### **Date/Time Functions**

| Old Location       | New Location                     | Module          |
| ------------------ | -------------------------------- | --------------- |
| `getCurrentDate()` | `DateTimeUtils.getCurrentDate()` | `utils/core.js` |
| `getCurrentTime()` | `DateTimeUtils.getCurrentTime()` | `utils/core.js` |
| `formatTime()`     | `DateTimeUtils.formatTime()`     | `utils/core.js` |
| `formatDate()`     | `DateTimeUtils.formatDate()`     | `utils/core.js` |
| `timeToMinutes()`  | `DateTimeUtils.timeToMinutes()`  | `utils/core.js` |
| `isTimeInRange()`  | `DateTimeUtils.isTimeInRange()`  | `utils/core.js` |

### **Data Processing Functions**

| Old Location         | New Location                             | Module                          |
| -------------------- | ---------------------------------------- | ------------------------------- |
| `processExcelFile()` | `MeetingDataManager.processExcelFile()`  | `modules/meetingDataManager.js` |
| `validateMeetings()` | `MeetingDataManager.validateMeetings()`  | `modules/meetingDataManager.js` |
| `handleEndMeeting()` | `MeetingDataManager.handleEndMeeting()`  | `modules/meetingDataManager.js` |
| `checkFileChanges()` | `MeetingDataManager._checkFileChanges()` | `modules/meetingDataManager.js` |

### **UI Functions**

| Old Location                   | New Location                             | Module                 |
| ------------------------------ | ---------------------------------------- | ---------------------- |
| `showProgressBar()`            | `UIManager.showProgressBar()`            | `modules/uiManager.js` |
| `hideProgressBar()`            | `UIManager.hideProgressBar()`            | `modules/uiManager.js` |
| `updateProgress()`             | `UIManager.updateProgress()`             | `modules/uiManager.js` |
| `showErrorModal()`             | `UIManager.showErrorModal()`             | `modules/uiManager.js` |
| `showNoMeetingsNotification()` | `UIManager.showNoMeetingsNotification()` | `modules/uiManager.js` |

### **Room Management Functions**

| Old Location               | New Location                           | Module                   |
| -------------------------- | -------------------------------------- | ------------------------ |
| `updateRoomStatus()`       | `RoomManager.updateRoomStatus()`       | `modules/roomManager.js` |
| `updateSingleRoomStatus()` | `RoomManager.updateSingleRoomStatus()` | `modules/roomManager.js` |
| `updateScheduleTable()`    | `RoomManager.updateScheduleTable()`    | `modules/roomManager.js` |
| `renderRoomPage()`         | `RoomManager.renderRoomPage()`         | `modules/roomManager.js` |

### **Device Functions**

| Old Location              | New Location                            | Module                     |
| ------------------------- | --------------------------------------- | -------------------------- |
| `updateACStatus()`        | `DeviceManager.updateACStatus()`        | `modules/deviceManager.js` |
| `PeopleDetectionSystem.*` | `DeviceManager.peopleDetectionSystem.*` | `modules/deviceManager.js` |
| `getRoomPowerStats()`     | `DeviceManager._getRoomPowerStats()`    | `modules/deviceManager.js` |

## 🔧 Usage Changes

### **Before (Monolithic)**

```javascript
// Direct function calls
const currentTime = getCurrentTime();
processExcelFile(file);
updateRoomStatus(data);
showProgressBar();
```

### **After (Modular)**

```javascript
// Access through application instance
const app = window.meetingRoomApp.instance;
const currentTime = app.managers.meetingDataManager.getCurrentTime();

// Or through utility functions
const currentTime = window.meetingRoomApp.utils.getCurrentTime();

// Manager-specific operations
app.managers.meetingDataManager.processExcelFile(file);
app.managers.roomManager.updateRoomStatus(data);
app.managers.uiManager.showProgressBar();
```

## 📁 File Organization

### **Old Structure**

```
script/
└── index.js (3000+ lines)
```

### **New Structure**

```
script/
├── config/
│   └── constants.js
├── utils/
│   └── core.js
├── modules/
│   ├── meetingDataManager.js
│   ├── uiManager.js
│   ├── roomManager.js
│   ├── deviceManager.js
│   └── eventHandlers.js
├── index-new.js
├── index-legacy.js (backup)
└── test-modular.js
```

## 🔄 Data Flow Changes

### **Old Data Flow**

```
Global variables → Direct function calls → Direct DOM manipulation
```

### **New Data Flow**

```
Module instances → Method calls → Event-driven updates → Managed DOM updates
```

## 🎨 Event Handling Changes

### **Before**

```javascript
// Direct event listeners scattered throughout code
document.getElementById("uploadButton").addEventListener("click", handleUpload);
document
  .querySelector(".end-meeting")
  .addEventListener("click", handleEndMeeting);
```

### **After**

```javascript
// Centralized event handling in EventHandlers module
class EventHandlers {
  setupEventListeners() {
    this._setupFileUpload();
    this._setupEndMeetingHandlers();
    // etc.
  }
}
```

## 🔧 Configuration Changes

### **Before**

```javascript
// Constants scattered throughout code
const AUTO_UPDATE_INTERVAL = 30 * 60 * 1000;
const ROOM_NAMES = {
  /* ... */
};
```

### **After**

```javascript
// Centralized configuration
import { TIME_CONFIG, ROOM_CONFIG } from "./config/constants.js";
```

## 📊 Memory Management

### **Old Approach**

- Global variables for everything
- No cleanup mechanisms
- Memory leaks possible

### **New Approach**

- Encapsulated state in modules
- Proper cleanup methods
- Better memory management

## 🐛 Error Handling

### **Before**

```javascript
// Basic try-catch blocks
try {
  // some operation
} catch (error) {
  console.error(error);
}
```

### **After**

```javascript
// Structured error handling with user feedback
try {
  // some operation
} catch (error) {
  console.error("Specific error context:", error);
  this.uiManager.showErrorModal(`User-friendly message: ${error.message}`);
}
```

## 🔍 Debugging Changes

### **Before**

```javascript
// Manual console.log statements
console.log("Processing file...");
```

### **After**

```javascript
// Structured logging with context
console.log(`[${this.constructor.name}] Processing file:`, file.name);

// Debug utilities available
window.getAppStatus();
window.refreshAppData();
```

## 🚀 Testing Approach

### **Before**

- Difficult to test individual functions
- Tightly coupled code
- Manual testing only

### **After**

- Each module can be tested independently
- Mock dependencies easily
- Automated testing possible

## 📋 Common Migration Tasks

### **1. Finding Old Functions**

Use the function migration map above to locate where old functions have moved.

### **2. Updating Event Handlers**

```javascript
// Old
document.addEventListener("click", someHandler);

// New - add to EventHandlers module
_setupSomeHandler() {
  document.addEventListener("click", (event) => {
    // handler logic
  });
}
```

### **3. Accessing Data**

```javascript
// Old
const data = window.currentMeetingData;

// New
const data = this.meetingDataManager.getCachedMeetingData();
```

### **4. Showing UI Feedback**

```javascript
// Old
showProgressBar();
updateProgress(50, "Processing...");

// New
this.uiManager.showProgressBar();
this.uiManager.updateProgress(50, "Processing...");
```

## ⚠️ Breaking Changes

1. **Global Functions**: No longer available directly, must access through modules
2. **Global Variables**: Encapsulated in appropriate modules
3. **Direct DOM Access**: Should go through appropriate managers
4. **Event Handling**: Centralized in EventHandlers module

## 🔄 Rollback Plan

If issues arise, you can easily rollback:

1. Comment out the new script import in HTML:

   ```html
   <!-- <script type="module" src="script/index-new.js"></script> -->
   ```

2. Uncomment the old script:
   ```html
   <script src="script/index-legacy.js"></script>
   ```

## 📞 Support

### **Quick Help Commands**

```javascript
// Check application status
window.getAppStatus();

// Refresh data manually
window.refreshAppData();

// Access managers directly
window.meetingRoomApp.managers.uiManager.showNotification("Test", "info");
```

### **Common Issues**

1. **Module not found errors**: Check file paths and import statements
2. **Function not available**: Use the migration map to find new location
3. **Events not working**: Check EventHandlers module setup
4. **Data not updating**: Verify MeetingDataManager is properly initialized

## 🎯 Next Steps

1. **Familiarize** yourself with the new module structure
2. **Test** the application thoroughly
3. **Report** any issues found
4. **Update** any custom code to use new patterns
5. **Remove** legacy file once confident in new system

---

**Migration Date**: January 2025  
**Support Contact**: Development Team  
**Documentation**: See README-Modular-Architecture.md
