def test_health_check(test_client):
    response = test_client.get("/api/")
    print(response.data, flush=True)
    assert response.status_code == 200
    assert response.data == b'{"hello": "I\'m alive and healthy! Super healthy :D"}\n'
