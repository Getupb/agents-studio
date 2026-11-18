param(
  [int]$Port = 3099,
  [string]$DshPath = ".\dsh"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Dsh = if ([IO.Path]::IsPathRooted($DshPath)) { $DshPath } else { Join-Path $Root $DshPath }

if (-not $env:SPARK_API_KEY -and -not $env:ZHIPU_API_KEY) {
  Write-Host "提示：没有检测到模型 Key。不影响启动，可以在工作台「设置 → 模型」里填写。" -ForegroundColor Yellow
}

if (-not (Test-Path -LiteralPath (Join-Path $Dsh "apps\cli\lib\bin.js"))) {
  throw "找不到 dsh：$Dsh\apps\cli\lib\bin.js"
}

if (-not $env:DSH_HOME) {
  $env:DSH_HOME = Join-Path $Root ".dsh-home"
}

$preset = Join-Path $Root "studio\profile\default-preset.yml"
if (-not (Test-Path -LiteralPath $preset)) {
  Write-Host "default-preset.yml 不存在，先运行预设生成器..."
  Push-Location $Dsh
  try { & node (Join-Path $Root "studio\patches\build-zero-preset.mjs") }
  finally { Pop-Location }
}

$overlay = Join-Path $Root "studio\overlay.yml"
Write-Host "启动 Agents Studio：http://127.0.0.1:$Port"
Write-Host "DSH_HOME=$env:DSH_HOME"

Push-Location $Dsh
try {
  & node "apps\cli\lib\bin.js" --profile studio --patch $overlay --patch $preset --port $Port
} finally {
  Pop-Location
}
