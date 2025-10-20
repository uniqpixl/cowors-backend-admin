import requests

BASE_URL = "http://localhost:5001"
TIMEOUT = 30

def test_update_user_endpoint():
    headers = {
        "Content-Type": "application/json"
    }

    # First create a user to update
    create_payload = {
        "username": "testuser_patch",
        "email": "testuser_patch@example.com",
        "password": "TestPass123!",
        "fullName": "Test User Patch"
    }

    user_id = None
    try:
        # Create user at auth register endpoint
        create_response = requests.post(
            f"{BASE_URL}/api/v1/auth/register",
            json=create_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert create_response.status_code == 201 or create_response.status_code == 200, \
            f"User creation failed: {create_response.status_code}, {create_response.text}"
        created_user = create_response.json()
        user_id = created_user.get("id")
        assert user_id is not None, "Created user ID not found in response"

        # Update user valid info
        update_payload = {
            "fullName": "Updated Test User",
            "email": "updated_patch_email@example.com"
        }
        patch_response = requests.patch(
            f"{BASE_URL}/api/v1/users/{user_id}",
            json=update_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert patch_response.status_code == 200, \
            f"User update failed: {patch_response.status_code}, {patch_response.text}"
        updated_user = patch_response.json()
        # Validate updated fields
        assert updated_user.get("fullName") == update_payload["fullName"], "FullName not updated"
        assert updated_user.get("email") == update_payload["email"], "Email not updated"

        # Attempt update with invalid data (e.g., invalid email format)
        invalid_update_payload = {
            "email": "invalid-email-format"
        }
        invalid_response = requests.patch(
            f"{BASE_URL}/api/v1/users/{user_id}",
            json=invalid_update_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        # Expecting 400 Bad Request or validation error status code
        assert invalid_response.status_code == 400 or invalid_response.status_code == 422, \
            f"Invalid update did not fail as expected: {invalid_response.status_code}, {invalid_response.text}"

    finally:
        # Cleanup user if created - no delete user endpoint specified in PRD so skip
        pass

test_update_user_endpoint()
