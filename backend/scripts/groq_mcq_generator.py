#!/usr/bin/env python3
"""
Smart Study Hub - Groq LLM MCQ & Notes Generator
Generates high-quality multiple-choice questions and comprehensive notes for each chapter/topic
using the Groq API with LLaMA 3.3 70B model.
"""

import os
import sys
import json
import time
import logging
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
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Groq client
API_KEY = os.getenv("GROQ_API_KEY")
if not API_KEY:
    logger.error("GROQ_API_KEY not found in .env file")
    sys.exit(1)

client = Groq(api_key=API_KEY)
APP = create_app()

class GroqMCQGenerator:
    """Generates MCQs and notes using Groq's LLaMA 3.3 model"""
    
    def __init__(self, model: str = "llama-3.3-70b-versatile", temperature: float = 0.7, max_retries: int = 3):
        self.model = model
        self.temperature = temperature
        self.max_retries = max_retries
        self.rate_limit_delay = 35  # Seconds
        
    def call_groq(self, prompt: str, json_mode: bool = True) -> Optional[Dict[str, Any]]:
        """
        Call Groq API with retry logic and rate limit handling.
        
        Args:
            prompt: The prompt to send to Groq
            json_mode: Whether to expect JSON response
            
        Returns:
            Parsed JSON response or None if failed
        """
        for attempt in range(self.max_retries):
            try:
                logger.info(f"Calling Groq API (attempt {attempt + 1}/{self.max_retries})...")
                
                chat_completion = client.chat.completions.create(
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert educational content creator. Generate accurate, engaging, and well-explained educational materials. Return ONLY valid JSON, no markdown code blocks or extra text."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    model=self.model,
                    temperature=self.temperature,
                    max_tokens=4000,
                    response_format={"type": "json_object"} if json_mode else None
                )
                
                response_text = chat_completion.choices[0].message.content
                
                # Apply rate limit delay
                logger.info(f"Rate limit cooldown: waiting {self.rate_limit_delay}s...")
                time.sleep(self.rate_limit_delay)
                
                return json.loads(response_text)
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** (attempt + 1))
                continue
                
            except Exception as e:
                error_msg = str(e).lower()
                
                if "rate_limit" in error_msg or "429" in error_msg:
                    wait_time = 90
                    logger.warning(f"Rate limit hit. Waiting {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"API Error: {e}")
                    if attempt < self.max_retries - 1:
                        time.sleep(2 ** (attempt + 1))
                
                if attempt == self.max_retries - 1:
                    return None
        
        return None
    
    def generate_notes_and_mcqs_part1(self, topic: Topic, unit_name: str, course_name: str) -> Optional[Dict]:
        """Generate detailed notes and first 15 MCQs"""
        prompt = f"""
Generate educational content for:
- Course: {course_name}
- Unit: {unit_name}
- Topic: {topic.title}

REQUIREMENTS:
1. Create EXTREMELY DETAILED technical notes (500+ words) in Markdown format with headers, bullet points, examples
2. Generate exactly 15 DIFFERENT multiple-choice questions

Each question MUST have:
- Clear question text
- Exactly 4 unique options
- Exactly 1 correct answer (marked with "is_correct": true)
- Detailed explanation (2-3 sentences)

Return VALID JSON ONLY (no markdown code blocks):
{{
    "content_summary": "# Topic Title\\n\\nDetailed markdown notes here...",
    "quizzes": [
        {{
            "title": "{topic.title} Challenge Part 1",
            "questions": [
                {{
                    "question_text": "Question here?",
                    "explanation": "Why this is correct...",
                    "options": [
                        {{"option_text": "Correct answer", "is_correct": true}},
                        {{"option_text": "Wrong answer 1", "is_correct": false}},
                        {{"option_text": "Wrong answer 2", "is_correct": false}},
                        {{"option_text": "Wrong answer 3", "is_correct": false}}
                    ]
                }}
            ]
        }}
    ]
}}
"""
        logger.info(f"Generating Part 1 (Notes + 15 MCQs) for '{topic.title}'...")
        return self.call_groq(prompt)
    
    def generate_mcqs_part2(self, topic: Topic, course_name: str) -> Optional[Dict]:
        """Generate another 15 advanced MCQs"""
        prompt = f"""
Generate exactly 15 NEW (DIFFERENT) advanced multiple-choice questions for:
- Course: {course_name}
- Topic: {topic.title}

Each must have 4 options, 1 correct, and explanation.
Focus on: Applications, edge cases, advanced concepts, real-world scenarios.

Return VALID JSON ONLY:
{{
    "quizzes": [
        {{
            "title": "{topic.title} Challenge Part 2",
            "questions": [
                {{
                    "question_text": "Advanced question?",
                    "explanation": "Explanation here...",
                    "options": [
                        {{"option_text": "Correct", "is_correct": true}},
                        {{"option_text": "Wrong 1", "is_correct": false}},
                        {{"option_text": "Wrong 2", "is_correct": false}},
                        {{"option_text": "Wrong 3", "is_correct": false}}
                    ]
                }}
            ]
        }}
    ]
}}
"""
        logger.info(f"Generating Part 2 (15 Advanced MCQs) for '{topic.title}'...")
        return self.call_groq(prompt)
    
    def save_to_database(self, topic: Topic, notes: str, quizzes_data: List[Dict]) -> bool:
        """Save generated content to database"""
        try:
            # Update notes
            topic.content_summary = notes
            
            # Remove old quizzes
            for old_quiz in topic.quizzes:
                db.session.delete(old_quiz)
            db.session.commit()
            
            # Add new quizzes
            total_questions = 0
            for quiz_data in quizzes_data:
                new_quiz = Quiz(
                    title=quiz_data.get('title', f"{topic.title} Quiz"),
                    topic_id=topic.id,
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
                        new_option = Option(
                            question_id=new_question.id,
                            option_text=option_data.get('option_text', ''),
                            is_correct=option_data.get('is_correct', False)
                        )
                        db.session.add(new_option)
            
            db.session.commit()
            logger.info(f"✓ Saved to database: {total_questions} questions + comprehensive notes")
            return True
            
        except Exception as e:
            logger.error(f"Database error: {e}")
            db.session.rollback()
            return False
    
    def process_topic(self, topic: Topic, unit_name: str, course_name: str) -> bool:
        """Generate and save MCQs and notes for a topic"""
        logger.info(f"\n{'='*60}")
        logger.info(f"Processing Topic: {topic.title}")
        logger.info(f"{'='*60}")
        
        # Generate Part 1
        part1_data = self.generate_notes_and_mcqs_part1(topic, unit_name, course_name)
        if not part1_data:
            logger.error(f"Failed to generate Part 1 for {topic.title}")
            return False
        
        # Generate Part 2
        part2_data = self.generate_mcqs_part2(topic, course_name)
        if not part2_data:
            logger.error(f"Failed to generate Part 2 for {topic.title}")
            return False
        
        # Combine data
        notes = part1_data.get('content_summary', '')
        all_quizzes = part1_data.get('quizzes', []) + part2_data.get('quizzes', [])
        
        # Save to database
        success = self.save_to_database(topic, notes, all_quizzes)
        
        if success:
            logger.info(f"✓ Successfully processed: {topic.title}")
        else:
            logger.error(f"✗ Failed to save: {topic.title}")
        
        return success
    
    def run(self, course_filter: Optional[str] = None, unit_filter: Optional[str] = None):
        """Run the MCQ generation for all courses/units/topics"""
        with APP.app_context():
            courses = Course.query.all()
            
            if not courses:
                logger.warning("No courses found in database!")
                return
            
            total_topics = 0
            successful_topics = 0
            
            for course in courses:
                if course_filter and course.title.lower() != course_filter.lower():
                    continue
                
                logger.info(f"\n{'#'*60}")
                logger.info(f"Course: {course.title}")
                logger.info(f"{'#'*60}")
                
                units = Unit.query.filter_by(course_id=course.id).all()
                
                for unit in units:
                    if unit_filter and unit.name.lower() != unit_filter.lower():
                        continue
                    
                    logger.info(f"\n  Unit: {unit.name}")
                    
                    topics = Topic.query.filter_by(unit_id=unit.id).all()
                    
                    for topic in topics:
                        total_topics += 1
                        if self.process_topic(topic, unit.name, course.title):
                            successful_topics += 1
            
            logger.info(f"\n{'='*60}")
            logger.info(f"GENERATION COMPLETE!")
            logger.info(f"Successfully processed: {successful_topics}/{total_topics} topics")
            logger.info(f"{'='*60}\n")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Generate MCQs and notes using Groq API"
    )
    parser.add_argument(
        '--course',
        type=str,
        help='Filter by course name (optional)'
    )
    parser.add_argument(
        '--unit',
        type=str,
        help='Filter by unit name (optional)'
    )
    parser.add_argument(
        '--temperature',
        type=float,
        default=0.7,
        help='LLM temperature (0.0-1.0, default: 0.7)'
    )
    parser.add_argument(
        '--model',
        type=str,
        default='llama-3.3-70b-versatile',
        help='Groq model to use (default: llama-3.3-70b-versatile)'
    )
    
    args = parser.parse_args()
    
    logger.info("Starting Groq MCQ & Notes Generator...")
    logger.info(f"Model: {args.model}")
    logger.info(f"Temperature: {args.temperature}")
    if args.course:
        logger.info(f"Course Filter: {args.course}")
    if args.unit:
        logger.info(f"Unit Filter: {args.unit}")
    
    generator = GroqMCQGenerator(
        model=args.model,
        temperature=args.temperature
    )
    
    generator.run(course_filter=args.course, unit_filter=args.unit)


if __name__ == "__main__":
    main()
