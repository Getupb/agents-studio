@echo off
call "%~dp0stop-studio.cmd"
ping -n 4 127.0.0.1 >nul
start "" "%~dp0start-studio.cmd"