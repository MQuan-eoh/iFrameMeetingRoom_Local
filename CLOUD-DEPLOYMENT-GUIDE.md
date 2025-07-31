# Hướng Dẫn Triển Khai Private Cloud - - - -[ Tham khảo ]

## Tổng Quan

Hệ thống Meeting Room Management đã được chuẩn bị sẵn sàng cho việc triển khai trên private cloud với các tính năng được liệt kê ở dưới như sau:

- ✅ Environment-aware configuration
- ✅ CORS security với whitelist domains
- ✅ Rate limiting cho API protection
- ✅ Graceful shutdown handling
- ✅ Enhanced error handling và retry logic
- ✅ Backup và data management
- ✅ Production-ready logging

## Cấu Trúc Dự Án

```
iFrameMeetingRoom_Local/
├──                   # Environment configuration (MỚI)
├── server/
│   ├── server.js          # Enhanced với cloud support
│   ├── package.json       # Updated dependencies
│   ├── .env
│   └── data/              # Configurable data directory
├── script/
│   ├── services/
│   │   └── dataService.js # Cloud-aware API communication
│   └── config/
│       └── constants.js   # Enhanced configuration
└── assets/                # Static files
```

Lưu ý : Các bước triển khai dưới đây nhằm bổ sung tham khảo và detail hơn cho việc triển khai, tùy vào phía Cloud mà có thể bước triển khai sẽ khác.

## Bước 1: Chuẩn Bị Environment

### 1.1 Cài Đặt Dependencies

```bash
cd server
npm install
```

### 1.2 Cấu Hình Environment Variables

Chỉnh sửa file `.env` trong thư mục server:

```env
# Environment
NODE_ENV=production

# Server Configuration
PORT=3000
HOST=0.0.0.0

# CORS Security - QUAN TRỌNG cho Cloud _ Must change
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Data Management
DATA_DIR=./server/data
BACKUP_RETENTION_DAYS=30
MAX_BACKUP_FILES=50

# Security
ENABLE_RATE_LIMIT=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Upload Limits
MAX_UPLOAD_SIZE=15728640

# Logging
LOG_LEVEL=info
DEBUG_MODE=false
```

## Bước 2: Cấu Hình Reverse Proxy

### 2.1 Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2.2 SSL/HTTPS Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Bước 3: Cấu Hình Client-Side

### 3.1 Update CORS Origins

Trong `.env`, cập nhật:

```env
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com,https://meeting.yourdomain.com
```

### 3.2 Client Auto-Detection

Client sẽ tự động detect API URL dựa trên:

- Development: `http://localhost:3000/api`
- Production: `https://yourdomain.com/api`

## Bước 4: Monitoring và Maintenance

### 4.1 Health Check Endpoint

Server đã có built-in health check:

```bash
curl https://yourdomain.com/api/meetings
```

### 4.2 Log Monitoring

```bash
# PM2 logs
pm2 logs meeting-room-app

# Docker logs
docker-compose logs -f
```

### 4.3 Backup Strategy

- Automatic backup: Được tạo mỗi khi có thay đổi data
- Retention: Configurable qua `BACKUP_RETENTION_DAYS`
- Location: `./server/data/backups/`
