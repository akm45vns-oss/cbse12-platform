#!/usr/bin/env python3
"""
Smart Study Hub - Background MCQ Generator with Resume Support
Runs continuously in background, survives disconnections and restarts.
Tracks progress and resumes from last completed topic.
"""

import os
import sys
import json
import time
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List, Any
from dotenv import load_dotenv
from groq import Groq

# Setup path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from models import db
from models.course import Course, Unit, Topic
from models.quiz import Quiz, Question, Option

# ==================== CONFIGURATION ====================
PROGRESS_FILE = os.path.join(os.path.dirname(__file__), 'generation_progress.json')
LOG_DIR = os.path.join(os.path.dirname(__file__), 'logs')
LOG_FILE = os.path.join(LOG_DIR, f'mcq_generation_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')

# Ensure log directory exists
Path(LOG_DIR).mkdir(exist_ok=True)

# Configure logging to both file and console
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Load all API keys (primary + 4 backups)
API_KEYS = []
primary_key = os.getenv("GROQ_API_KEY")
if primary_key:
    API_KEYS.append(primary_key)
    logger.info(f"Loaded primary GROQ_API_KEY")

for i in range(1, 6):
    key = os.getenv(f"VITE_GROQ_KEY_{i}")
    if key:
        API_KEYS.append(key)
        logger.info(f"Loaded VITE_GROQ_KEY_{i}")
    else:
        logger.warning(f"VITE_GROQ_KEY_{i} not found")

if not API_KEYS:
    logger.error("No Groq API keys found. Please set GROQ_API_KEY or VITE_GROQ_KEY_1..5")
    sys.exit(1)

logger.info(f"✓ Total API keys loaded: {len(API_KEYS)}")

# Initialize Groq client (will rotate through keys)
current_key_index = 0
client = Groq(api_key=API_KEYS[0])
APP = create_app()


class ProgressTracker:
    """Tracks generation progress and allows resuming"""
    
    def __init__(self, progress_file: str = PROGRESS_FILE):
        self.progress_file = progress_file
        self.data = self._load_progress()
    
    def _load_progress(self) -> Dict:
        """Load progress from file or create new"""
        if os.path.exists(self.progress_file):
            try:
                with open(self.progress_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load progress file: {e}. Starting fresh.")
        
        return {
            "start_time": datetime.now().isoformat(),
            "last_update": datetime.now().isoformat(),
            "completed_topics": [],
            "failed_topics": [],
            "total_topics": 0,
            "total_questions": 0,
            "stats": {}
        }
    
    def _save_progress(self):
        """Save progress to file"""
        self.data["last_update"] = datetime.now().isoformat()
        try:
            with open(self.progress_file, 'w') as f:
                json.dump(self.data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save progress: {e}")
    
    def mark_topic_completed(self, topic_id: int, topic_name: str, question_count: int):
        """Mark topic as completed"""
        self.data["completed_topics"].append({
            "id": topic_id,
            "name": topic_name,
            "timestamp": datetime.now().isoformat(),
            "questions": question_count
        })
        self.data["total_questions"] += question_count
        self._save_progress()
        logger.info(f"[OK] Progress saved: {topic_name} ({question_count} questions)")
    
    def mark_topic_failed(self, topic_id: int, topic_name: str, error: str):
        """Mark topic as failed"""
        self.data["failed_topics"].append({
            "id": topic_id,
            "name": topic_name,
            "error": error,
            "timestamp": datetime.now().isoformat()
        })
        self._save_progress()
        logger.error(f"[ERROR] Topic failed: {topic_name} - {error}")
    
    def is_completed(self, topic_id: int) -> bool:
        """Check if topic is already completed"""
        return any(t["id"] == topic_id for t in self.data["completed_topics"])
    
    def get_status(self) -> Dict:
        """Get current status"""
        return {
            "completed": len(self.data["completed_topics"]),
            "failed": len(self.data["failed_topics"]),
            "total_questions": self.data["total_questions"],
            "last_update": self.data["last_update"],
            "start_time": self.data["start_time"]
        }


class BackgroundGroqMCQGenerator:
    """Background-safe MCQ generator with resume capability"""
    
    def __init__(self, model: str = "llama-3.3-70b-versatile", temperature: float = 0.7):
        self.model = model
        self.temperature = temperature
        self.max_retries = 5
        self.rate_limit_delay = 60  # Reduced from 120s since we have 5 keys (5x capacity)
        self.progress = ProgressTracker()
    
    def call_groq(self, prompt: str) -> Optional[Dict[str, Any]]:
        """Call Groq API with extensive retry logic and key rotation"""
        global current_key_index, client
        
        for attempt in range(self.max_retries):
            try:
                logger.info(f"Groq API call (attempt {attempt + 1}/{self.max_retries}, key {current_key_index + 1}/{len(API_KEYS)})...")
                
                chat_completion = client.chat.completions.create(
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert educational content creator. Generate accurate, engaging educational materials. Return ONLY valid JSON, no markdown code blocks."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    model=self.model,
                    temperature=self.temperature,
                    max_tokens=4000,
                    response_format={"type": "json_object"}
                )
                
                response_text = chat_completion.choices[0].message.content
                
                # Apply rate limit delay
                logger.info(f"Cooldown: waiting {self.rate_limit_delay}s...")
                time.sleep(self.rate_limit_delay)
                
                return json.loads(response_text)
                
            except json.JSONDecodeError as e:
                logger.warning(f"JSON decode error: {e}. Retrying...")
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** (attempt + 1))
                continue
                
            except Exception as e:
                error_msg = str(e).lower()
                
                if "rate_limit" in error_msg or "429" in error_msg:
                    # Rotate to next API key for rate limit errors
                    current_key_index = (current_key_index + 1) % len(API_KEYS)
                    client = Groq(api_key=API_KEYS[current_key_index])
                    wait_time = 30  # Reduced wait with key rotation
                    logger.warning(f"Rate limit hit. Rotating to key {current_key_index + 1}/{len(API_KEYS)}. Waiting {wait_time}s...")
                    time.sleep(wait_time)
                elif "connection" in error_msg or "timeout" in error_msg:
                    wait_time = 30 * (attempt + 1)
                    logger.warning(f"Connection issue: {e}. Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"API Error: {e}")
                    if attempt < self.max_retries - 1:
                        time.sleep(2 ** (attempt + 1))
        
        return None
    
    def generate_notes_and_mcqs_part1(self, topic: Topic, unit_name: str, course_name: str) -> Optional[Dict]:
        """Generate detailed notes and first 15 MCQs"""
        prompt = f"""
Generate educational content for:
- Course: {course_name}
- Unit: {unit_name}
- Topic: {topic.title}

REQUIREMENTS:
1. Create EXTREMELY DETAILED technical notes (500+ words) in Markdown with headers, examples
2. Generate exactly 15 MCQs

Each question must have 4 options, 1 correct (is_correct: true), and explanation.

Return VALID JSON:
{{
    "content_summary": "# {topic.title}\\n\\nDetailed notes...",
    "quizzes": [{{
        "title": "{topic.title} Challenge Part 1",
        "questions": [{{
            "question_text": "Q?",
            "explanation": "Why...",
            "options": [{{"option_text": "Correct", "is_correct": true}}, {{"option_text": "Wrong", "is_correct": false}}, {{"option_text": "Wrong", "is_correct": false}}, {{"option_text": "Wrong", "is_correct": false}}]
        }}]
    }}]
}}
"""
        return self.call_groq(prompt)
    
    def generate_mcqs_part2(self, topic: Topic, course_name: str) -> Optional[Dict]:
        """Generate 15 advanced MCQs"""
        prompt = f"""
Generate exactly 15 NEW advanced MCQs for:
- Course: {course_name}
- Topic: {topic.title}

Focus on advanced concepts, applications, edge cases.
Each must have 4 options, 1 correct, 2-3 sentence explanation.

Return VALID JSON:
{{
    "quizzes": [{{
        "title": "{topic.title} Challenge Part 2",
        "questions": [{{
            "question_text": "Advanced Q?",
            "explanation": "Explanation...",
            "options": [{{"option_text": "Correct", "is_correct": true}}, {{"option_text": "Wrong", "is_correct": false}}, {{"option_text": "Wrong", "is_correct": false}}, {{"option_text": "Wrong", "is_correct": false}}]
        }}]
    }}]
}}
"""
        return self.call_groq(prompt)
    
    def save_to_database(self, topic_id: int, topic_title: str, notes: str, quizzes_data: List[Dict]) -> int:
        """Save to database with error recovery"""
        try:
            # Re-fetch topic in this session context
            topic = Topic.query.get(topic_id)
            if not topic:
                raise Exception(f"Topic with ID {topic_id} not found")
            
            topic.content_summary = notes
            
            # Clear old quizzes
            for old_quiz in topic.quizzes:
                db.session.delete(old_quiz)
            db.session.commit()
            
            total_questions = 0
            for quiz_data in quizzes_data:
                new_quiz = Quiz(
                    title=quiz_data.get('title', f"{topic_title} Quiz"),
                    topic_id=topic_id,
                    ai_generated=True
                )
                db.session.add(new_quiz)
                db.session.flush()
                
                for question_data in quiz_data.get('questions', []):
                    new_question = Question(
                        quiz_id=new_quiz.id,
                        question_text=question_data.get('question_text', ''),
                        explanation=question_data.get('explanation', '')
                    )
                    db.session.add(new_question)
                    db.session.flush()
                    total_questions += 1
                    
                    for option_data in question_data.get('options', []):
                        db.session.add(Option(
                            question_id=new_question.id,
                            option_text=option_data.get('option_text', ''),
                            is_correct=option_data.get('is_correct', False)
                        ))
            
            db.session.commit()
            return total_questions
            
        except Exception as e:
            logger.error(f"Database error: {e}")
            db.session.rollback()
            raise
    
    def process_topic_safe(self, topic: Topic, unit_name: str, course_name: str) -> bool:
        """Process topic with full error recovery"""
        
        topic_id = topic.id
        topic_title = topic.title
        
        # Skip if already completed
        if self.progress.is_completed(topic_id):
            logger.info(f"[SKIP] Already completed: {topic_title}")
            return True
        
        logger.info("")
        logger.info(f"[PROCESSING] Topic: {topic_title}")
        
        try:
            # Generate Part 1
            logger.info(f"  Generating Part 1 (Notes + 15 MCQs)...")
            part1_data = self.generate_notes_and_mcqs_part1(topic, unit_name, course_name)
            if not part1_data:
                raise Exception("Part 1 generation returned None")
            
            # Generate Part 2
            logger.info(f"  Generating Part 2 (15 Advanced MCQs)...")
            part2_data = self.generate_mcqs_part2(topic, course_name)
            if not part2_data:
                raise Exception("Part 2 generation returned None")
            
            # Combine and save
            notes = part1_data.get('content_summary', '')
            all_quizzes = part1_data.get('quizzes', []) + part2_data.get('quizzes', [])
            
            with APP.app_context():
                question_count = self.save_to_database(topic_id, topic_title, notes, all_quizzes)
            
            # Mark as completed
            self.progress.mark_topic_completed(topic_id, topic_title, question_count)
            logger.info(f"[SUCCESS] {topic_title} ({question_count} questions)")
            return True
            
        except Exception as e:
            self.progress.mark_topic_failed(topic_id, topic_title, str(e))
            logger.error(f"[FAILED] {topic_title} - {e}")
            return False
    
    def run_background(self, course_filter: Optional[str] = None):
        """Background runner with resume support"""
        logger.info("=" * 70)
        logger.info("STARTING BACKGROUND MCQ GENERATOR")
        logger.info(f"Log file: {LOG_FILE}")
        logger.info(f"Progress file: {PROGRESS_FILE}")
        logger.info("=" * 70)
        logger.info("")
        
        with APP.app_context():
            courses = Course.query.all()
            
            if not courses:
                logger.error("No courses found!")
                return
            
            total_to_process = 0
            
            # Count total topics
            for course in courses:
                if course_filter and course.title.lower() != course_filter.lower():
                    continue
                
                units = Unit.query.filter_by(course_id=course.id).all()
                for unit in units:
                    topics = Topic.query.filter_by(unit_id=unit.id).all()
                    total_to_process += len(topics)
            
            if total_to_process == 0:
                logger.error("No topics to process!")
                return
            
            self.progress.data["total_topics"] = total_to_process
            
            # Process topics
            for course in courses:
                if course_filter and course.title.lower() != course_filter.lower():
                    continue
                
                logger.info("")
                logger.info("[" * 35 + "]")
                logger.info(f"COURSE: {course.title}")
                logger.info("[" * 35 + "]")
                logger.info("")
                
                units = Unit.query.filter_by(course_id=course.id).all()
                
                for unit in units:
                    logger.info(f"  UNIT: {unit.name}")
                    
                    topics = Topic.query.filter_by(unit_id=unit.id).all()
                    
                    for topic in topics:
                        self.process_topic_safe(topic, unit.name, course.title)
                        
                        # Quick status update
                        status = self.progress.get_status()
                        logger.info(f"  STATUS: {status['completed']}/{self.progress.data['total_topics']} completed, {status['failed']} failed, {status['total_questions']} total questions")
        
        # Final summary
        status = self.progress.get_status()
        logger.info("")
        logger.info("=" * 70)
        logger.info("GENERATION COMPLETE!")
        logger.info(f"Completed: {status['completed']} topics")
        logger.info(f"Failed: {status['failed']} topics")
        logger.info(f"Total Questions: {status['total_questions']}")
        logger.info(f"Log: {LOG_FILE}")
        logger.info("=" * 70)
        logger.info("")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Background MCQ Generator (Resume-Safe)")
    parser.add_argument('--course', type=str, help='Filter by course name')
    parser.add_argument('--temperature', type=float, default=0.7, help='LLM temperature')
    
    args = parser.parse_args()
    
    generator = BackgroundGroqMCQGenerator(temperature=args.temperature)
    generator.run_background(course_filter=args.course)


if __name__ == "__main__":
    main()
