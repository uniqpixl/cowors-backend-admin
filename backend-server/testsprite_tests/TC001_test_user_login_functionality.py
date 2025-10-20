import requests

def test_user_login_functionality():
    base_url = "http://localhost:5001"
    login_url = f"{base_url}/api/v1/auth/login"
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    # These credentials should be valid in the test environment
    payload = {
        "username": "testuser",
        "password": "testpassword"
    }
    try:
        response = requests.post(login_url, json=payload, headers=headers, timeout=30)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        data = response.json()
        assert "access_token" in data or "token" in data, "JWT token not found in response"
        token = data.get("access_token") or data.get("token")
        assert isinstance(token, str) and len(token) > 0, "Invalid JWT token returned"
    except requests.RequestException as e:
        assert False, f"Request to login endpoint failed: {e}"

test_user_login_functionality()