@ECHO OFF
CALL KILLALL node > nul 2> nul
CALL SLEEP 3
CALL DEL %~dp0db\db.sqlite > nul 2> nul 
CALL SLEEP 3
CALL node start.js thumbs 
CALL node start.js aggregate
CALL node start.js
