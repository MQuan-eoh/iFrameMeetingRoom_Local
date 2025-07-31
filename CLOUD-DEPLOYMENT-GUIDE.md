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
├── .env                    # Environment configuration (MỚI)
├── server/
│   ├── server.js          # Enhanced với cloud support
│   ├── package.json       # Updated dependencies
│   └── data/              # Configurable data directory
├── script/
│   ├── services/
│   │   └── dataService.js # Cloud-aware API communication
│   └── config/
│       └── constants.js   # Enhanced configuration
└── assets/                # Static files
```
Lưu ý  : Các bước triển khai dưới đây nhằm bổ sung tham khảo và detail hơn cho việc triển khai, tùy vào phía Cloud mà có thể bước triển khai sẽ khác.

## Bước 1: Chuẩn Bị Environment

### 1.1 Cài Đặt Dependencies

```bash
cd server
npm install
```

### 1.2 Cấu Hình Environment Variables

Chỉnh sửa file `.env` trong thư mục root:

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

## Bước 2: Triển Khai Trên Private Cloud (Customer chuẩn bị và deploy)

### 2.1 Docker Deployment (Khuyến Nghị)

Tạo `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Tạo `docker-compose.yml`:

```yaml
version: "3.8"
services:
  meeting-room-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./data:/app/server/data
      - ./.env:/app/.env
    restart: unless-stopped
```

### 2.2 Traditional Server Deployment

1. **Upload source code** lên server
2. **Cài đặt Node.js** (version 14+)
3. **Install dependencies**: `npm install`
4. **Cấu hình .env** theo environment
5. **Start application**: `npm start`

### 2.3 Cloud Platform Specific

#### AWS EC2/ECS:

```bash
# Install PM2 for process management
npm install -g pm2
pm2 start server/server.js --name meeting-room-app
pm2 save
pm2 startup
```

#### Azure App Service:

- Set environment variables trong Application Settings
- Deploy qua Git hoặc Azure CLI

#### Google Cloud Platform:

- Sử dụng Cloud Run hoặc Compute Engine
- Configure Cloud Load Balancer cho HTTPS

## Bước 3: Cấu Hình Reverse Proxy

### 3.1 Nginx Configuration

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

### 3.2 SSL/HTTPS Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Bước 4: Cấu Hình Client-Side

### 4.1 Update CORS Origins

Trong `.env`, cập nhật:

```env
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com,https://meeting.yourdomain.com
```

### 4.2 Client Auto-Detection

Client sẽ tự động detect API URL dựa trên:

- Development: `http://localhost:3000/api`
- Production: `https://yourdomain.com/api`

## Bước 5: Monitoring và Maintenance

### 5.1 Health Check Endpoint

Server đã có built-in health check:

```bash
curl https://yourdomain.com/api/meetings
```

### 5.2 Log Monitoring

```bash
# PM2 logs
pm2 logs meeting-room-app

# Docker logs
docker-compose logs -f
```

### 5.3 Backup Strategy

- Automatic backup: Được tạo mỗi khi có thay đổi data
- Retention: Configurable qua `BACKUP_RETENTION_DAYS`
- Location: `./server/data/backups/`

## Bước 6: Security Best Practices

### 6.1 Firewall Configuration

```bash
# Ubuntu UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 6.2 Rate Limiting

- Default: 100 requests per 15 minutes
- Configurable qua `.env`
- Automatically blocks excessive requests

### 6.3 CORS Protection

- Chỉ allow specific domains
- No wildcard (\*) trong production
- Environment-based configuration

## Bước 7: Testing và Validation

### 7.1 Functional Testing

```bash
# Test API endpoints
curl -X GET https://yourdomain.com/api/meetings
curl -X POST https://yourdomain.com/api/meetings -H "Content-Type: application/json" -d '{"title":"Test Meeting"}'
```

### 7.2 Load Testing

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test with 100 concurrent requests
ab -n 1000 -c 100 https://yourdomain.com/api/meetings
```

### 7.3 Security Testing

- Test CORS policies
- Verify rate limiting
- Check SSL certificate
- Validate backup functionality

## Troubleshooting

### Common Issues:

1. **CORS Errors**:

   - Kiểm tra `ALLOWED_ORIGINS` trong `.env`
   - Ensure protocol (http/https) match

2. **Connection Timeout**:

   - Check firewall settings
   - Verify proxy configuration
   - Test network connectivity

3. **File Permission Errors**:

   - Ensure write permissions cho data directory
   - Check user/group ownership

4. **Rate Limiting Issues**:
   - Adjust `RATE_LIMIT_MAX_REQUESTS`
   - Check client request patterns

### Debugging Commands:

```bash
# Check server status
netstat -tlnp | grep :3000

# Test API connectivity
curl -v https://yourdomain.com/api/meetings

# Check logs
tail -f /var/log/nginx/error.log
pm2 logs meeting-room-app --lines 100
```

## Performance Optimization

### 7.1 Client-Side Caching

- Browser cache headers đã được set
- Service Worker có thể được thêm cho offline support

### 7.2 Server-Side Optimization

- Gzip compression enabled
- Static file serving optimized
- Connection pooling for database (nếu có)

### 7.3 CDN Integration

- Serve static assets qua CDN
- Reduce server load
- Improve global performance

---

**Lưu Ý Quan Trọng**:

- Backup data trước khi deploy
- Test thoroughly trong staging environment
- Monitor logs sau khi deploy
- Keep environment variables secure
- Regular security updates

**Support**:

- GitHub Issues cho technical support
- Documentation updates
- Community contributions welcome
