from models import db
from datetime import datetime

class Quiz(db.Model):
    __tablename__ = 'quizzes'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    topic_id = db.Column(db.Integer, db.ForeignKey('topics.id'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    xp_reward = db.Column(db.Integer, default=50)
    ai_generated = db.Column(db.Boolean, default=False)

    # Relationships
    questions = db.relationship('Question', backref='quiz', lazy=True, cascade='all, delete-orphan')
    attempts = db.relationship('QuizAttempt', backref='quiz', lazy=True, cascade='all, delete-orphan')

class Question(db.Model):
    __tablename__ = 'questions'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    explanation = db.Column(db.Text, nullable=True)

    # Relationships
    options = db.relationship('Option', backref='question', lazy=True, cascade='all, delete-orphan')

class Option(db.Model):
    __tablename__ = 'options'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
    option_text = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, default=False, nullable=False)
