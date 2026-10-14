# Agent Dashboard autostart — idempotent
# If local server.js (port 3737) is down, start it + sync-to-cloud.js detached.
# Safe to run on every Claude Code SessionStart.

$ErrorActionPreference = 'SilentlyContinue'
$root = 'C:\AI\agent-dashboard'
$log  = Join-Path $root 'autostart.log'
$ts   = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

function Log($msg) { Add-Content -Path $log -Value "[$ts] $msg" }

# Is the local server already up?
$alive = $false
try {
  $r = Invoke-WebRequest -Uri 'http://localhost:3737/api/health' -TimeoutSec 2 -UseBasicParsing
  if ($r.StatusCode -eq 200) { $alive = $true }
} catch { }

if ($alive) {
  Log 'server.js already running on :3737, skip'
  exit 0
}

# Health failed — before launching a fresh pair, sweep stale node processes
# (server.js / sync-to-cloud.js / concurrently / vite) so they don't accumulate.
$killer = 'C:\AI\scripts\kill-orphans-agent-dashboard.ps1'
if (Test-Path $killer) {
  try { & $killer; Log 'kill-orphans-agent-dashboard.ps1 ran' } catch { Log "kill-orphans failed: $_" }
}

# If something still holds :3737 (unhealthy server stuck without responding to /api/health),
# kill the listener directly so the new server.js can bind.
$listener = Get-NetTCPConnection -LocalPort 3737 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
  foreach ($c in $listener) {
    try { Stop-Process -Id $c.OwningProcess -Force -ErrorAction Stop; Log "killed stale :3737 listener PID $($c.OwningProcess)" } catch { }
  }
  Start-Sleep -Seconds 1
}

Log 'server.js not responding — starting detached stack'

# Launch server.js detached (hidden window, logs to server.log)
Start-Process -FilePath 'node' `
  -ArgumentList 'server.js' `
  -WorkingDirectory $root `
  -WindowStyle Hidden `
  -RedirectStandardOutput (Join-Path $root 'server.log') `
  -RedirectStandardError  (Join-Path $root 'server.err')

# Give server a couple seconds to bind port before sync starts hammering it
Start-Sleep -Seconds 3

# Sync only while the cloud copy answers. The Fly machine was stopped on
# 2026-06-24 to cut cost, and a sync against it logged "fetch failed" every
# 2 seconds for months. Any HTTP answer counts as up; no answer means skip.
$remote = ''
$envLine = Get-Content (Join-Path $root '.env') | Where-Object { $_ -match '^REMOTE_URL=' } | Select-Object -First 1
if ($envLine) { $remote = ($envLine -replace '^REMOTE_URL=', '').Trim().Trim('"') }
$cloudUp = $false
if ($remote) {
  try {
    Invoke-WebRequest -Uri $remote -TimeoutSec 5 -UseBasicParsing | Out-Null
    $cloudUp = $true
  } catch {
    if ($_.Exception.Response) { $cloudUp = $true }
  }
}

if (-not $cloudUp) {
  Log "server.js launched; cloud '$remote' not answering - sync skipped"
  exit 0
}

# Launch sync-to-cloud.js detached
Start-Process -FilePath 'node' `
  -ArgumentList 'sync-to-cloud.js' `
  -WorkingDirectory $root `
  -WindowStyle Hidden `
  -RedirectStandardOutput (Join-Path $root 'sync.log') `
  -RedirectStandardError  (Join-Path $root 'sync.err')

Log 'server.js + sync-to-cloud.js launched'
