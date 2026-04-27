from models import db
from datetime import datetime

class Course(db.Model):
    __tablename__ = 'courses'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    units = db.relationship('Unit', backref='course', lazy=True, cascade='all, delete-orphan')

class Unit(db.Model):
    __tablename__ = 'units'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    difficulty = db.Column(db.String(50), nullable=True)
    base_xp = db.Column(db.Integer, default=100)

    # Relationships
    topics = db.relationship('Topic', backref='unit', lazy=True, cascade='all, delete-orphan')

class Topic(db.Model):
    __tablename__ = 'topics'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    content_summary = db.Column(db.Text, nullable=True)

    # Relationships
    quizzes = db.relationship('Quiz', backref='topic', lazy=True, cascade='all, delete-orphan')
    progress = db.relationship('TopicProgress', backref='topic', lazy=True, cascade='all, delete-orphan')
