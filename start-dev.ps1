# start-dev.ps1
# Launch backend (with venv) and frontend dev server in separate PowerShell windows.
# Run this from the repository root.

Set-StrictMode -Version Latest

try {
    # Start backend in new PowerShell window
    Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd backend; Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force; & ..\env\Scripts\Activate.ps1; python manage.py runserver'
} catch {
    Write-Host "Failed to start backend: $_"
}

try {
    # Start frontend dev server in new PowerShell window
    Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd frontend; npm install --no-audit --no-fund; npm run dev'
} catch {
    Write-Host "Failed to start frontend: $_"
}

Write-Host 'Launched backend and frontend windows (or printed errors above).'
