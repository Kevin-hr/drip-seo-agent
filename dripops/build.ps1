$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$project = Join-Path $projectRoot 'src\DripOps\DripOps.csproj'
$dist = Join-Path $projectRoot 'dist'

dotnet publish $project `
  -c Release `
  -r win-x64 `
  --self-contained true `
  -p:PublishSingleFile=true `
  -p:PublishTrimmed=false `
  -p:DebugType=None `
  -p:DebugSymbols=false `
  -o $dist

New-Item -ItemType Directory -Force -Path (Join-Path $dist 'config') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $dist 'standards') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $dist 'schemas') | Out-Null
Copy-Item -LiteralPath (Join-Path $projectRoot 'config\dripops.example.json') -Destination (Join-Path $dist 'config\dripops.example.json') -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'config\dripops.json') -Destination (Join-Path $dist 'config\dripops.json') -Force
Remove-Item -LiteralPath (Join-Path $dist 'standards\SEO-PDP-3.1.1.json') -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $dist 'standards\SEO-PDP-3.1.1.yaml') -Force -ErrorAction SilentlyContinue
Copy-Item -LiteralPath (Join-Path $projectRoot 'standards\SEO-PDP-3.2.json') -Destination (Join-Path $dist 'standards\SEO-PDP-3.2.json') -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'standards\SEO-PDP-3.2.yaml') -Destination (Join-Path $dist 'standards\SEO-PDP-3.2.yaml') -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'standards\SEO-PDP-V4.4.json') -Destination (Join-Path $dist 'standards\SEO-PDP-V4.4.json') -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'standards\Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md') -Destination (Join-Path $dist 'standards\Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md') -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'schemas\*.json') -Destination (Join-Path $dist 'schemas') -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'README.md') -Destination (Join-Path $dist 'README.md') -Force

& (Join-Path $dist 'DripOps.exe') self-test
if ($LASTEXITCODE -ne 0) { throw 'Published executable self-test failed.' }

Write-Host "DripOps build complete: $(Join-Path $dist 'DripOps.exe')"
