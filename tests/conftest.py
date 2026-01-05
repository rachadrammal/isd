import os
import pytest

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
