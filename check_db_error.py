import sys
import traceback
sys.path.append('backend')

try:
    # Create app and set up database
    from app import create_app
    app = create_app()
    
    # Now query within app context
    with app.app_context():
        # Get the db instance that was initialized with the app
        from models import db
        
        # Simple raw SQL query to count
        from sqlalchemy import text
        quiz_count = db.session.execute(text("SELECT COUNT(*) as cnt FROM quizzes")).scalar()
        question_count = db.session.execute(text("SELECT COUNT(*) as cnt FROM questions")).scalar()
        
        print(f"SUCCESS: Database connection active")
        print(f"Total AI-Generated Quizzes: {quiz_count}")
        print(f"Total MCQ Questions: {question_count}")
        
except Exception as e:
    with open("db_error.txt", "w"  ) as f:
        traceback.print_exc(file=f)
    print(f"FAILED: Check db_error.txt for details")
