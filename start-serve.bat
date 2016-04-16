@ECHO OFF
CALL KILLALL node > nul 2> nul
CALL SLEEP 3
CALL node start.js
