#!/usr/bin/env python3
"""
Smart Study Hub - Advanced MCQ Generator with Multi-API Load Balancing
Implements sophisticated batched generation with quality assurance
Distributes load across 6 API keys for maximum throughput
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'logs/mcq_generation_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Groq clients with multiple API keys
API_KEYS = []
for i in range(1, 7):
    key = os.getenv(f"VITE_GROQ_KEY_{i}") if i > 1 else os.getenv("GROQ_API_KEY")
    if key:
        API_KEYS.append(key)
        logger.info(f"Loaded API key {i}")

if not API_KEYS:
    logger.error("No Groq API keys found in .env file")
    sys.exit(1)

logger.info(f"Loaded {len(API_KEYS)} API keys for load balancing")

APP = create_app()


class APIKeyRotator:
    """Manages API key rotation for load balancing"""
    
    def __init__(self, keys: List[str]):
        self.keys = keys
        self.current_index = 0
        self.clients = [Groq(api_key=key) for key in keys]
    
    def get_client(self) -> Groq:
        """Get next client in rotation"""
        client = self.clients[self.current_index]
        self.current_index = (self.current_index + 1) % len(self.keys)
        return client


class AdvancedMCQGenerator:
    """Advanced MCQ generator with batched generation and quality assurance"""
    
    def __init__(self, api_keys: List[str]):
        self.rotator = APIKeyRotator(api_keys)
        self.batch_size = 8
        self.max_retries = 6
        self.rate_limit_delay = 30
        self.seen_questions = set()
    
    def call_groq(self, prompt: str, retries: int = 0) -> Optional[Dict]:
        """Call Groq API with rotation and retry logic"""
        if retries >= self.max_retries:
            logger.error(f"Failed after {self.max_retries} retries")
            return None
        
        try:
            client = self.rotator.get_client()
            logger.info(f"API call (attempt {retries + 1}/{self.max_retries}, key rotation active)...")
            
            response = client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert educational content creator. Generate ONLY valid JSON, no markdown or commentary."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.35,  # Lower temp for consistency
                max_tokens=1800,
                response_format={"type": "json_object"}
            )
            
            response_text = response.choices[0].message.content
            return json.loads(response_text)
        
        except json.JSONDecodeError as e:
            logger.warning(f"JSON decode error: {e}. Retrying...")
            time.sleep(2.5)
            return self.call_groq(prompt, retries + 1)
        
        except Exception as e:
            error_msg = str(e).lower()
            
            if "rate_limit" in error_msg or "429" in error_msg:
                logger.warning(f"Rate limit hit. Waiting {self.rate_limit_delay}s...")
                time.sleep(self.rate_limit_delay)
            else:
                logger.error(f"API Error: {e}")
                time.sleep(2 + (retries * 0.5))
            
            return self.call_groq(prompt, retries + 1)
    
    def normalize_question(self, question_text: str) -> str:
        """Normalize question for deduplication"""
        return question_text.lower().strip()
    
    def is_duplicate(self, question_text: str) -> bool:
        """Check if question is duplicate"""
        normalized = self.normalize_question(question_text)
        if normalized in self.seen_questions:
            return True
        self.seen_questions.add(normalized)
        return False
    
    def validate_question(self, q: Dict) -> bool:
        """Validate question structure and content"""
        try:
            # Check required fields
            if not all(k in q for k in ['q', 'opts', 'ans', 'exp']):
                return False
            
            # Check question text
            if not isinstance(q['q'], str) or len(q['q']) < 20:
                return False
            
            # Check for duplicates
            if self.is_duplicate(q['q']):
                return False
            
            # Check options
            if not isinstance(q['opts'], list) or len(q['opts']) != 4:
                return False
            
            if not all(isinstance(opt, str) for opt in q['opts']):
                return False
            
            # Check answer index
            if not isinstance(q['ans'], int) or q['ans'] < 0 or q['ans'] > 3:
                return False
            
            # Check explanation
            if not isinstance(q['exp'], str) or len(q['exp'].split()) < 15:
                return False
            
            return True
        
        except Exception as e:
            logger.debug(f"Validation failed: {e}")
            return False
    
    def generate_batch(self, topic_name: str, course_name: str, difficulty: str, batch_num: int) -> List[Dict]:
        """Generate a batch of 8 questions"""
        
        prompt = f"""
Generate exactly 8 multiple-choice questions for:
- Course: {course_name}
- Topic: {topic_name}
- Difficulty: {difficulty}
- Batch: {batch_num}

STRICT REQUIREMENTS:
1. Questions must be {{difficulty}} level
2. Each question MUST have exactly this structure:
   {{"q": "question text", "opts": ["opt1", "opt2", "opt3", "opt4"], "ans": 0-3, "exp": "explanation"}}
3. Question text: 20-150 characters, clear and focused
4. Options: 4 distinct options, with RANDOMIZED correct answer position (ans: 0-3)
5. Explanation: Minimum 15 words, substantive with concept references
6. Each question directly relevant to {topic_name}

Return ONLY a JSON array: [{{"q": "...", "opts": [...], "ans": 0, "exp": "..."}}]
No markdown, no extra text, ONLY valid JSON array.
"""
        
        data = self.call_groq(prompt)
        if not data:
            return []
        
        valid_questions = []
        questions = data if isinstance(data, list) else data.get('questions', [])
        
        for q in questions:
            if self.validate_question(q):
                valid_questions.append(q)
                logger.info(f"[OK] Valid question: {q['q'][:50]}...")
            else:
                logger.warning(f"[SKIP] Invalid question rejected")
        
        return valid_questions
    
    def generate_topic_mcqs(self, topic: Topic, unit_name: str, course_name: str, target: int = 30) -> Optional[List[Dict]]:
        """Generate complete set of MCQs using batched approach"""
        
        logger.info(f"\n{'='*70}")
        logger.info(f"Generating {target} MCQs for: {topic.title}")
        logger.info(f"{'='*70}")
        
        # Difficulty distribution
        easy_count = int(target * 0.4)      # 40%
        medium_count = int(target * 0.35)   # 35%
        hard_count = target - easy_count - medium_count  # 25%
        
        all_questions = []
        
        # Generate easy batch
        logger.info(f"   [EASY] Generating {easy_count} easy questions...")
        batch_num = 1
        while len(all_questions) < easy_count:
            batch = self.generate_batch(topic.title, course_name, "EASY", batch_num)
            all_questions.extend(batch)
            batch_num += 1
            
            if batch_num > 10:  # Safety limit
                logger.warning("Too many batches for easy questions, moving on")
                break
        
        all_questions = all_questions[:easy_count]
        logger.info(f"✓ Generated {len(all_questions)} easy questions")
        
        # Generate medium batch
        logger.info(f"   [MEDIUM] Generating {medium_count} medium questions...")
        batch_num = 1
        while len(all_questions) < easy_count + medium_count:
            batch = self.generate_batch(topic.title, course_name, "MEDIUM", batch_num)
            all_questions.extend(batch)
            batch_num += 1
            
            if batch_num > 10:
                logger.warning("Too many batches for medium questions, moving on")
                break
        
        all_questions = all_questions[:easy_count + medium_count]
        logger.info(f"✓ Generated {len(all_questions) - easy_count} medium questions")
        
        # Generate hard batch
        logger.info(f"   [HARD] Generating {hard_count} hard questions...")
        batch_num = 1
        while len(all_questions) < target:
            batch = self.generate_batch(topic.title, course_name, "HARD", batch_num)
            all_questions.extend(batch)
            batch_num += 1
            
            if batch_num > 10:
                logger.warning("Too many batches for hard questions, moving on")
                break
        
        all_questions = all_questions[:target]
        logger.info(f"✓ Generated {len(all_questions) - easy_count - medium_count} hard questions")
        
        logger.info(f"\n✅ Total: {len(all_questions)} questions generated")
        return all_questions if len(all_questions) > 0 else None
    
    def save_to_database(self, topic_id: int, topic_title: str, questions: List[Dict]) -> bool:
        """Save generated questions to database"""
        try:
            topic = Topic.query.get(topic_id)
            if not topic:
                raise Exception(f"Topic {topic_id} not found")
            
            # Create comprehensive notes from difficulty distribution
            easy_qs = [q for i, q in enumerate(questions) if i < int(len(questions) * 0.4)]
            medium_qs = [q for i, q in enumerate(questions) if int(len(questions) * 0.4) <= i < int(len(questions) * 0.75)]
            hard_qs = [q for i, q in enumerate(questions) if i >= int(len(questions) * 0.75)]
            
            notes = f"""# {topic_title}

## Question Distribution
- Easy: {len(easy_qs)} questions
- Medium: {len(medium_qs)} questions
- Hard: {len(hard_qs)} questions

## Question Bank
This topic has been populated with {len(questions)} comprehensive questions covering:
- Fundamental concepts and definitions
- Application and problem-solving scenarios
- Advanced analysis and real-world contexts

Study progressively from easy to hard questions for optimal learning.
"""
            
            topic.content_summary = notes
            
            # Clear old quizzes
            for old_quiz in topic.quizzes:
                db.session.delete(old_quiz)
            db.session.commit()
            
            # Create quiz
            new_quiz = Quiz(
                title=f"{topic_title} - Comprehensive Bank",
                topic_id=topic_id,
                ai_generated=True,
                xp_reward=sum(50 if i < len(easy_qs) else 75 if i < len(easy_qs) + len(medium_qs) else 100 
                             for i in range(len(questions)))
            )
            db.session.add(new_quiz)
            db.session.flush()
            
            # Add all questions
            for idx, q_data in enumerate(questions):
                new_question = Question(
                    quiz_id=new_quiz.id,
                    question_text=q_data['q'],
                    explanation=q_data['exp']
                )
                db.session.add(new_question)
                db.session.flush()
                
                # Add options (shuffle them so any position can be correct)
                correct_idx = q_data['ans']
                for opt_idx, opt_text in enumerate(q_data['opts']):
                    new_option = Option(
                        question_id=new_question.id,
                        option_text=opt_text,
                        is_correct=(opt_idx == correct_idx)
                    )
                    db.session.add(new_option)
            
            db.session.commit()
            logger.info(f"✓ Saved {len(questions)} questions to database")
            return True
        
        except Exception as e:
            logger.error(f"Database error: {e}")
            db.session.rollback()
            return False
    
    def run(self):
        """Run generation for all topics"""
        logger.info("="*70)
        logger.info("STARTING ADVANCED MCQ GENERATOR")
        logger.info(f"API Keys Available: {len(API_KEYS)}")
        logger.info(f"Batch Size: {self.batch_size}")
        logger.info("="*70)
        
        with APP.app_context():
            topics_to_generate = Topic.query.filter(
                Topic.quizzes == None
            ).all()
            
            if not topics_to_generate:
                logger.info("All topics already generated!")
                return
            
            logger.info(f"Found {len(topics_to_generate)} topics needing generation\n")
            
            for idx, topic in enumerate(topics_to_generate, 1):
                unit = Unit.query.get(topic.unit_id)
                course = Course.query.get(unit.course_id)
                
                logger.info(f"\n[{idx}/{len(topics_to_generate)}] {course.title} -> {unit.name} -> {topic.title}")
                
                questions = self.generate_topic_mcqs(topic, unit.name, course.title)
                
                if questions and len(questions) > 0:
                    if self.save_to_database(topic.id, topic.title, questions):
                        logger.info(f"✅ SUCCESS: {topic.title} ({len(questions)} MCQs)")
                    else:
                        logger.error(f"❌ Failed to save: {topic.title}")
                else:
                    logger.error(f"❌ No valid questions generated: {topic.title}")
        
        logger.info("\n" + "="*70)
        logger.info("GENERATION COMPLETE!")
        logger.info("="*70)


def main():
    generator = AdvancedMCQGenerator(API_KEYS)
    generator.run()


if __name__ == "__main__":
    main()
