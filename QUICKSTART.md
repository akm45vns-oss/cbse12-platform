# 🚀 Smart Study Hub - Automated MCQ Generation

Generate MCQs and comprehensive notes for all your study materials automatically using Groq's LLaMA AI, even when you close your laptop or lose internet connection!

## Quick Start (60 seconds)

### Step 1: Navigate to scripts folder
```bash
cd c:\Users\akm45\Desktop\smart_study_hub\backend\scripts
```

### Step 2: Start background generation
```bash
start_background.bat
```

### Step 3: Close the window and walk away! ✅
The process continues running in the background for 20-35 minutes.

### Step 4: Monitor progress (optional)
```bash
python monitor_progress.py --watch
```

---

## What You Get

For each of your 44 topics, the system generates:

### 📝 Comprehensive Notes
- 500+ words of detailed markdown content
- Technical explanations with code examples
- Key concepts and best practices
- Formatted for web display

### 📊 30 Multiple Choice Questions
- **15 Fundamental MCQs** - Core concepts
- **15 Advanced MCQs** - Applications and edge cases
- Each with 4 options, explanations, and clear correct answers

**Total:** 1,320 MCQs generated for your 44 topics

---

## Three Ways to Run

### 🥇 Method 1: One-Click (EASIEST)

Perfect for getting started quickly.

```bash
cd backend\scripts
start_background.bat
```

**Features:**
- ✅ Survives window closure
- ✅ Survives disconnection
- ✅ Logs everything
- ⏱️ ~30 minutes to complete

**Check progress:**
```bash
# See latest logs (PowerShell)
Get-Content "backend\scripts\logs\*.log" -Tail 30

# See progress JSON
type "backend\scripts\generation_progress.json"
```

---

### 🥈 Method 2: PowerShell (MORE CONTROL)

For those who like more visibility.

```powershell
# First time only - allow scripts to run
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run the launcher
& 'backend\scripts\start_background.ps1'
```

**Real-time monitoring:**
```powershell
Get-Content "backend\scripts\logs\*.log" -Tail 20 -Wait
```

---

### 🥇 Method 3: Windows Scheduled Task (MOST ROBUST) ⭐

**Best for:** Set-it-and-forget-it reliability. Survives everything including system restarts.

**Setup (Command Prompt as Admin):**
```batch
cd c:\Users\akm45\Desktop\smart_study_hub\backend\scripts

schtasks /create /tn "SmartStudyHub-MCQGenerator" ^
  /tr "python background_mcq_generator.py" ^
  /sc once /st 00:00 ^
  /sd 01/01/2025 ^
  /rl highest ^
  /f

# Start it
schtasks /run /tn "SmartStudyHub-MCQGenerator"
```

**Check status:**
```batch
schtasks /query /tn "SmartStudyHub-MCQGenerator" /v
```

See [BACKGROUND_SETUP.md](./BACKGROUND_SETUP.md) for detailed setup instructions.

---

## 📊 Real-Time Monitoring

### Quick Status Check
```bash
cd backend\scripts
python monitor_progress.py
```

**Output:**
```
═══════════════════════════════════════════════════════════════
Background MCQ Generation Status
═══════════════════════════════════════════════════════════════

Progress: █████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 10.0%

  ✓ Completed: 4/44 topics
  ✗ Failed: 0 topics
  📝 Total Questions: 120

  Start Time: 2026-04-06 10:00:00
  Last Update: 2026-04-06 10:35:47
  Last Activity: 12 seconds ago

Recent Completed Topics:
  ✓ Introduction to Python (30 questions)
  ✓ Variables and Data Types (30 questions)
  ✓ Control Flow (30 questions)
  ✓ Functions (30 questions)
```

### Continuous Monitoring (Auto-refresh)
```bash
python monitor_progress.py --watch
```

Refreshes every 30 seconds automatically.

### View Full Logs
```bash
python monitor_progress.py --full
```

---

## 📁 Generated Files

After generation completes, you'll find:

```
backend/scripts/
├── generation_progress.json           # Current progress & stats
└── logs/
    ├── mcq_generation_20260406_100000.log
    ├── mcq_generation_20260406_125000.log
    └── stderr.log (if any errors)
```

**Progress JSON shows:**
- Completed topics
- Failed topics (with errors)
- Total questions generated
- Start time and timestamps

---

## 🔄 Resume & Resume-Ability

The system **automatically**:
- ✅ Tracks which topics are completed
- ✅ Skips already-processed topics
- ✅ Resumes from where it left off
- ✅ Logs failures for inspection
- ✅ Retries on network hiccups

**Manual resume:**
```bash
cd backend\scripts
python background_mcq_generator.py
```

It will:
1. Load `generation_progress.json`
2. Check which topics are completed
3. Skip completed ones
4. Continue with remaining topics

---

## What Survives What

| Scenario | One-Click | PowerShell | Scheduled Task |
|----------|-----------|------------|---|
| Close window | ✅ | ✅ | ✅ |
| Disconnect internet | ✅ | ✅ | ✅ |
| Close terminal | ✅ | ✅ | ✅ |
| System restart | ❌ | ❌ | ✅ |
| Hibernation/Sleep | ⚠️ | ⚠️ | ✅ |

**✅ = Survives | ⚠️ = May need resume | ❌ = Doesn't survive**

For ultimate reliability, use **Scheduled Task (Method 3)**.

---

## 🎓 What Gets Generated & How

### Generation Process

**For each topic, the system makes 2 API calls:**

#### Call 1: Notes + 15 MCQs
```
[Groq API Call 1]
  ↓
  Generate 500+ word markdown notes
  Generate 15 fundamental MCQs
  ↓
[35-second cooldown to respect rate limits]
```

#### Call 2: 15 Advanced MCQs
```
[Groq API Call 2]
  ↓
  Generate 15 advanced/application-based MCQs
  ↓
[35-second cooldown]
```

**Total per topic:** ~70 seconds (including cooldowns)

### Database Structure

Generated content is stored as:
```
Course
└── Unit (e.g., "Fundamentals of Python")
    └── Topic (e.g., "Variables and Data Types")
        ├── content_summary = Markdown notes
        └── Quiz 1: Challenge Part 1
            └── Questions 1-15
        └── Quiz 2: Challenge Part 2
            └── Questions 16-30
```

### API Usage

- **Model:** LLaMA 3.3 70B (fast & smart)
- **Rate Limit:** 12,000 tokens/minute
- **Cooldown:** Automatic 35-second waits
- **Retries:** 5 attempts per API call (with backoff)

---

## ⚙️ Advanced Options

### Adjust Temperature (Creativity)
```bash
# More creative/diverse answers
python background_mcq_generator.py --temperature 0.9

# More consistent/deterministic
python background_mcq_generator.py --temperature 0.5
```

### Generate for Specific Course
```bash
python background_mcq_generator.py --course "Python Programming"
```

### Available Courses
```
1. Python Programming (PY101) - 14 topics
2. Computer Networks - 8 topics
3. Object Oriented Programming (C++) - 9 topics
4. Data Visualization - 6 topics
5. Machine Learning - 7 topics
```

---

## 🛠️ Troubleshooting

### Issue: Process doesn't seem to be running

**Solution:** Check logs
```bash
# View latest log
Get-Content "backend\scripts\logs\*.log" -Tail 50

# Check if Python is running
tasklist | find "python"
```

### Issue: "Rate limit exceeded" error

**This is normal!** The script automatically:
- Waits 90 seconds
- Retries the request
- Continues processing

Just let it run. ✅

### Issue: "Connection timeout" error

**Solution:** Network issue, script will retry automatically.

### Issue: Database locked error

**Solution:** Only one instance should run at a time.
```bash
# Check if another process is running
tasklist | find "python"

# Kill all Python processes (if necessary)
taskkill /IM python.exe /F
```

### Issue: Generation was interrupted

**Solution:** Resume where it left off
```bash
# Check progress
type backend\scripts\generation_progress.json

# Resume
python background_mcq_generator.py
```

The system will skip completed topics and continue!

---

## 📊 Monitoring Dashboard

Use the built-in monitor for real-time stats:

```bash
python monitor_progress.py --watch
```

**Shows:**
- Progress percentage
- Completed/Failed topics count
- Total questions generated
- Last activity timestamp
- Recent completed topics
- Any errors/failures

---

## 🎯 Performance

**For your 44 topics:**
- Estimated time: 30-40 minutes
- Estimated API calls: 88 calls (2 per topic)
- Estimated questions: 1,320 MCQs
- Database size increase: ~2-3 MB

**During generation:**
- CPU: Low (~5-10%)
- Memory: Low (100-200 MB)
- Network: Minimal (only during API calls)
- Disk: Negligible

---

## 📚 Files Created/Modified

### New Files
- `backend/scripts/background_mcq_generator.py` - Main generator
- `backend/scripts/start_background.bat` - Windows launcher
- `backend/scripts/start_background.ps1` - PowerShell launcher
- `backend/scripts/monitor_progress.py` - Progress monitor
- `backend/scripts/generation_progress.json` - Progress tracking
- `backend/scripts/logs/` - Log directory

### Updated Files
- `requirements.txt` - Added groq and python-dotenv
- `backend/app.py` - Fixed model imports

---

## ✨ Features

✅ **Fully Autonomous** - Run and forget
✅ **Survives Disconnection** - Retries automatically
✅ **Resume-Able** - Pick up where it left off
✅ **Detailed Logging** - Track every step
✅ **Progress Tracking** - JSON status file
✅ **Error Recovery** - Continues on failures
✅ **Rate Limit Safe** - Automatic cooldowns
✅ **Beautiful Monitoring** - Real-time dashboard
✅ **Multiple Options** - Choose your launch method

---

## 🚀 Recommended Workflow

### For First Run
1. **Prepare:** Make sure you have `GROQ_API_KEY` in `.env`
2. **Start:** Run `start_background.bat` now
3. **Monitor:** Check log file occasionally
4. **Wait:** Let it run (30-40 minutes)
5. **Celebrate:** 1,320 new MCQs + notes! 🎉

### For Production
1. **Setup:** Create Windows Scheduled Task (Method 3)
2. **Schedule:** Run at off-peak time (e.g., 11 PM)
3. **Automate:** Forget about it - it'll complete overnight
4. **Monitor:** Check progress next morning
5. **Deploy:** Use generated MCQs in your app

---

## 📞 Support

### Check Everything Works
```bash
# Test Groq API
python -c "from groq import Groq; print('✓ Groq installed')"

# Check database
python backend/app.py  # Should start without errors

# Test generator
python backend/scripts/background_mcq_generator.py --help
```

### View Complete Logs
```bash
Get-Content "backend\scripts\logs\*.log" -Raw
```

### Check Database
```bash
# View questions in database
sqlite3 backend/database.db "SELECT COUNT(*) as total_questions FROM questions;"
```

---

## 🎓 Next Steps

1. ✅ Start generation: `start_background.bat`
2. 📊 Monitor: `python monitor_progress.py --watch`
3. ✨ Use MCQs: Check database/API endpoints
4. 🔄 Schedule: Set up Scheduled Task for future runs

---

**Happy learning! Your MCQs are being generated as we speak! 🚀**
