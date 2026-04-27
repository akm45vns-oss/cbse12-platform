@echo off
REM Smart Study Hub - Background MCQ Generator
REM Launches the generator as a detached process that survives disconnection

setlocal enabledelayedexpansion

echo.
echo ==================================================
echo Background MCQ Generator Launcher
echo ==================================================
echo.

REM Get script directory
set SCRIPT_DIR=%~dp0
set GENERATOR_SCRIPT=%SCRIPT_DIR%background_mcq_generator.py
set LOG_DIR=%SCRIPT_DIR%logs

REM Create logs directory
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Check if generator script exists
if not exist "%GENERATOR_SCRIPT%" (
    echo ERROR: Generator script not found at %GENERATOR_SCRIPT%
    pause
    exit /b 1
)

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo Starting background MCQ generation...
echo Script: %GENERATOR_SCRIPT%
echo.

REM Get current date/time for unique log file
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)

set LOG_FILE=%LOG_DIR%\background_generation_%mydate%_%mytime%.log

REM Start Python process in background using WScript
set VBSCRIPT=%TEMP%\launcher_%RANDOM%.vbs
(
    echo Set objShell = CreateObject("WScript.Shell"^)
    echo strCommand = "cmd /c python ""%GENERATOR_SCRIPT%"" ^>^> ""%LOG_FILE%"" 2^>^&1"
    echo objShell.Run strCommand, 0, False
) > "%VBSCRIPT%"

REM Execute VBScript (runs Python in background)
cscript.exe //Nologo "%VBSCRIPT%"
set RESULT=%ERRORLEVEL%

REM Cleanup VBScript
del "%VBSCRIPT%" 2>nul

if %RESULT% equ 0 (
    echo.
    echo ✓ Background process started successfully!
    echo.
    echo Logs will be saved to:
    echo   %LOG_FILE%
    echo.
    echo The process will continue running even after closing this window!
    echo It will survive:
    echo   ✓ Laptop closure
    echo   ✓ Internet disconnection
    echo   ✓ Terminal window closure
    echo.
    echo To check progress (in PowerShell):
    echo   Get-Content "%LOG_FILE%" -Tail 50
    echo.
    echo To check progress (in Command Prompt):
    echo   type "%LOG_FILE%"
    echo.
    echo Progress file:
    echo   %SCRIPT_DIR%generation_progress.json
    echo.
) else (
    echo ERROR: Failed to start background process
    pause
    exit /b 1
)

timeout /t 3 /nobreak
