param(
  [string]$DshPath = ".\dsh",
  [string]$ProfileName = "studio",
  [switch]$SkipGenerate
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Dsh = if ([IO.Path]::IsPathRooted($DshPath)) { $DshPath } else { Join-Path $Root $DshPath }
$Profile = Join-Path $Root ".dsh-home\profiles\$ProfileName"
$NodeModules = Join-Path $Profile "node_modules"

Write-Host "Agents Studio bootstrap" -ForegroundColor Cyan
Write-Host "root: $Root"

if (-not (Test-Path -LiteralPath (Join-Path $Dsh "apps\cli\lib\bin.js"))) {
  throw "找不到 dsh 构建产物：$Dsh\apps\cli\lib\bin.js。请先按 docs/install.md 构建上游 dsh。"
}

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { throw "找不到 node。请安装 Node.js >= 24.9。" }

New-Item -ItemType Directory -Path $Profile -Force | Out-Null
New-Item -ItemType Directory -Path $NodeModules -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $Root "studio\profile") -Force | Out-Null

$plugins = @("brand", "settings-entry", "pet-settings", "preset-settings")
foreach ($name in $plugins) {
  $source = Join-Path $Root "studio\plugins\$name"
  if (-not (Test-Path -LiteralPath $source)) { Write-Warning "跳过不存在的插件：$source"; continue }
  $link = Join-Path $NodeModules "studio-$name"
  if (Test-Path -LiteralPath $link) {
    Write-Host "已存在，跳过：$link"
  } else {
    New-Item -ItemType Junction -Path $link -Target $source | Out-Null
    Write-Host "已挂载：studio-$name"
  }
}

$copies = @(
  @{ From = "config\cordis.patch.example.yml"; To = Join-Path $Profile "cordis.patch.yml" },
  @{ From = "config\preset-settings.example.json"; To = Join-Path $Root "studio\profile\preset-settings.json" }
)
foreach ($item in $copies) {
  $from = Join-Path $Root $item.From
  $to = $item.To
  if (Test-Path -LiteralPath $to) {
    Write-Host "已存在，不覆盖：$to"
  } else {
    Copy-Item -LiteralPath $from -Destination $to
    Write-Host "已写入：$to"
  }
}

if (-not $SkipGenerate) {
  $generator = Join-Path $Root "studio\patches\build-zero-preset.mjs"
  if (Test-Path -LiteralPath $generator) {
    Write-Host "生成默认预设..."
    Push-Location $Dsh
    try {
      & node $generator
    } catch {
      Write-Warning "预设生成失败：$($_.Exception.Message)。修正后运行 node studio/patches/build-zero-preset.mjs。"
    } finally {
      Pop-Location
    }
  }
}

Write-Host ""
Write-Host "下一步：" -ForegroundColor Green
Write-Host "  1. 运行 pwsh ./scripts/start-studio.ps1 或双击 scripts\start-studio.cmd"
Write-Host "  2. 打开工作台后，在「设置 → 模型」里填写自己的 API Key（不需要设置 Windows 环境变量）"
Write-Host "  3. 如使用桌宠/微信，按 docs/pet.md 安装 dsh-pet 0.4.7"
