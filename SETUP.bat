@echo off
echo ===================================================
echo     CAI DAT HE THONG QUAN LY PHONG HOP
echo ===================================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [LỖI] Node.js chưa được cài đặt!
    echo Vui lòng tải và cài đặt Node.js từ: https://nodejs.org/
    pause
    exit /b 1
)

REM Navigate to server directory
cd /d "%~dp0server"

echo.
echo [1/3] Cài đặt các gói phụ thuộc...
echo.

REM Install dependencies
call npm install

if %errorlevel% neq 0 (
    echo.
    echo [THẤT BẠI] Không thể cài đặt các gói phụ thuộc.
    echo Vui lòng kiểm tra kết nối internet hoặc quyền truy cập thư mục.
    pause
    exit /b 1
)

echo.
echo [2/3] Thiết lập thư mục dữ liệu...
echo.

REM Create data directories if they don't exist
if not exist "data" mkdir data
if not exist "data\backups" mkdir data\backups

REM Initialize meetings.json if it doesn't exist
if not exist "data\meetings.json" (
    echo [] > data\meetings.json
    echo Đã khởi tạo tệp dữ liệu.
)

echo.
echo [3/3] Đăng ký dịch vụ tự động khởi động...
echo.

REM Create a Windows Task to auto-start the server
echo Tạo tác vụ tự động khởi động...

REM Create a temporary script file
echo $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -Command ""cd '%CD%'; npm start""" > "%TEMP%\create_task.ps1"
echo $trigger = New-ScheduledTaskTrigger -AtStartup >> "%TEMP%\create_task.ps1"
echo $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable >> "%TEMP%\create_task.ps1"
echo $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest >> "%TEMP%\create_task.ps1"
echo Register-ScheduledTask -TaskName "MeetingRoomServer" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force >> "%TEMP%\create_task.ps1"

REM Run the script with elevated privileges
powershell -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -File ""%TEMP%\create_task.ps1""' -Verb RunAs"

echo.
echo ===================================================
echo     CÀI ĐẶT HOÀN TẤT
echo ===================================================
echo.
echo Máy chủ sẽ tự động khởi động khi máy tính bật.
echo.
echo Để truy cập ứng dụng:
echo - Từ máy tính hiện tại: http://localhost:3000
echo - Từ máy tính khác: http://[IP_của_máy_tính_này]:3000
echo.
echo Địa chỉ IP của máy tính này:
powershell -Command "$addresses = Get-NetIPAddress | Where-Object {$_.AddressFamily -eq 'IPv4' -and $_.PrefixOrigin -ne 'WellKnown' -and $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*'}; foreach ($addr in $addresses) { Write-Output ('- ' + $addr.IPAddress + ' (' + $addr.InterfaceAlias + ')') }"
echo.
echo Bạn có muốn khởi động máy chủ ngay bây giờ không? (Y/N)
set /p start_now=

if /i "%start_now%"=="Y" (
    echo.
    echo Khởi động máy chủ...
    start cmd /c "cd /d "%~dp0server" && npm start"
    echo.
    echo Máy chủ đang chạy! Truy cập ứng dụng tại http://localhost:3000
)

echo.
echo Nhấn phím bất kỳ để thoát...
pause > nul
