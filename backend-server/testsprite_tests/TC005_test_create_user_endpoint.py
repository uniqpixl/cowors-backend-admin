import requests

BASE_URL = "http://localhost:5001"
TIMEOUT = 30


def test_create_user_endpoint():
    url = f"{BASE_URL}/api/v1/users"
    headers = {
        "Content-Type": "application/json",
    }
    payload = {
        "username": "testuser_tc005",
        "email": "testuser_tc005@example.com",
        "password": "SecurePass123!"
    }

    response = None
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 201 or response.status_code == 200, f"Unexpected status code: {response.status_code}"
        data = response.json()
        assert "id" in data, "Response JSON does not contain user ID"
        assert data.get("username") == payload["username"], "Username in response does not match"
        assert data.get("email") == payload["email"], "Email in response does not match"
    finally:
        # Cleanup: delete created user if created
        if response is not None and response.status_code in (200, 201):
            user_id = response.json().get("id")
            if user_id:
                try:
                    requests.delete(f"{BASE_URL}/api/v1/users/{user_id}", timeout=TIMEOUT)
                except Exception:
                    pass


test_create_user_endpoint()