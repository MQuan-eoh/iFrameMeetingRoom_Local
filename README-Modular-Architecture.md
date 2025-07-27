# Meeting Room Management System - Modular Architecture

## 📋 Overview

This document describes the new modular architecture implemented for the Meeting Room Management System. The codebase has been refactored from a single monolithic `index.js` file into a professional, maintainable modular structure.

## 🏗️ Architecture Overview

The application now follows a modular architecture pattern with the following key principles:

- **Separation of Concerns**: Each module handles a specific aspect of functionality
- **Dependency Injection**: Modules receive dependencies through constructors
- **Event-Driven Communication**: Modules communicate through custom events
- **Single Responsibility**: Each class has a single, well-defined purpose
- **Easy Testing**: Modular structure allows for better unit testing

## 📁 File Structure

```
script/
├── config/
│   └── constants.js          # Application constants and configuration
├── utils/
│   └── core.js              # Core utility functions (date/time, formatting, validation)
├── modules/
│   ├── meetingDataManager.js # Excel processing, data validation, caching
│   ├── uiManager.js         # Progress bars, notifications, modals, settings
│   ├── roomManager.js       # Room status updates, meeting info display
│   ├── deviceManager.js     # Air conditioner, people detection, IoT integration
│   └── eventHandlers.js     # DOM event listeners, user interactions
├── index-new.js             # Main application entry point
└── index.js                 # Legacy file (can be removed after migration)
```

## 🔧 Module Descriptions

### 1. **Constants (`config/constants.js`)**

**Purpose**: Central configuration and constants management

- Room configurations and mappings
- UI settings and timeouts
- Device configurations
- Storage keys and CSS classes

### 2. **Core Utils (`utils/core.js`)**

**Purpose**: Common utility functions and helpers

- `DateTimeUtils`: Date/time operations, formatting, parsing
- `FormatUtils`: String formatting, room name normalization
- `ValidationUtils`: Data validation functions
- `DOMUtils`: DOM manipulation helpers

### 3. **Meeting Data Manager (`modules/meetingDataManager.js`)**

**Purpose**: All meeting data operations

- Excel file processing and parsing
- Meeting data validation and conflict detection
- In-memory data caching and management
- File monitoring and auto-updates
- Meeting end functionality

**Key Methods**:

- `processExcelFile()`: Parse Excel files and extract meeting data
- `validateMeetings()`: Check for scheduling conflicts
- `handleEndMeeting()`: Handle user-initiated meeting termination
- `startFileMonitoring()`: Monitor Excel file for changes

### 4. **UI Manager (`modules/uiManager.js`)**

**Purpose**: All user interface operations

- Progress bar management
- Notification system
- Modal dialogs (error, background, settings)
- Clock and date display
- Settings management
- Fullscreen functionality

**Key Methods**:

- `showProgressBar()`, `updateProgress()`: Progress indication
- `showNotification()`: Display user notifications
- `showErrorModal()`: Error message display
- `initializeSettingsUI()`: Settings interface setup

### 5. **Room Manager (`modules/roomManager.js`)**

**Purpose**: Room status and meeting display management

- Room status updates based on meeting data
- Schedule table management
- Individual room page rendering
- Meeting status indicators

**Key Methods**:

- `updateRoomStatus()`: Update all room statuses
- `updateSingleRoomStatus()`: Update specific room
- `renderRoomPage()`: Generate individual room view
- `updateScheduleTable()`: Update meeting schedule display

### 6. **Device Manager (`modules/deviceManager.js`)**

**Purpose**: IoT device integration and control

- Air conditioner control and status
- People detection system
- Environmental sensors (temperature, humidity)
- Power consumption monitoring
- ERA Widget integration

**Key Methods**:

- `initialize()`: Setup device systems
- `updateACStatus()`: Update air conditioner status
- `handleACControl()`: Process AC control commands
- People Detection System with real-time updates

### 7. **Event Handlers (`modules/eventHandlers.js`)**

**Purpose**: DOM event management and user interactions

- File upload handling
- User interface event listeners
- Custom application events
- Room navigation
- Device control interactions

**Key Methods**:

- `setupEventListeners()`: Initialize all event handlers
- `_handleFileUpload()`: Process uploaded Excel files
- `_setupRoomNavigation()`: Room switching functionality

### 8. **Main Application (`index-new.js`)**

**Purpose**: Application initialization and coordination

- Module instantiation and dependency injection
- Global error handling
- Application state management
- Cleanup and shutdown procedures

## 🔄 Data Flow

```
1. User uploads Excel file
   ↓
2. EventHandlers captures file input
   ↓
3. MeetingDataManager processes Excel data
   ↓
4. RoomManager updates UI with meeting data
   ↓
5. DeviceManager syncs with IoT devices
   ↓
6. UIManager provides user feedback
```

## 🎯 Key Improvements

### **Before (Monolithic)**

- ❌ Single 3000+ line file
- ❌ Mixed concerns and responsibilities
- ❌ Hard to test and maintain
- ❌ Difficult to debug
- ❌ No clear separation of functionality

### **After (Modular)**

- ✅ Separated into logical modules (~300-500 lines each)
- ✅ Clear separation of concerns
- ✅ Easy to test individual components
- ✅ Improved debugging and logging
- ✅ Professional code organization
- ✅ Better documentation and maintainability

## 📊 Benefits

1. **Maintainability**: Each module can be updated independently
2. **Testability**: Individual modules can be unit tested
3. **Reusability**: Modules can be reused in other projects
4. **Debugging**: Easier to isolate and fix issues
5. **Team Development**: Multiple developers can work on different modules
6. **Documentation**: Each module is self-documented
7. **Performance**: Better memory management and cleanup

## 🚀 Usage

### **Basic Usage**

The application automatically initializes when the page loads. No manual intervention required.

### **Development Usage**

```javascript
// Access application instance
const app = window.meetingRoomApp.instance;

// Get application status
console.log(app.getStatus());

// Manually refresh data
app.refreshData();

// Access individual managers
const uiManager = window.meetingRoomApp.managers.uiManager;
const roomManager = window.meetingRoomApp.managers.roomManager;
```

### **Debugging Helpers**

```javascript
// Get current app status
window.getAppStatus();

// Manually refresh data
window.refreshAppData();

// Access utilities
window.meetingRoomApp.utils.getCurrentTime();
window.meetingRoomApp.utils.formatDate(new Date());
```

## 🔧 Configuration

Application configuration is centralized in `config/constants.js`:

```javascript
// Room configuration
ROOM_CONFIG.ROOMS.ROOM_3 = "Phòng họp lầu 3";

// Time settings
TIME_CONFIG.AUTO_UPDATE_INTERVAL = 30 * 60 * 1000;

// UI settings
UI_CONFIG.NOTIFICATION_DURATION = 3000;
```

## 🔄 Migration Notes

### **Current State**

- ✅ All OneDrive and localStorage sync code removed
- ✅ Meeting data uses in-memory storage only
- ✅ Modular structure implemented
- ✅ All functionality preserved and improved

### **Next Steps**

1. Test the new modular system thoroughly
2. Remove the old `index.js` file once confident
3. Update HTML to only use `index-new.js`
4. Add unit tests for individual modules
5. Consider adding TypeScript for better type safety

## 🐛 Troubleshooting

### **Common Issues**

1. **Module not loading**: Check browser console for import errors
2. **Missing functionality**: Verify all modules are properly initialized
3. **Event handlers not working**: Check EventHandlers module setup

### **Debug Mode**

Set `localStorage.setItem('debug', 'true')` for verbose logging.

## 📝 Future Enhancements

1. **TypeScript Migration**: Add type safety
2. **Unit Testing**: Implement comprehensive test suite
3. **State Management**: Consider Redux or similar for complex state
4. **Web Workers**: Move heavy processing to background threads
5. **PWA Features**: Add offline capabilities
6. **API Integration**: Future server-side integration points

## 👥 Contributing

When adding new functionality:

1. Identify the appropriate module (or create a new one)
2. Follow the existing patterns and conventions
3. Update this documentation
4. Add proper error handling and logging
5. Test thoroughly before deployment

## 📞 Support

For questions or issues with the modular architecture:

- Check the console for error messages
- Review individual module documentation
- Use the debugging helpers provided
- Contact the development team

---

**Version**: 2.0.0  
**Last Updated**: January 2025  
**Author**: EoH Company Development Team
