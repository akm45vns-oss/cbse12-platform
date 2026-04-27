# 🎯 Background MCQ Generation - QUICK REFERENCE

## ⚡ START NOW (30 seconds)

```bash
cd c:\Users\akm45\Desktop\smart_study_hub\backend\scripts
start_background.bat
```

Then close the window and walk away! ✅

---

## 📋 What Was Set Up

### New Generator Scripts
1. **background_mcq_generator.py** - Resilient background runner with progress tracking
2. **start_background.bat** - One-click launcher (Windows)
3. **start_background.ps1** - PowerShell launcher
4. **monitor_progress.py** - Real-time progress monitor

### Key Features
✅ Survives window closure
✅ Survives internet disconnection  
✅ Auto-resumes from last checkpoint
✅ Tracks progress in JSON file
✅ Detailed logging to files
✅ Automatic rate limit handling

### Generated Content (Per Topic)
- 500+ word markdown notes
- 30 MCQs (15 basic + 15 advanced)
- **Total:** 1,320 MCQs for 44 topics

---

## 🚀 Three Launch Options

### Option 1: Quick Start (EASIEST)
```bash
start_background.bat
```
- ✅ Works immediately
- ✅ No setup required
- ⏱️ ~30 minutes

### Option 2: PowerShell
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
& 'backend\scripts\start_background.ps1'
```
- More control
- Better monitoring
- Process ID tracking

### Option 3: Windows Scheduled Task (MOST ROBUST)
```bash
schtasks /create /tn "SmartStudyHub-MCQGenerator" /tr "python background_mcq_generator.py" /sc once /st 00:00 /sd 01/01/2025 /rl highest /f
schtasks /run /tn "SmartStudyHub-MCQGenerator"
```
- ✅ Survives system restart
- ✅ Survives disconnect
- ✅ Survives sleep/hibernation
- 👑 Most reliable

See [BACKGROUND_SETUP.md](BACKGROUND_SETUP.md) for detailed instructions.

---

## 📊 Monitor Progress

### Check Status
```bash
cd backend\scripts
python monitor_progress.py
```

### Watch Real-Time (30s auto-refresh)
```bash
python monitor_progress.py --watch
```

### View Logs
```bash
Get-Content "logs\*.log" -Tail 30
```

### Check Progress JSON
```bash
type generation_progress.json
```

---

## 📁 Where Files Go

```
backend/scripts/
├── background_mcq_generator.py      ← Main runner
├── monitor_progress.py              ← Progress monitor
├── start_background.bat             ← Windows launcher
├── start_background.ps1             ← PowerShell launcher
├── generation_progress.json         ← Progress tracking
└── logs/
    ├── mcq_generation_*.log        ← Detailed logs
    ├── stdout.log                   ← Standard output
    └── stderr.log                   ← Error output
```

---

## ✅ Checklist

- [ ] Run: `start_background.bat`
- [ ] Close the window
- [ ] Wait 30-40 minutes
- [ ] Check progress: `python monitor_progress.py`
- [ ] Enjoy 1,320 new MCQs! 🎉

---

## 🔄 Resume If Interrupted

If generation stops for any reason:

```bash
cd backend\scripts
python background_mcq_generator.py
```

**It will:**
- Load progress from `generation_progress.json`
- Skip completed topics
- Resume with remaining topics
- Continue from exactly where it left off

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Process not running | Check logs: `Get-Content logs\*.log -Tail 50` |
| Rate limit error | Normal! Script waits and retries automatically |
| Connection timeout | Network issue, script retries automatically |
| Database locked | Run only one instance: `tasklist \| find "python"` |
| Want to stop | `taskkill /IM python.exe` |

---

## 📚 Documentation Files

- **QUICKSTART.md** - Full guide with all options
- **BACKGROUND_SETUP.md** - Detailed setup instructions
- **MCQ_GENERATION_GUIDE.md** - Original MCQ generation guide
- **requirements.txt** - All dependencies (already installed)

---

## 🎓 Next Steps

1. **NOW:** Run `start_background.bat`
2. **In 30 min:** Check `monitor_progress.py --watch`
3. **After completion:** Use MCQs via API/Frontend
4. **Future:** Set up Scheduled Task for automation

---

## 📊 Expected Results

```
44 topics × 30 MCQs = 1,320 total questions
44 topics × 500+ words = 22,000+ words of notes

Time: ~30-40 minutes
Survives: Disconnect, window closure, internet drops
Resume: Automatic progress tracking

Result: Complete MCQ + Notes database ready for production!
```

---

**Questions?** See the detailed guides or check the logs!

**Ready?** Run this now:
```bash
cd c:\Users\akm45\Desktop\smart_study_hub\backend\scripts && start_background.bat
```

Happy learning! 🚀
