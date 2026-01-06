import os
import pytest
import sys
import types

# Provide a fake yolo_webcam module so imports succeed
sys.modules['yolo_webcam'] = types.ModuleType('yolo_webcam')
sys.modules['yolo_webcam'].run_ai_on_frame = lambda frame: None

# 🔥 Force SQLite BEFORE app import
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["FLASK_ENV"] = "testing"

from backend.app import app, db


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    with app.app_context():
        db.create_all()
    yield
    with app.app_context():
        db.drop_all()
