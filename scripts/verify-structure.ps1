# Verify bootstrap layout (no business modules required yet)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$required = @(
  'apps\web',
  'apps\api',
  'packages\shared',
  'packages\config',
  'docs',
  'docker',
  'scripts',
  'tests',
  '.github',
  'storage\uploads',
  'docker\docker-compose.yml',
  'docker\Dockerfile.api',
  'docker\Dockerfile.web'
)
foreach ($rel in $required) {
  $path = Join-Path $root $rel
  if (-not (Test-Path $path)) { throw "Missing: $rel" }
}
Write-Host 'MVP-001 structure OK'
