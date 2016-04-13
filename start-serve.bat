@ECHO OFF
CALL KILLALL node > nul 2> nul
CALL node start.js
