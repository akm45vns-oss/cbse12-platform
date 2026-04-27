# Smart Study Hub - Background MCQ Generator (PowerShell)
# Runs the MCQ generator as a detached background process
# Survives laptop closure and internet disconnection

param(
    [string]$Course = "",
    [float]$Temperature = 0.7
)

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$generatorScript = Join-Path $scriptPath "background_mcq_generator.py"
$pythonExe = (Get-Command python).Source

Write-Host "=================================================="
Write-Host "Background MCQ Generator Launcher"
Write-Host "=================================================="
Write-Host ""

if (-not (Test-Path $generatorScript)) {
    Write-Host "ERROR: Generator script not found at $generatorScript" -ForegroundColor Red
    exit 1
}

if (-not $pythonExe) {
    Write-Host "ERROR: Python not found. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

Write-Host "Starting background MCQ generation..." -ForegroundColor Green
Write-Host "Script: $generatorScript"
Write-Host "Python: $pythonExe"
Write-Host ""

# Build command arguments
$arguments = @($generatorScript)
if ($Course) {
    $arguments += "--course"
    $arguments += $Course
}
if ($Temperature) {
    $arguments += "--temperature"
    $arguments += $Temperature
}

# Start as detached process (survives script closure)
try {
    $process = Start-Process -FilePath $pythonExe `
                             -ArgumentList $arguments `
                             -NoNewWindow `
                             -PassThru `
                             -RedirectStandardOutput "$scriptPath\logs\stdout.log" `
                             -RedirectStandardError "$scriptPath\logs\stderr.log"
    
    Write-Host ""
    Write-Host "✓ Background process started successfully!" -ForegroundColor Green
    Write-Host "  Process ID: $($process.Id)"
    Write-Host "  Status: RUNNING"
    Write-Host ""
    Write-Host "Logs will be saved to:"
    Write-Host "  - $scriptPath\logs\*.log"
    Write-Host "  - Progress: $scriptPath\generation_progress.json"
    Write-Host ""
    Write-Host "The process will continue running even after closing this window!"
    Write-Host "It will survive:"
    Write-Host "  ✓ Laptop closure"
    Write-Host "  ✓ Internet disconnection"
    Write-Host "  ✓ Terminal window closure"
    Write-Host ""
    Write-Host "To check progress:"
    Write-Host "  Get-Content '$scriptPath\logs\mcq_generation_*.log' -Tail 20"
    Write-Host ""
    Write-Host "To stop the process:"
    Write-Host "  taskkill /PID $($process.Id) /F"
    Write-Host ""
}
catch {
    Write-Host "ERROR: Failed to start background process" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}
