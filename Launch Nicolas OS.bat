@echo off
title NICOLAS OS
cd /d "%~dp0"
echo Starting NICOLAS OS...
start "" /min cmd /c "timeout /t 1 >nul & start http://localhost:8787/index.html"
python -m http.server 8787
