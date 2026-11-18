param(
  [string]$ShortcutName = "Agents Studio.lnk"
)

$ErrorActionPreference = "Stop"
$Startup = [Environment]::GetFolderPath("Startup")
$Shortcut = Join-Path $Startup $ShortcutName

if (Test-Path -LiteralPath $Shortcut) {
  Remove-Item -LiteralPath $Shortcut -Force
  Write-Host "已取消开机启动：$Shortcut"
} else {
  Write-Host "没有找到开机启动快捷方式：$Shortcut"
}