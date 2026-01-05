# tests/conftest.py
import pytest

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    # Import inside the fixture so it only runs once Postgres is ready
    from backend.app import app, db

    # Create all tables before tests
    with app.app_context():
        db.create_all()

    yield app  # provide the app to tests

    # Drop tables after tests
    with app.app_context():
        db.drop_all()