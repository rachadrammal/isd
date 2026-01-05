import time
import psycopg2
import pytest
import os




@pytest.fixture(scope="session", autouse=True)
def setup_database():
    # Import inside the fixture, not at module load
    from backend.app import app, db

    with app.app_context():
        db.create_all()
    yield
    with app.app_context():
        db.drop_all()