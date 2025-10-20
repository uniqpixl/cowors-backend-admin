import requests

BASE_URL = "http://localhost:5001/api/v1"
USERS_ENDPOINT = f"{BASE_URL}/users"
LOGIN_ENDPOINT = "http://localhost:5001/api/auth/login"
TIMEOUT = 30

# Replace these with valid credentials for an authorized user with permission to get all users
AUTH_USER_CREDENTIALS = {
    "email": "admin@example.com",
    "password": "StrongPassword123!"
}


def test_get_all_users_endpoint():
    # Step 1: Login to get JWT token for authorization
    try:
        login_response = requests.post(
            LOGIN_ENDPOINT,
            json=AUTH_USER_CREDENTIALS,
            timeout=TIMEOUT
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        login_data = login_response.json()
        assert "access_token" in login_data, "Missing access_token in login response"
        token = login_data["access_token"]
    except (requests.RequestException, AssertionError) as e:
        raise AssertionError(f"Authentication step failed: {e}")

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Step 2: Request GET /api/users with the token
    try:
        response = requests.get(USERS_ENDPOINT, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        raise AssertionError(f"GET /api/users request failed: {e}")

    # Step 3: Validate response status code and content-type
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    content_type = response.headers.get("Content-Type", "")
    assert "application/json" in content_type, f"Expected JSON response, got Content-Type: {content_type}"

    # Step 4: Validate response data structure
    try:
        users = response.json()
    except ValueError:
        raise AssertionError("Response is not valid JSON")

    assert isinstance(users, list), "Expected response to be a list of users"

    # If there are users, validate keys of the first user (to check data correctness)
    if users:
        user = users[0]
        assert isinstance(user, dict), "Each user should be a JSON object"
        expected_keys = {"id", "email", "username", "roles", "createdAt", "updatedAt"}
        # roles could be string or list, accept presence key only
        missing_keys = expected_keys - user.keys()
        assert not missing_keys, f"User object missing keys: {missing_keys}"

    # Step 5: Test authorization - try request without token and expect 401 or 403
    try:
        no_auth_response = requests.get(USERS_ENDPOINT, timeout=TIMEOUT)
    except requests.RequestException as e:
        raise AssertionError(f"GET /api/users without auth failed: {e}")

    assert no_auth_response.status_code in (401, 403), \
        f"Expected 401 or 403 for unauthorized request, got {no_auth_response.status_code}"


test_get_all_users_endpoint()
