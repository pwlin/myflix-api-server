@ECHO OFF
CALL KILLALL node > nul 2> nul
CALL DEL %~dp0db\db.sqlite > nul 2> nul 
CALL node start.js thumbs 
CALL node start.js aggregate
CALL node start.js
