import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    FLASK_ENV = os.environ.get('FLASK_ENV', 'development')

    db_url = os.getenv("DATABASE_URL")
    if db_url:
        SQLALCHEMY_DATABASE_URI = db_url + "?connect_timeout=5"
    else:
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.environ.get('SQLALCHEMY_ECHO', 'False').lower() == 'true'