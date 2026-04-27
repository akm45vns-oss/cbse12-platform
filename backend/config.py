import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-12345'
    
    # Database
    basedir = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'database.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Config directories
    FRONTEND_FOLDER = os.path.join(os.path.dirname(basedir), 'frontend')
    DATA_FOLDER = os.path.join(os.path.dirname(basedir), 'data')
