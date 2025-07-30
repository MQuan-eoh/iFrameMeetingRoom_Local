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
  - **TUYỆT ĐỐI KHÔNG** sử dụng icon (biểu tượng cảm xúc) trong comment.
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
