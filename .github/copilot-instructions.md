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
  - **TUYỆT ĐỐI KHÔNG** sử dụng icon (biểu tượng cảm xúc) trong comment và console log.
  - Để phân tách các khu vực code hoặc làm nổi bật một section (ví dụ: console log), hãy sử dụng một hàng dấu thăng dài: `####################`.
- **Bảo mật (Security):**
  - Mọi đoạn code được tạo ra phải tuân thủ các tiêu chuẩn bảo mật tốt nhất.
  - Validate và làm sạch (sanitize) tất cả dữ liệu đầu vào từ người dùng để chống lại các lỗ hổng như XSS.
  - Áp dụng các security headers cần thiết trên server Node.js.

---
