import requests

BASE_URL = "http://localhost:5001"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json"
}

def test_get_user_by_id_endpoint():
    user_data = {
        "username": "testuser_tc006",
        "email": "testuser_tc006@example.com",
        "password": "TestPass123!"
    }

    # Create a user to test fetching by ID
    created_user = None
    try:
        create_resp = requests.post(
            f"{BASE_URL}/api/v1/users",
            json=user_data,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 201, f"User creation failed with status {create_resp.status_code}"
        created_user = create_resp.json()
        user_id = created_user.get("id") or created_user.get("user_id")
        assert user_id is not None, "Created user response does not contain 'id'"

        # Test fetching the created user by id
        get_resp = requests.get(
            f"{BASE_URL}/api/v1/users/{user_id}",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert get_resp.status_code == 200, f"Get user by ID failed with status {get_resp.status_code}"
        returned_user = get_resp.json()
        # Validate that returned user matches created user details (username and email at least)
        assert returned_user.get("id") == user_id or returned_user.get("user_id") == user_id
        assert returned_user.get("username") == user_data["username"]
        assert returned_user.get("email") == user_data["email"]

        # Test fetching user with invalid ID (e.g. a UUID unlikely to exist)
        invalid_id = "00000000-0000-0000-0000-000000000000"
        invalid_resp = requests.get(
            f"{BASE_URL}/api/v1/users/{invalid_id}",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        # Expect 404 Not Found or 400 Bad Request or similar error code for invalid ID
        assert invalid_resp.status_code in (400, 404), \
            f"Invalid user ID fetch did not fail as expected, got status {invalid_resp.status_code}"

    finally:
        # Cleanup: delete the created user if created
        if created_user:
            user_id = created_user.get("id") or created_user.get("user_id")
            if user_id:
                requests.delete(
                    f"{BASE_URL}/api/v1/users/{user_id}",
                    headers=HEADERS,
                    timeout=TIMEOUT
                )


test_get_user_by_id_endpoint()
