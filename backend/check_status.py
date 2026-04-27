import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db
from models.course import Course, Unit, Topic
from models.quiz import Quiz, Question, Option

app = create_app()
lines = []
with app.app_context():
    courses = Course.query.all()
    for c in courses:
        lines.append(f'\n=== {c.title} ===')
        units = Unit.query.filter_by(course_id=c.id).all()
        for u in units:
            topics = Topic.query.filter_by(unit_id=u.id).all()
            for t in topics:
                quizzes = Quiz.query.filter_by(topic_id=t.id).all()
                q_count = sum(Question.query.filter_by(quiz_id=qz.id).count() for qz in quizzes)
                notes_len = len(t.content_summary) if t.content_summary else 0
                needs_llm = 'NEEDS_LLM' if q_count < 25 or notes_len < 500 else 'OK'
                lines.append(f'  topic_id={t.id} | {t.title} | notes={notes_len}chars | {len(quizzes)} quizzes | {q_count} questions | {needs_llm}')

with open(r'c:\Users\akm45\Desktop\smart_study_hub\detailed_status.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print("Done. Written to detailed_status.txt")
