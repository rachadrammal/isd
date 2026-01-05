import os
import sys
import pytest

# Ensure repo root is on sys.path so "backend" can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest

@pytest.fixture(scope="session")
def test_app():
    # Import inside the fixture so Postgres is ready
    from backend.app import app, db
    with app.app_context():
        db.create_all()
    yield app
    with app.app_context():
        db.drop_all()

def test_health_route(test_app):
    client = test_app.test_client()
    response = client.get("/health")
    assert response.status_code == 200

def test_app_exists():
    """Basic sanity check: app object is defined"""
    assert test_app is not None

    print("Starting test_app.py...")