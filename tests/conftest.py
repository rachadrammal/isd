import pytest
from backend import app as backend_app, db

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    # Import inside the fixture so Postgres is ready and DATABASE_URL is set
    application = backend_app.app  # or however you expose the Flask app
    with application.app_context():
        db.create_all()
    yield
    with application.app_context():
        db.drop_all()