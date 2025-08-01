@echo off
echo ####################
echo Meeting Room Management System
echo Starting DEVELOPMENT Environment
echo ####################

cd server
set NODE_ENV=development
echo Loading development configuration...
echo Data directory: ./data
echo Debug mode: ON
echo CORS: Relaxed for local network
echo ####################

node server.js

pause
