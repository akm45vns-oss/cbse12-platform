import os
import sys
import json
import time
import re
from dotenv import load_dotenv
from groq import Groq

# Ensure backend directory is in sys.path to import models and app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from models import db
from models.course import Course, Unit, Topic
from models.quiz import Quiz, Question, Option

# Load environment variables
load_dotenv()

# Initialize Groq client
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    print("CRITICAL ERROR: GROQ_API_KEY not found in environment variables. Please check your .env file.")
    sys.exit(1)

client = Groq(api_key=api_key)

APP = create_app()

def call_groq_api(prompt, retries=5):
    for i in range(retries):
        try:
            print("  -> Asking Groq LLM...")
            # We use LLaMA 3 for fast, smart, json-capable generation
            chat_completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a senior academic curriculum expert. Ensure responses are valid, escaped JSON strings ONLY. Do not wrap in ```json markers. Do not add conversational text."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model="llama-3.3-70b-versatile",  # High reasoning 70B Model fixes JSON breaks and has higher daily limits
                temperature=0.5, 
                max_tokens=4000,
                response_format={"type": "json_object"}
            )
            response_text = chat_completion.choices[0].message.content
            # Guard against the 12000 TPM limit of 70b-versatile
            print(f"  -> Cooldown initiated: Sleeping 35 seconds to safely regenerate 70b tokens...")
            time.sleep(35)
            return json.loads(response_text)
        except Exception as e:
            error_str = str(e).lower()
            if "rate_limit" in error_str or "429" in error_str:
                print(f"  -> RATE LIMIT HIT. Sleeping for 90 seconds to refresh bucket...")
                time.sleep(90)
            else:
                print(f"  -> Error calling Groq API: {e}. Retrying in {2**(i+1)}s...")
                time.sleep(2**(i+1))
    return None

def process_topic(topic, unit_name, course_name):
    # Call 1: Detailed Notes + First 15 MCQs
    prompt1 = f"""
    You are an AI generating educational content. Course: {course_name}, Unit: {unit_name}, Topic: {topic.title}.
    TASK 1: Generate EXTREMELY DETAILED technical notes for this topic. Write 3-5 comprehensive paragraphs using Markdown.
    TASK 2: Generate exactly 15 Multiple Choice Questions (MCQs) for this topic. Each must have 4 options, 1 correct, and a detailed explanation.
    Respond with a valid JSON matching:
    {{
        "content_summary": "# Your detailed markdown notes...",
        "quizzes": [{{"title": "{topic.title} Challenge Part 1", "questions": [ {{"question_text": "...", "explanation": "...", "options": [ {{"option_text": "...", "is_correct": true}}, {{"option_text": "...", "is_correct": false}} ]}} ] }}]
    }}
    """
    
    print(f"    - Fetching Part 1 (Notes + 15 MCQs)...")
    res1 = call_groq_api(prompt1, retries=5)
    
    # Call 2: Final 15 MCQs
    prompt2 = f"""
    Course: {course_name}, Unit: {unit_name}, Topic: {topic.title}.
    Generate exactly 15 BRAND NEW Multiple Choice Questions (different from basics).
    Respond with a valid JSON exactly like this:
    {{
        "quizzes": [{{"title": "{topic.title} Challenge Part 2", "questions": [ {{"question_text": "...", "explanation": "...", "options": [{{"option_text": "...", "is_correct": true}}, {{"option_text": "...", "is_correct": false}}]}} ] }}]
    }}
    """
    print(f"    - Fetching Part 2 (Final 15 MCQs)...")
    res2 = call_groq_api(prompt2, retries=5)
    
    if not res1 or not res2:
        print(f"  -> Failed generating complete chunk for {topic.title}")
        return False
        
    try:
        topic.content_summary = res1.get('content_summary', topic.content_summary)
        
        # Clear old quizzes
        for old_quiz in topic.quizzes:
            db.session.delete(old_quiz)
        db.session.commit()
        
        # Combine quizzes
        all_quizzes = res1.get('quizzes', []) + res2.get('quizzes', [])
        
        total_q = 0
        for qz_data in all_quizzes:
            new_quiz = Quiz(title=qz_data.get('title', f"{topic.title} Quiz"), topic_id=topic.id)
            db.session.add(new_quiz)
            db.session.flush()
            
            for ques_data in qz_data.get('questions', []):
                new_q = Question(quiz_id=new_quiz.id, question_text=ques_data.get('question_text', ''), explanation=ques_data.get('explanation', ''))
                db.session.add(new_q)
                db.session.flush()
                total_q += 1
                for opt_data in ques_data.get('options', []):
                    db.session.add(Option(question_id=new_q.id, option_text=opt_data.get('option_text', ''), is_correct=opt_data.get('is_correct', False)))
                    
        db.session.commit()
        print(f"  -> SUCCESS! Detailed notes and {total_q} MCQs inserted.")
    except Exception as e:
        print(f"  -> Error: {e}")
        db.session.rollback()

def run_seeder():
    with APP.app_context():
        courses = Course.query.all()
        for course in courses:
            print(f"\n=========================================")
            print(f"Upgrading Target: {course.title}")
            print(f"=========================================")
            for unit in Unit.query.filter_by(course_id=course.id).all():
                print(f"\n  [Unit] {unit.name}")
                for topic in Topic.query.filter_by(unit_id=unit.id).all():
                    print(f"    [Topic] {topic.title}...")
                    process_topic(topic, unit.name, course.title)

if __name__ == "__main__":
    print("Starting LLM Curriculum Expander...")
    run_seeder()
    print("\nGeneration Complete! Your curriculum is now massive!")
