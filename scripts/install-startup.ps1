param(
  [string]$ShortcutName = "Agents Studio.lnk"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Vbs = Join-Path $Root "scripts\start-studio-hidden.vbs"
if (-not (Test-Path -LiteralPath $Vbs)) {
  throw "找不到隐藏启动脚本：$Vbs"
}

$Startup = [Environment]::GetFolderPath("Startup")
$Shortcut = Join-Path $Startup $ShortcutName

$Wsh = New-Object -ComObject WScript.Shell
$Sc = $Wsh.CreateShortcut($Shortcut)
$Sc.TargetPath = Join-Path $env:SystemRoot "System32\wscript.exe"
$Sc.Arguments = '"' + $Vbs + '"'
$Sc.WorkingDirectory = $Root
$Sc.WindowStyle = 7
$Sc.Description = "Agents Studio hidden launcher"
$Sc.Save()

Write-Host "已加入开机启动：$Shortcut"
Write-Host "取消：pwsh ./scripts/uninstall-startup.ps1"