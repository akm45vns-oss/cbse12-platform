# Smart Study Hub - Background MCQ Generation Setup Guide

## Three Ways to Run in Background

### 1. ⚡ Quick Start (Easiest)

**Windows Command Prompt or PowerShell:**
```bash
cd c:\Users\akm45\Desktop\smart_study_hub\backend\scripts
start_background.bat
```

**Benefits:**
- ✅ One-click launch
- ✅ Survives window closure
- ✅ Survives disconnection (mostly)
- ✅ Logs all output

---

## 2. 🔷 PowerShell (More Control)

**Launch in PowerShell:**
```powershell
# Set execution policy (one-time setup)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run the launcher
& 'c:\Users\akm45\Desktop\smart_study_hub\backend\scripts\start_background.ps1'

# Or with specific options
& 'c:\Users\akm45\Desktop\smart_study_hub\backend\scripts\start_background.ps1' -Course "Python Programming" -Temperature 0.8
```

**Features:**
- Better process control
- Real-time monitoring
- Process ID tracking

**Check progress in real-time:**
```powershell
Get-Content "c:\Users\akm45\Desktop\smart_study_hub\backend\scripts\logs\*.log" -Tail 20 -Wait
```

---

## 3. 👑 Windows Scheduled Task (Most Robust)

This is the **most reliable** method - survives everything including system restarts.

### Setup Steps

#### Option A: Using Command Line (Fastest)

1. **Open Command Prompt as Administrator**
   - Press `Win + X`, select "Command Prompt (Admin)"
   - Or search for "cmd", right-click → "Run as administrator"

2. **Create the scheduled task:**
```batch
cd c:\Users\akm45\Desktop\smart_study_hub\backend\scripts

schtasks /create /tn "SmartStudyHub-MCQGenerator" ^
  /tr "python background_mcq_generator.py" ^
  /sc once /st 00:00 ^
  /sd 01/01/2025 ^
  /rl highest ^
  /f
```

3. **Start the task:**
```batch
schtasks /run /tn "SmartStudyHub-MCQGenerator"
```

4. **Monitor progress:**
```batch
cd backend\scripts\logs
dir /s *.log
type mcq_generation_*.log
```

#### Option B: Using GUI (Visual)

1. **Open Task Scheduler**
   - Press `Win + R`, type `taskscheduler.msc`, press Enter
   - Or search for "Task Scheduler" in Windows menu

2. **Create New Task** (Right-click "Task Scheduler Library" → "Create Task")

3. **General Tab:**
   - Name: `SmartStudyHub-MCQGenerator`
   - Description: `Generates MCQs and notes using Groq API`
   - ☑️ Check "Run with highest privileges"
   - ☑️ Check "Run whether user is logged in or not"
   - Configure for: `Windows 10` (or your version)

4. **Triggers Tab** → Click "New..."
   - Begin the task: `On a schedule`
   - Recurrence: `One time` (or `Daily` if you want it to repeat)
   - Start: Set to a preferred time
   - ☑️ Enabled

5. **Actions Tab** → Click "New..."
   - Action: `Start a program`
   - Program/script: `C:\Users\akm45\AppData\Roaming\Python\Python314\python.exe`
     (Or just `python` if in PATH)
   - Add arguments: `background_mcq_generator.py`
   - Start in: `C:\Users\akm45\Desktop\smart_study_hub\backend\scripts`

6. **Conditions Tab:**
   - Uncheck "Start the task only if the computer is on AC power"
   - Uncheck "Stop if the computer switches to battery power"

7. **Settings Tab:**
   - Check "If the task fails, restart every" → `1 minute`
   - Set "Attempt to restart up to" → `5` times
   - Check "If the task is still running after" → `2 days`
   - Check "Run task as soon as possible after a scheduled start is missed"

8. **Click OK** and provide Windows password when prompted

### Monitor Scheduled Task

**Check task status:**
```batch
schtasks /query /tn "SmartStudyHub-MCQGenerator" /v
```

**Stop the task:**
```batch
schtasks /end /tn "SmartStudyHub-MCQGenerator"
```

**Delete the task:**
```batch
schtasks /delete /tn "SmartStudyHub-MCQGenerator" /f
```

---

## 📊 Monitoring Progress

### Check Real-Time Logs

**PowerShell (live tail):**
```powershell
Get-Content "c:\Users\akm45\Desktop\smart_study_hub\backend\scripts\logs\*.log" -Tail 20 -Wait
```

**Command Prompt (last 20 lines):**
```batch
powershell -Command "Get-Content 'c:\Users\akm45\Desktop\smart_study_hub\backend\scripts\logs\*.log' -Tail 20"
```

**View latest log file:**
```batch
cd c:\Users\akm45\Desktop\smart_study_hub\backend\scripts\logs
dir /B /O:-D *.log
type [FILENAME].log
```

### Check Progress JSON

```batch
cd c:\Users\akm45\Desktop\smart_study_hub\backend\scripts
type generation_progress.json
```

Example output:
```json
{
  "start_time": "2026-04-06T10:30:00.123456",
  "last_update": "2026-04-06T11:45:30.654321",
  "completed_topics": [
    {
      "id": 1,
      "name": "Introduction to Python",
      "timestamp": "2026-04-06T10:35:00",
      "questions": 30
    }
  ],
  "failed_topics": [],
  "total_topics": 44,
  "total_questions": 450
}
```

---

## ✅ What Survives

### ✓ Method 1 (start_background.bat)
- ✅ Window closure
- ✅ Terminal exit
- ⚠️ Internet disconnection (will retry automatically)
- ❌ System restart

### ✓ Method 2 (PowerShell)
- ✅ Window closure
- ✅ Terminal exit
- ⚠️ Internet disconnection (will retry automatically)
- ❌ System restart

### ✓ Method 3 (Scheduled Task) ⭐ **BEST**
- ✅ Window closure
- ✅ Terminal exit
- ✅ Internet disconnection (will retry automatically)
- ✅ System restart
- ✅ Laptop sleep/wake

---

## 🛠️ Recommendation

For maximum reliability, use **Windows Scheduled Task (Method 3)**:
1. Set it to run at a specific time (e.g., late night)
2. Enable "Run with highest privileges"
3. Set restart policy on failure
4. It will run even if you're away

For quick testing, use **start_background.bat (Method 1)**:
1. Click and forget
2. Check logs whenever you want
3. Lightweight setup

---

## 🔄 Resume Functionality

The generator automatically:
- ✅ Tracks progress in `generation_progress.json`
- ✅ Skips already-completed topics
- ✅ Resumes from where it left off
- ✅ Logs all failures for retry
- ✅ Retries failed topics on next run

**Manual resume:**
```bash
cd backend\scripts
python background_mcq_generator.py
```

It will detect completed topics and skip them.

---

## 📁 Generated Files

After running, check these files:

```
backend/scripts/
├── generation_progress.json          # Overall progress
├── logs/
│   ├── mcq_generation_20260406_103000.log
│   ├── mcq_generation_20260406_125000.log
│   └── ...
└── background_mcq_generator.py       # Main script
```

---

## ❌ Troubleshooting

### Process doesn't seem to be running

1. Check logs:
   ```bash
   dir backend\scripts\logs\
   ```

2. Check if Python process exists:
   ```bash
   tasklist | find "python"
   ```

3. Check for errors in latest log file

### Rate limit errors

This is normal - the script automatically waits 90 seconds. Let it continue.

### Internet disconnection

The script waits and retries. Won't crash.

### Database locked error

Only one instance should run at a time. Check if another process is running:
```bash
tasklist | find "python"
taskkill /IM python.exe /F  # Force kill all Python processes
```

---

## 🚀 Quick Reference

| Task | Command |
|------|---------|
| Start (Quick) | `start_background.bat` |
| Start (PowerShell) | `start_background.ps1` |
| Check progress | `Get-Content logs\*.log -Tail 20` |
| View full progress | `type generation_progress.json` |
| Stop process | `taskkill /IM python.exe /F` |
| View task (if scheduled) | `schtasks /query /tn SmartStudyHub-MCQGenerator` |

---

## ✨ Features

✅ **Automatic resume** - Picks up where it left off
✅ **Connection resilient** - Survives internet drops
✅ **Detailed logging** - Track every step
✅ **Rate limit handling** - Automatic cooldown
✅ **Error recovery** - Continues on failures
✅ **Progress tracking** - JSON status file
✅ **Beautiful output** - Color-coded logs

---

Let the magic happen! 🎉
