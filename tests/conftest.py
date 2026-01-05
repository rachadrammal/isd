import time
import psycopg2
import pytest
import os


@pytest.fixture(scope="session", autouse=True)
def wait_for_postgres():
    """Wait until Postgres is ready before running tests."""
    dsn = os.getenv("DATABASE_URL", "postgresql://companyuser:companypass123@localhost:5432/companydb")
    for i in range(10):  # retry up to ~30s
        try:
            conn = psycopg2.connect(dsn)
            conn.close()
            return  # success, DB is ready
        except psycopg2.OperationalError:
            time.sleep(3)
    raise RuntimeError("Postgres not ready after 30s")

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    # Import inside the fixture, not at module load
    from backend.app import app, db

    with app.app_context():
        db.create_all()
    yield
    with app.app_context():
        db.drop_all()