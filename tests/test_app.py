import pytest
from src.backend.app_ import app

# Use Flask test client for testing routes
@pytest.fixture
def client():
    with app.test_client() as client:
        yield client

# Test /hello route
def test_hello(client):
    response = client.get('/hello')
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['message'] == "Hello, world!"

# Test /add route
def test_add_numbers(client):
    response = client.post('/add', json={'a': 2, 'b': 3})
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['result'] == 5

    # Test with negative numbers
    response = client.post('/add', json={'a': -1, 'b': 4})
    json_data = response.get_json()
    assert json_data['result'] == 3
