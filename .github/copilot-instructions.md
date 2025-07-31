# Meeting Room Management System - AI Coding Agent Guide

## Bối cảnh & Mục tiêu dự án

- Đây là một dự án cho một công ty nhà nước, vì vậy **bảo mật (security)** và **tính ổn định** là ưu tiên hàng đầu.
- Dự án bao gồm front-end (HTML, CSS, JavaScript) và back-end (Node.js) để chạy một server local, phục vụ cho các máy trong cùng mạng nội bộ.

---

## Yêu cầu về Ngôn ngữ & Phong cách

- **Ngôn ngữ giao tiếp:** Luôn luôn trả lời, giải thích và thảo luận bằng **tiếng Việt**.
- **Ngôn ngữ lập trình:** Toàn bộ code phải được viết bằng **tiếng Anh**.
- **Phong cách thiết kế:** Hướng đến sự **chuyên nghiệp, sang trọng, và tinh tế**. Khi phát triển các tính năng hay giao diện mới, phải đảm bảo chúng **đồng bộ và nhất quán** với thiết kế đã có của hệ thống.

---

## Quy tắc về Viết Code & Cấu trúc

- **Clean Code:** Tuân thủ các nguyên tắc của clean code. Code phải rõ ràng, dễ đọc và dễ bảo trì.
- **Cấu trúc file:** Phân chia code thành các file/module theo từng cụm chức năng cụ thể. Tránh việc viết tất cả vào một file quá dài gây khó khăn cho việc debug và bảo trì.
- **Comment (Bình luận) trong code:**
  - Comment phải rõ ràng, súc tích và viết bằng tiếng Anh.
  - **TUYỆT ĐỐI KHÔNG** sử dụng icon (biểu tượng cảm xúc) trong commen và console log.
  - Để phân tách các khu vực code hoặc làm nổi bật một section (ví dụ: console log), hãy sử dụng một hàng dấu thăng dài: `####################`.
- **Bảo mật (Security):**
  - Mọi đoạn code được tạo ra phải tuân thủ các tiêu chuẩn bảo mật tốt nhất.
  - Validate và làm sạch (sanitize) tất cả dữ liệu đầu vào từ người dùng để chống lại các lỗ hổng như XSS.
  - Áp dụng các security headers cần thiết trên server Node.js.

---

## Quy trình Làm việc & Tương tác

1.  **Ưu tiên quét và hiểu rõ dự án trước khi code:**
    - Trước khi viết bất kỳ đoạn code nào, bạn phải ưu tiên quét (scan) toàn bộ mã nguồn và các tài liệu liên quan có sẵn để hiểu rõ yêu cầu và bối cảnh của dự án.
    - Nếu sau khi quét mà vẫn chưa rõ yêu cầu ở điểm nào, **bạn phải đặt câu hỏi cụ thể** để làm rõ. Chỉ tiến hành code khi đã nắm được trên 90% thông tin và tài nguyên cần thiết.
2.  **Giải trình và hướng dẫn sau khi code:**
    - Sau mỗi lần hoàn thành việc tạo hoặc sửa code, bạn phải cung cấp một ghi chú (notes) chi tiết về những thay đổi đã thực hiện.
    - **Dạy và giải thích:** Phân tích các cú pháp (syntax) hay và mới, hoặc các cú pháp quan trọng đã được sử dụng. Mục tiêu là để tôi có thể học hỏi và hiểu toàn bộ dự án, đảm bảo tôi nắm vững code base dù cho bạn là người viết chính.
3.  **Môi trường Server Local:**
    - Server Node.js phải được cấu hình để các máy khác trong cùng mạng LAN có thể truy cập được.
    - Phải đảm bảo rằng mỗi khi có sự nâng cấp (upgrade) hay thay đổi về code, server sẽ tự động cập nhật và phiên bản mới nhất sẽ được áp dụng cho tất cả các máy trạm đang truy cập mà không cần can thiệp thủ công. (Ví dụ: sử dụng nodemon cho server và các kỹ thuật cache-busting cho tài nguyên front-end).

## Project Overview

A local meeting room management system with modular architecture. Supports Excel-based scheduling, real-time room status updates, IoT device integration, and server-API communication for deployment flexibility.

## Architecture Patterns

### Modular Structure (ES6 Modules)

The codebase follows a strict modular pattern with dependency injection:

```
script/
├── config/constants.js     # Centralized configuration
├── utils/core.js          # DateTimeUtils, FormatUtils, ValidationUtils
├── modules/               # Core business logic modules
│   ├── meetingDataManager.js  # Excel processing, data validation
│   ├── uiManager.js          # UI state, notifications, modals
│   ├── roomManager.js        # Room status, schedule display
│   ├── deviceManager.js      # IoT integration, AC control
│   └── eventHandlers.js      # DOM events, file uploads
├── services/dataService.js   # API communication layer
└── index.js              # Main application coordinator
```

### Dependency Injection Pattern

All managers are instantiated in `MeetingRoomApp` constructor and passed as dependencies:

```javascript
this.managers.eventHandlers = new EventHandlers(this.managers);
```

### Event-Driven Communication

Modules communicate through custom DOM events, not direct method calls:

```javascript
document.dispatchEvent(new CustomEvent("navigateToHome", { detail: {...} }));
```

## Critical Developer Workflows

### Local Development Setup

1. **Server**: `cd server && npm install && npm start` (runs on port 3000)
2. **Client**: Open `index.html` - uses `script/index.js` (modular) not legacy version
3. **Debug**: Set `localStorage.setItem('debug', 'true')` for verbose logging

### API Communication Pattern

The `dataService.js` automatically detects environment and adapts API URLs:

- **Local**: `http://localhost:3000/api` or `http://192.168.x.x:3000/api`
- **Cloud**: Same protocol/domain as hosting page
- **File**: Falls back to localhost

### Server Deployment Considerations

**Local → Cloud Migration requires**:

- Environment variables: `DATA_DIR`, `ALLOWED_ORIGINS`, `NODE_ENV=production`
- CORS security: Change from `origin: "*"` to specific domains
- HTTPS support: Required for iframe integration
- Port flexibility: Remove hardcoded `:3000` from client

## Project-Specific Conventions

### Module Export Pattern

```javascript
export class ModuleName {
  constructor(dependencies) {
    /* inject managers */
  }
}
export default ModuleName; // Always default export
```

### Error Handling Strategy

- **UI Errors**: Use `uiManager.showNotification(message, "error")`
- **API Errors**: Implement retry logic in `dataService.js`
- **Navigation Errors**: Iframe-aware fallbacks (avoid page reloads in iframe context)

### Data Flow Architecture

1. **Excel Upload** → `eventHandlers._handleFileUpload()`
2. **Data Processing** → `meetingDataManager.processExcelFile()`
3. **UI Updates** → `roomManager.updateRoomStatus()` + `uiManager` notifications
4. **Server Sync** → `dataService` API calls with retry logic

### Configuration Management

All constants centralized in `config/constants.js`:

```javascript
export const ROOM_CONFIG = { ROOMS: { ROOM_3: "Phòng họp lầu 3" } };
export const API_CONFIG = { BASE_URL: "auto-detected" };
```

## Integration Points

### IoT Device Integration

- **ERA Widget**: Loaded via external script `@eohjsc/era-widget/src/index.js`
- **People Detection**: `deviceManager.peopleDetectionSystem`
- **AC Control**: Event-based commands through `deviceManager`

### Server API Endpoints

- **Meetings**: CRUD operations `/api/meetings[/:id]`
- **Batch Operations**: `/api/meetings/batch` for bulk updates
- **Background Upload**: `/api/backgrounds/upload` (50MB limit, base64 images)
- **File Storage**: Local filesystem with automatic backup rotation

### Cross-Origin Deployment

**Iframe Integration Pattern**:

- Detects iframe context: `window.self !== window.top`
- Avoids page reloads in iframe (causes crashes)
- Uses `uiManager.renderMainDashboard()` for navigation instead

## Development Commands Not in Package.json

### Testing API Endpoints

```javascript
// Run in browser console
await import("./test-api-validation.js");
```

### Debug Application State

```javascript
window.getAppStatus(); // Get full app status
window.refreshAppData(); // Force data refresh
window.meetingRoomApp.managers; // Access all managers
```

### Background Upload Testing

```javascript
// Test background API with minimal image
const testImage =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
```

## Common Pitfalls

### File vs Server API Confusion

- Excel files processed client-side only (`meetingDataManager`)
- Background images stored server-side via API
- Meeting data can use either localStorage or server API

### Navigation in Iframe Context

Always check iframe context before navigation:

```javascript
if (window.self !== window.top) {
  // Avoid window.location.reload() - causes iframe crashes
  // Use uiManager.renderMainDashboard() instead
}
```

### Module Loading Dependencies

Ensure DOM is ready before initializing - modules expect DOM elements:

```javascript
if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    () => (appInstance = new MeetingRoomApp())
  );
}
```
