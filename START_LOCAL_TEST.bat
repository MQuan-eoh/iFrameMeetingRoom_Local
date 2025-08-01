@echo off
echo ####################
echo Meeting Room Management System
echo Starting LOCAL TEST Environment
echo ####################

cd server
set NODE_ENV=local
echo Loading local test configuration...
echo Data directory: ./data
echo Network test mode: ON
echo Multiple IP support: ENABLED
echo ####################

node server.js

pause
