import requests
import uuid

BASE_URL = "http://localhost:5001"
REGISTER_ENDPOINT = "/api/v1/auth/register"
TIMEOUT = 30

def test_user_registration_process():
    # Generate a unique email to avoid conflicts in repeated test runs
    unique_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    user_data = {
        "email": unique_email,
        "password": "TestPassword123!",
        "firstName": "Test",
        "lastName": "User"
    }
    headers = {
        "Content-Type": "application/json"
    }

    response = None
    try:
        response = requests.post(
            f"{BASE_URL}{REGISTER_ENDPOINT}",
            json=user_data,
            headers=headers,
            timeout=TIMEOUT
        )
        # Assert status code is 201 Created or 200 OK depending on implementation
        assert response.status_code in (200, 201), f"Unexpected status code: {response.status_code} - {response.text}"

        response_json = response.json()
        # Validate response contains expected user info but no password
        assert "id" in response_json, "Response missing user ID"
        assert response_json.get("email") == unique_email, "Email in response does not match"
        assert "password" not in response_json, "Password should not be returned in response"
        # Additional user fields validation if available
        assert response_json.get("firstName") == user_data["firstName"], "First name does not match"
        assert response_json.get("lastName") == user_data["lastName"], "Last name does not match"

        # Optionally, verify user data stored by fetching from /api/users/{id} if available
        user_id = response_json["id"]
        get_response = requests.get(
            f"{BASE_URL}/api/v1/users/{user_id}",
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT
        )
        assert get_response.status_code == 200, f"Failed to fetch registered user: {get_response.text}"
        user_info = get_response.json()
        assert user_info.get("email") == unique_email, "Stored user email mismatch"
        assert user_info.get("firstName") == user_data["firstName"], "Stored user first name mismatch"
        assert user_info.get("lastName") == user_data["lastName"], "Stored user last name mismatch"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_user_registration_process()