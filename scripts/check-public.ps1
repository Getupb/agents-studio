# 公开仓库发布前检查：密钥、个人路径、不该入库的目录。
# 用法：pwsh ./scripts/check-public.ps1
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (Test-Path -LiteralPath ".git")) {
  throw "当前目录不是 git 仓库。先 git init。"
}

$files = @(git ls-files)
if ($files.Count -eq 0) {
  Write-Host "没有已跟踪文件，跳过。"
  exit 0
}

$badPaths = @(
  '^\.dsh-home/',
  '^\.runtime/',
  '^dsh/',
  '^studio/vendor/',
  '^studio/profile/',
  '^node_modules/',
  '\.log$',
  '^start-studio\.cmd$',
  '^start-studio-hidden\.vbs$',
  '^studio/plugins/hello/'
)
$badFileHits = @()
foreach ($f in $files) {
  foreach ($pattern in $badPaths) {
    if ($f -match $pattern) { $badFileHits += "$f  (matched: $pattern)" }
  }
}

$secretPatterns = @(
  'ak-[A-Za-z0-9]{12,}',
  'sk-[A-Za-z0-9]{12,}',
  'apiKey\s*:\s*[A-Za-z0-9]{12,}',
  'token=[A-Za-z0-9_-]{20,}',
  'BEGIN (RSA|OPENSSH|EC) PRIVATE KEY',
  'C:\\Users\\[A-Za-z0-9._-]+'
)

$secretHits = @()
foreach ($f in $files) {
  if ($f -eq 'scripts/check-public.ps1') { continue }
  $path = Join-Path $Root $f
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { continue }
  $lines = Get-Content -LiteralPath $path -Encoding utf8 -ErrorAction SilentlyContinue
  $lineNo = 0
  foreach ($line in $lines) {
    $lineNo++
    foreach ($pattern in $secretPatterns) {
      if ($line -match $pattern) {
        $secretHits += "$f`:$lineNo  (matched: $pattern)"
        break
      }
    }
  }
}

if ($badFileHits.Count -eq 0 -and $secretHits.Count -eq 0) {
  Write-Host "通过：已跟踪文件里没有发现密钥、个人路径或运行数据目录。" -ForegroundColor Green
  exit 0
}

if ($badFileHits.Count -gt 0) {
  Write-Host "发现不应入库的路径：" -ForegroundColor Red
  $badFileHits | ForEach-Object { Write-Host "  $_" }
}
if ($secretHits.Count -gt 0) {
  Write-Host "发现疑似密钥 / 个人路径：" -ForegroundColor Red
  $secretHits | ForEach-Object { Write-Host "  $_" }
}
exit 1
