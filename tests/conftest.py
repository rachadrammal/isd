import pytest

@pytest.fixture(scope="session")
def test_app():
    from backend.app import app, db
    with app.app_context():
        db.create_all()
    yield app
    with app.app_context():
        db.drop_all()