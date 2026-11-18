@echo off
setlocal enabledelayedexpansion
for %%I in ("%~dp0..") do set "ROOT=%%~fI"
set "PORT=3099"
set "FOUND=0"
set "SYS=%SystemRoot%\System32"
set "PATH=%SYS%;%PATH%"

rem 先让桌面 Helper 正常退出，避免任务栏留下幽灵图标。
set "NODE=%ROOT%\.runtime\node-v24.22.2-win-x64\node.exe"
if exist "%NODE%" goto :stop_helper
where.exe node >nul 2>&1
if errorlevel 1 goto :skip_stop_helper
set "NODE=node"
:stop_helper
if exist "%ROOT%\studio\scripts\stop-helper.mjs" (
  "%NODE%" "%ROOT%\studio\scripts\stop-helper.mjs"
)
:skip_stop_helper

for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
  if not "%%p"=="0" (
    echo [Agents Studio] 正在停止端口 %PORT% 上的进程 PID %%p ...
    taskkill /PID %%p /T /F >nul 2>&1
    set "FOUND=1"
  )
)

if "!FOUND!"=="0" (
  echo [Agents Studio] 端口 %PORT% 上没有监听进程，可能已经停止。
) else (
  echo [Agents Studio] 已停止。
)
echo.
ping -n 3 127.0.0.1 >nul