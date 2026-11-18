@echo off
chcp 65001 >nul
setlocal
for %%I in ("%~dp0..") do set "ROOT=%%~fI"
set "PORT=3099"
set "PATH=%ROOT%\.runtime\node-v24.22.2-win-x64;%PATH%"
if "%DSH_HOME%"=="" set "DSH_HOME=%ROOT%\.dsh-home"

if not exist "%ROOT%\dsh\apps\cli\lib\bin.js" (
  echo.
  echo [Agents Studio] 找不到 dsh 构建产物。
  echo 请先按 README 的“手动安装”或让 AI 按提示词完成 dsh 克隆与构建。
  echo.
  pause
  exit /b 1
)

if not defined SPARK_API_KEY (
  echo.
  echo [Agents Studio] 还没有设置 SPARK_API_KEY。
  echo 请在 Windows 用户环境变量里添加这个变量，值由你的模型平台提供。
  echo 设置后重新打开这个窗口。
  echo.
  pause
  exit /b 1
)
if not defined ZHIPU_API_KEY (
  echo.
  echo [Agents Studio] 还没有设置 ZHIPU_API_KEY。
  echo 请在 Windows 用户环境变量里添加这个变量，值由你的模型平台提供。
  echo 设置后重新打开这个窗口。
  echo.
  pause
  exit /b 1
)

cd /d "%ROOT%\dsh"

echo.
echo ============================================================
echo  Agents Studio 正在启动：http://127.0.0.1:%PORT%
echo  启动后会打印一个带 token 的链接，请使用本次链接。
echo  token 每次启动都会变，旧链接会返回 401。
echo  这个窗口不要关闭；关闭窗口就会停止服务。
echo ============================================================
echo.

node apps\cli\lib\bin.js --profile studio --patch "%ROOT%\studio\overlay.yml" --patch "%ROOT%\studio\profile\default-preset.yml" --port %PORT% %*

set "CODE=%ERRORLEVEL%"
echo.
if not "%CODE%"=="0" echo [Agents Studio] 退出码：%CODE% - 请查看上面的错误信息。
echo 服务已停止。按任意键关闭窗口。
pause >nul