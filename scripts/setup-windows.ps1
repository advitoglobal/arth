# Duplicate the other Windows laptop: env, packages, Postgres, migrations, prove.
$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

function Require-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    Write-Error "Missing $name. Install it, then run this script again."
  }
}

Require-Command git
Require-Command node
Require-Command npm
Require-Command docker

$nodeMajor = [int]((node -v).TrimStart("v").Split(".")[0])
if ($nodeMajor -lt 22) {
  Write-Error "Node 22 is required. This machine has $(node -v)."
}

docker info | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Error "Docker Desktop is not running. Start it, wait until it is ready, then run this script again."
}

if (-not (Test-Path .env.local)) {
  Copy-Item .env.example .env.local
  Write-Host "Wrote .env.local from .env.example"
}

npm ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run db:migrate-docker
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run prove
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "This machine now matches the shared Windows setup."
Write-Host "Start the floor with: npm run dev"
Write-Host "Then open http://127.0.0.1:43127/w/login  password arth-demo  user iyer"
