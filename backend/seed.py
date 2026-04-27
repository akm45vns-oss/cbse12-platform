import os
import json
import sys

# Ensure backend directory is in the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db
from models.course import Course, Unit, Topic
from models.quiz import Quiz, Question, Option
from models.gamification import Badge

def clear_data():
    """Clear existing data to avoid duplicates."""
    db.session.query(Option).delete()
    db.session.query(Question).delete()
    db.session.query(Quiz).delete()
    db.session.query(Topic).delete()
    db.session.query(Unit).delete()
    db.session.query(Course).delete()
    db.session.query(Badge).delete()
    db.session.commit()
    print("Old data cleared.")

def seed_database():
    app = create_app()
    with app.app_context():
        clear_data()
        
        data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'syllabus.json')
        if not os.path.exists(data_path):
            print(f"Error: {data_path} not found.")
            return

        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        courses_data = data.get('courses', [])
        
        total_courses, total_units, total_topics, total_quizzes, total_questions = 0, 0, 0, 0, 0
        total_badges = 0

        for course_data in courses_data:
            c = Course(
                title=course_data.get('course', 'Untitled Course'),
                description=course_data.get('description', '')
            )
            db.session.add(c)
            db.session.flush() # get c.id
            total_courses += 1
            
            # Seed Badges for this course if they exist
            gamification = course_data.get('gamification', {})
            badges = gamification.get('badges', [])
            for badge_data in badges:
                b = Badge(
                    name=badge_data.get('name'),
                    description=badge_data.get('condition', ''),
                    icon_url=badge_data.get('icon', '')
                )
                db.session.add(b)
                total_badges += 1

            # Seed Units
            for unit_data in course_data.get('units', []):
                u = Unit(
                    course_id=c.id,
                    name=unit_data.get('unit_name', 'Untitled Unit'),
                    difficulty=unit_data.get('difficulty', 'Medium'),
                    base_xp=unit_data.get('xp', 100)
                )
                db.session.add(u)
                db.session.flush()
                total_units += 1

                # Seed Topics
                for topic_data in unit_data.get('topics', []):
                    # Combine subtopic notes to form content summary
                    subtopics = topic_data.get('subtopics', [])
                    summary_lines = []
                    for st in subtopics:
                        summary_lines.append(f"### {st.get('name')}")
                        if st.get('notes'):
                            summary_lines.append(st.get('notes'))
                    
                    t = Topic(
                        unit_id=u.id,
                        title=topic_data.get('topic_name', 'Untitled Topic'),
                        content_summary='\n\n'.join(summary_lines)
                    )
                    db.session.add(t)
                    db.session.flush()
                    total_topics += 1

                    # Collect all MCQs from all subtopics to form a single Quiz for this Topic
                    all_mcqs = []
                    for st in subtopics:
                        all_mcqs.extend(st.get('mcqs', []))

                    if all_mcqs:
                        q = Quiz(
                            topic_id=t.id,
                            title=f"Quiz: {t.title}",
                            xp_reward=50,
                            ai_generated=False
                        )
                        db.session.add(q)
                        db.session.flush()
                        total_quizzes += 1

                        # Seed Questions and Options
                        for mcq in all_mcqs:
                            question = Question(
                                quiz_id=q.id,
                                question_text=mcq.get('question'),
                                explanation=mcq.get('explanation', '')
                            )
                            db.session.add(question)
                            db.session.flush()
                            total_questions += 1

                            # Seed Options
                            correct_answer = mcq.get('answer', '')
                            for opt_text in mcq.get('options', []):
                                is_correct = (opt_text == correct_answer)
                                option = Option(
                                    question_id=question.id,
                                    option_text=opt_text,
                                    is_correct=is_correct
                                )
                                db.session.add(option)

        db.session.commit()
        print("Database seeded successfully!")
        print(f"Metrics: {total_courses} courses, {total_units} units, {total_topics} topics")
        print(f"         {total_quizzes} quizzes, {total_questions} questions, {total_badges} badges")


if __name__ == '__main__':
    seed_database()
