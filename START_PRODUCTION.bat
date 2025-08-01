@echo off
echo ####################
echo Meeting Room Management System
echo Starting PRODUCTION Environment
echo WARNING: Production mode enabled
echo ####################

cd server
set NODE_ENV=production
echo Loading production configuration...
echo Data directory: /var/data/meeting-room
echo Security: STRICT
echo Rate limiting: ENABLED
echo ####################

node server.js

pause
