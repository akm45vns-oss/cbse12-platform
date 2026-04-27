@echo off
REM Smart Study Hub - Groq MCQ & Notes Generator Quick Start
REM Run this script to start generating MCQs for your courses

setlocal enabledelayedexpansion

echo.
echo ========================================
echo  Smart Study Hub MCQ Generator
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if .env exists
if not exist ".env" (
    echo Error: .env file not found
    echo Please create .env with GROQ_API_KEY=your_api_key
    pause
    exit /b 1
)

REM Check if groq_mcq_generator.py exists
if not exist "backend\scripts\groq_mcq_generator.py" (
    echo Error: groq_mcq_generator.py not found
    pause
    exit /b 1
)

echo Checking environment...
cd backend\scripts

echo.
echo Starting MCQ Generation...
echo.

REM Get user input for options
echo Choose an option:
echo 1. Generate MCQs for ALL courses (recommended first run)
echo 2. Generate for a specific course
echo 3. Generate for a specific unit
echo 4. Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo Generating MCQs for all courses...
    echo This may take 20-30 minutes depending on course size.
    echo.
    python groq_mcq_generator.py
) else if "%choice%"=="2" (
    echo.
    echo Available courses:
    echo 1. Python Programming
    echo 2. Computer Networks
    echo 3. Object Oriented Programming (C++)
    echo 4. Data Visualization
    echo 5. Machine Learning
    echo.
    set /p course="Enter course name: "
    echo.
    echo Generating MCQs for: !course!
    python groq_mcq_generator.py --course "!course!"
) else if "%choice%"=="3" (
    echo.
    set /p course="Enter course name: "
    set /p unit="Enter unit name: "
    echo.
    echo Generating MCQs for: !course! - !unit!
    python groq_mcq_generator.py --course "!course!" --unit "!unit!"
) else if "%choice%"=="4" (
    echo Exiting...
    exit /b 0
) else (
    echo Invalid choice
    pause
    exit /b 1
)

echo.
echo ========================================
echo Generation Complete!
echo ========================================
echo.
pause
