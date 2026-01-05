# tests/conftest.py
import pytest
from backend.app import create_app, db

@pytest.fixture(scope="session")
def test_app():
    app = create_app()
    with app.app_context():
        db.create_all()
    yield app
    with app.app_context():
        db.drop_all()