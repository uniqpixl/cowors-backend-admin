import requests

BASE_URL = "http://localhost:5001"
TIMEOUT = 30

def test_user_logout_functionality():
    login_url = f"{BASE_URL}/api/v1/auth/login"
    logout_url = f"{BASE_URL}/api/v1/auth/logout"
    user_credentials = {
        "email": "testuser@example.com",
        "password": "TestPassword123!"
    }
    headers = {"Content-Type": "application/json"}

    try:
        # Log in the user to get a valid token
        login_response = requests.post(login_url, json=user_credentials, headers=headers, timeout=TIMEOUT)
        assert login_response.status_code == 200, f"Login failed with status {login_response.status_code}"
        login_data = login_response.json()
        assert "access_token" in login_data, "No access_token in login response"
        token = login_data["access_token"]

        auth_headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Call logout endpoint
        logout_response = requests.post(logout_url, headers=auth_headers, timeout=TIMEOUT)
        assert logout_response.status_code == 200, f"Logout failed with status {logout_response.status_code}"
        logout_data = logout_response.json()
        # Assuming logout returns some success message or empty object
        assert logout_data is not None, "Logout response empty"

        # Attempt to access a protected resource or logout again with the same token to ensure token invalidation
        second_logout_response = requests.post(logout_url, headers=auth_headers, timeout=TIMEOUT)
        assert second_logout_response.status_code == 401 or second_logout_response.status_code == 403, \
            "Token not invalidated after logout"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_user_logout_functionality()
