def test_health_route(test_app):
    client = test_app.test_client()
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json["status"] == "ok"

def test_app_exists(test_app):
    assert test_app is not None