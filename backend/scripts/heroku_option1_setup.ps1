# Heroku Option 1 Setup Script (Provision + Seed Minimal Data)
# Usage: Run individual lines manually to observe output; avoid piping entire script blindly.
# Prerequisites: Heroku CLI logged in (`heroku login`), repo has heroku remote.

Write-Host "=== 1. Provision Postgres (skip if DATABASE_URL already set) ==="
heroku config:get DATABASE_URL | Out-Null
if (-not $?) {
  Write-Host "Checking DATABASE_URL failed; continuing" -ForegroundColor Yellow
}
$dbUrl = heroku config:get DATABASE_URL
if ($dbUrl) {
  Write-Host "DATABASE_URL already exists" -ForegroundColor Green
} else {
  heroku addons:create heroku-postgresql:hobby-dev --wait
}

Write-Host "=== 2. Run migrations against Postgres ==="
heroku run python backend/manage.py migrate

Write-Host "=== 3. Ensure VITE_API_URL env variable is set ==="
$vite = heroku config:get VITE_API_URL
if (-not $vite) {
  heroku config:set VITE_API_URL=https://gymflex-5bb1d582f94c.herokuapp.com/api
}

Write-Host "=== 4. Create secure admin (env-driven) ==="
if (-not (heroku config:get ADMIN_USERNAME)) {
  heroku config:set ADMIN_USERNAME=admin ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD="ChangeMe_StrongP@ss1"
}
heroku run python backend/manage.py create_default_admin

Write-Host "=== 5. Seed sessions (idempotent) ==="
# Seed sessions: read file content and pipe into shell (PowerShell cannot use '<' inside script reliably)
Get-Content backend/seed_sessions.py | heroku run python backend/manage.py shell

Write-Host "=== 6. Health check ==="
Invoke-RestMethod https://gymflex-5bb1d582f94c.herokuapp.com/api/health/ | ConvertTo-Json -Depth 4

Write-Host "=== 7. Done ===" -ForegroundColor Green
