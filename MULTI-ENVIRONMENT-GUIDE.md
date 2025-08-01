# Multi-Environment Deployment Guide

## Meeting Room Management System

### Tổng quan về Multi-Environment

Hệ thống hiện đã được cấu hình để hỗ trợ 3 môi trường chính:

1. **Development** - Phát triển local
2. **Local Test** - Test trên mạng nội bộ
3. **Production** - Private Cloud

---

## 🔧 Cấu hình Môi trường

### 1. Development Environment

**File:** `.env.development`

- **Mục đích:** Phát triển tính năng mới trên máy cá nhân
- **Data Directory:** `./data` (relative path)
- **CORS:** Relaxed cho localhost
- **Rate Limiting:** 5000 requests/15min
- **Debug Mode:** Enabled
- **Security:** Minimal

### 2. Local Test Environment

**File:** `.env.local`

- **Mục đích:** Test trên mạng nội bộ với nhiều thiết bị
- **Data Directory:** `./data` (Windows compatible)
- **CORS:** Cho phép multiple local IPs
- **Rate Limiting:** 5000 requests/15min
- **Debug Mode:** Enabled
- **Security:** Relaxed for testing

### 3. Production Environment

**File:** `.env.production`

- **Mục đích:** Triển khai lên private cloud
- **Data Directory:** `/var/data/meeting-room` (absolute path)
- **CORS:** Strict domain-based
- **Rate Limiting:** 1000 requests/15min
- **Security:** Full security headers
- **SSL:** HTTPS required

---

## 🚀 Cách Khởi động

### Option 1: Sử dụng Batch Files

```batch
# Development
START_DEVELOPMENT.bat

# Local Network Test
START_LOCAL_TEST.bat

# Production
START_PRODUCTION.bat
```

### Option 2: Sử dụng NPM Scripts

```bash
# Development
cd server
npm run dev

# Local Test
npm run local

# Production
npm run prod
```

### Option 3: VS Code Tasks

```bash
# Sử dụng Command Palette (Ctrl+Shift+P)
# Gõ "Tasks: Run Task"
# Chọn "Start Server"
```

---

## 🔍 Environment Detection Logic

Server sẽ tự động load cấu hình theo thứ tự:

1. `.env.${NODE_ENV}.local` (ví dụ: `.env.development.local`)
2. `.env.${NODE_ENV}` (ví dụ: `.env.development`)
3. `.env.local`
4. `.env` (fallback)

---

## 🌐 Network Access URLs

### Development Mode

- Local: `http://localhost:3000`
- Same machine: `http://127.0.0.1:3000`

### Local Test Mode

- Local: `http://localhost:3000`
- Network: `http://192.168.1.47:3000`
- Network: `http://192.168.1.99:3000`
- Network: `http://192.168.1.100:3000`

### Production Mode

- Domain: `https://your-domain.com`
- App: `https://app.your-domain.com`

---

## 📊 Key Differences Between Environments

| Feature          | Development    | Local Test | Production               |
| ---------------- | -------------- | ---------- | ------------------------ |
| Data Path        | `./data`       | `./data`   | `/var/data/meeting-room` |
| Rate Limit       | 5000/15min     | 5000/15min | 1000/15min               |
| CORS             | Localhost only | Local IPs  | Strict domains           |
| Cache            | 5min           | 5min       | 1 hour                   |
| Security Headers | None           | Basic      | Full                     |
| SSL              | HTTP           | HTTP       | HTTPS                    |
| Debug Logs       | Yes            | Yes        | No                       |

---

## 🔒 Security Considerations

### Development

- No security headers
- Debug information visible
- Relaxed CORS

### Local Test

- Basic security
- Local network CORS
- Debug for troubleshooting

### Production

- Full security headers
- Strict CORS policy
- HTTPS required
- Rate limiting
- No debug information

---

## 📝 Migration Steps

### Từ Local Test → Production

1. **Update DNS/Domain:**

   ```bash
   # .env.production
   ALLOWED_ORIGINS=https://your-actual-domain.com
   ```

2. **Update Data Directory:**

   ```bash
   # Ensure server has access to /var/data/meeting-room
   sudo mkdir -p /var/data/meeting-room
   sudo chown -R appuser:appuser /var/data/meeting-room
   ```

3. **Copy Data:**

   ```bash
   # Copy from local ./data to /var/data/meeting-room
   scp -r ./data/* user@server:/var/data/meeting-room/
   ```

4. **Update Session Secret:**
   ```bash
   # Generate secure secret
   SESSION_SECRET=your-secure-random-string-here
   ```

---

## 🧪 Testing Strategy

### 1. Local Development

- Test basic functionality
- Debug new features
- UI/UX development

### 2. Local Network Test

- Multi-device booking
- Concurrent user testing
- Network performance
- Data synchronization

### 3. Production Deployment

- Security testing
- Performance under load
- Backup/restore procedures
- SSL/HTTPS verification

---

## 🛠️ Troubleshooting

### Environment Not Loading

```bash
# Check current environment
node -e "console.log(process.env.NODE_ENV)"

# Force environment
set NODE_ENV=development && node server.js
```

### CORS Issues

```bash
# Check allowed origins in logs
# Add your IP to ALLOWED_ORIGINS in appropriate .env file
```

### Data Directory Issues

```bash
# Windows: Use relative paths (./data)
# Linux: Use absolute paths (/var/data/meeting-room)
```

---

## 📋 Deployment Checklist

### Before Production Deploy

- [ ] Update ALLOWED_ORIGINS with actual domains
- [ ] Generate secure SESSION_SECRET
- [ ] Test with production data directory
- [ ] Verify SSL certificate
- [ ] Test rate limiting
- [ ] Backup existing data
- [ ] Test restore procedures

### After Production Deploy

- [ ] Monitor logs for errors
- [ ] Test all booking functions
- [ ] Verify multi-user access
- [ ] Check performance metrics
- [ ] Test backup automation
