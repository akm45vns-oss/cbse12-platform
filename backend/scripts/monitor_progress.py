#!/usr/bin/env python3
"""
Smart Study Hub - Background Process Monitor
Real-time monitoring and status checking for background MCQ generation
"""

import os
import sys
import json
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, Any

SCRIPT_DIR = Path(__file__).parent
PROGRESS_FILE = SCRIPT_DIR / 'generation_progress.json'
LOG_DIR = SCRIPT_DIR / 'logs'


class ColorCodes:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'


def load_progress() -> Dict[str, Any]:
    """Load progress from JSON file"""
    if not PROGRESS_FILE.exists():
        return None
    
    try:
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading progress file: {e}")
        return None


def get_latest_log():
    """Get the latest log file"""
    if not LOG_DIR.exists():
        return None
    
    log_files = sorted(LOG_DIR.glob('*.log'), reverse=True)
    return log_files[0] if log_files else None


def print_status(progress: Dict[str, Any]):
    """Pretty print the current status"""
    completed = len(progress.get('completed_topics', []))
    failed = len(progress.get('failed_topics', []))
    total = progress.get('total_topics', 0)
    total_questions = progress.get('total_questions', 0)
    
    print(f"\n{ColorCodes.BOLD}{ColorCodes.CYAN}═══════════════════════════════════════════════════════════════{ColorCodes.END}")
    print(f"{ColorCodes.BOLD}Background MCQ Generation Status{ColorCodes.END}")
    print(f"{ColorCodes.CYAN}═══════════════════════════════════════════════════════════════{ColorCodes.END}\n")
    
    # Progress bar
    if total > 0:
        progress_pct = (completed / total) * 100
        bar_length = 50
        filled = int(bar_length * completed / total)
        bar = '█' * filled + '░' * (bar_length - filled)
        
        color = ColorCodes.GREEN if progress_pct == 100 else ColorCodes.YELLOW
        print(f"{color}Progress: {bar} {progress_pct:.1f}%{ColorCodes.END}")
        print(f"\n  {ColorCodes.GREEN}✓ Completed: {completed}/{total} topics{ColorCodes.END}")
        print(f"  {ColorCodes.RED}✗ Failed: {failed} topics{ColorCodes.END}")
        print(f"  {ColorCodes.BLUE}📝 Total Questions: {total_questions}{ColorCodes.END}")
    else:
        print(f"  {ColorCodes.YELLOW}⏳ Initializing... (total topics count not available){ColorCodes.END}")
    
    # Timestamps
    start_time = progress.get('start_time')
    last_update = progress.get('last_update')
    
    if start_time:
        try:
            start_dt = datetime.fromisoformat(start_time)
            print(f"\n  {ColorCodes.CYAN}Start Time: {start_dt.strftime('%Y-%m-%d %H:%M:%S')}{ColorCodes.END}")
        except:
            pass
    
    if last_update:
        try:
            update_dt = datetime.fromisoformat(last_update)
            elapsed = datetime.now() - update_dt
            
            print(f"  Last Update: {update_dt.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"  {ColorCodes.CYAN}Last Activity: {elapsed.seconds} seconds ago{ColorCodes.END}")
        except:
            pass
    
    # Recent completed topics
    completed_topics = progress.get('completed_topics', [])
    if completed_topics:
        print(f"\n{ColorCodes.BOLD}Recent Completed Topics:{ColorCodes.END}")
        for topic in completed_topics[-5:]:
            name = topic.get('name', 'Unknown')
            questions = topic.get('questions', 0)
            timestamp = topic.get('timestamp', '')
            print(f"  {ColorCodes.GREEN}✓{ColorCodes.END} {name} ({questions} questions)")
    
    # Failed topics
    failed_topics = progress.get('failed_topics', [])
    if failed_topics:
        print(f"\n{ColorCodes.BOLD}{ColorCodes.RED}Failed Topics:{ColorCodes.END}")
        for topic in failed_topics[-5:]:
            name = topic.get('name', 'Unknown')
            error = topic.get('error', 'Unknown error')
            print(f"  {ColorCodes.RED}✗{ColorCodes.END} {name}")
            print(f"     Error: {error}")
    
    print(f"\n{ColorCodes.CYAN}═══════════════════════════════════════════════════════════════{ColorCodes.END}\n")


def show_logs(lines: int = 20):
    """Show the latest log entries"""
    latest_log = get_latest_log()
    
    if not latest_log:
        print(f"{ColorCodes.YELLOW}No log files found yet.{ColorCodes.END}")
        return
    
    print(f"\n{ColorCodes.BOLD}{ColorCodes.CYAN}Latest Log File: {latest_log.name}{ColorCodes.END}")
    print(f"{ColorCodes.CYAN}{'─' * 70}{ColorCodes.END}\n")
    
    try:
        with open(latest_log, 'r') as f:
            all_lines = f.readlines()
            recent_lines = all_lines[-lines:] if len(all_lines) > lines else all_lines
            
            for line in recent_lines:
                line = line.rstrip()
                if 'ERROR' in line or 'Failed' in line or '✗' in line:
                    print(f"{ColorCodes.RED}{line}{ColorCodes.END}")
                elif 'SUCCESS' in line or 'Complete' in line or '✓' in line:
                    print(f"{ColorCodes.GREEN}{line}{ColorCodes.END}")
                elif 'WARNING' in line or 'Rate limit' in line:
                    print(f"{ColorCodes.YELLOW}{line}{ColorCodes.END}")
                else:
                    print(line)
    except Exception as e:
        print(f"{ColorCodes.RED}Error reading log file: {e}{ColorCodes.END}")
    
    print(f"\n{ColorCodes.CYAN}{'─' * 70}{ColorCodes.END}\n")


def check_python_process():
    """Check if Python MCQ generator is running"""
    try:
        import subprocess
        result = subprocess.run(['tasklist'], capture_output=True, text=True)
        python_count = result.stdout.count('python.exe')
        return python_count > 0
    except:
        return None


def main():
    """Main monitoring interface"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Monitor background MCQ generation')
    parser.add_argument('--watch', action='store_true', help='Continuous monitoring mode (refresh every 30s)')
    parser.add_argument('--logs', type=int, default=20, help='Number of log lines to show (default: 20)')
    parser.add_argument('--full', action='store_true', help='Show complete log file')
    
    args = parser.parse_args()
    
    if args.full:
        # Show all logs
        latest_log = get_latest_log()
        if latest_log:
            with open(latest_log, 'r') as f:
                print(f.read())
        else:
            print(f"{ColorCodes.YELLOW}No log files found.{ColorCodes.END}")
        return
    
    # Check if process is running
    is_running = check_python_process()
    
    if args.watch:
        # Continuous monitoring
        print(f"{ColorCodes.BOLD}Starting continuous monitoring (Ctrl+C to exit)...{ColorCodes.END}\n")
        
        try:
            while True:
                os.system('cls' if os.name == 'nt' else 'clear')
                
                progress = load_progress()
                if progress:
                    print_status(progress)
                    show_logs(args.logs)
                else:
                    print(f"{ColorCodes.YELLOW}No progress file found. Generator may not have started yet.{ColorCodes.END}\n")
                
                if is_running is not None:
                    status = f"{ColorCodes.GREEN}RUNNING{ColorCodes.END}" if is_running else f"{ColorCodes.YELLOW}NOT RUNNING{ColorCodes.END}"
                    print(f"Process Status: {status}")
                
                print(f"\n{ColorCodes.CYAN}Next update in 30 seconds... (Ctrl+C to exit){ColorCodes.END}")
                time.sleep(30)
        
        except KeyboardInterrupt:
            print(f"\n\n{ColorCodes.YELLOW}Monitoring stopped.{ColorCodes.END}\n")
    
    else:
        # Single status check
        progress = load_progress()
        
        if progress:
            print_status(progress)
            show_logs(args.logs)
        else:
            print(f"\n{ColorCodes.YELLOW}No progress file found.{ColorCodes.END}")
            print(f"The generator may not have started yet.\n")
            print(f"{ColorCodes.CYAN}To start the generator, run:{ColorCodes.END}")
            print(f"  start_background.bat\n")
        
        if is_running is not None:
            status = f"{ColorCodes.GREEN}RUNNING{ColorCodes.END}" if is_running else f"{ColorCodes.YELLOW}NOT RUNNING{ColorCodes.END}"
            print(f"Process Status: {status}")
            
            if is_running:
                print(f"\n{ColorCodes.CYAN}Tip: Use --watch flag for continuous monitoring:{ColorCodes.END}")
                print(f"  python monitor_progress.py --watch\n")


if __name__ == "__main__":
    main()
