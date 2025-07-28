@echo off
echo ===================================================
echo     KHOI DONG HE THONG QUAN LY PHONG HOP
echo ===================================================
echo.

REM Navigate to server directory
cd /d "%~dp0server"

echo Khởi động máy chủ...
echo.
echo Địa chỉ truy cập:
echo - Từ máy tính hiện tại: http://localhost:3000
echo - Từ máy tính khác: http://[IP_của_máy_tính_này]:3000
echo.
echo Địa chỉ IP của máy tính này:
powershell -Command "Get-NetIPAddress | Where-Object {$_.AddressFamily -eq 'IPv4' -and $_.PrefixOrigin -ne 'WellKnown'} | ForEach-Object { $_.IPAddress }"
echo.
echo Nhấn Ctrl+C để dừng máy chủ.
echo.

npm start
