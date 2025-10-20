import requests

BASE_URL = "http://localhost:5001"
TIMEOUT = 30

# Placeholder function to get a valid auth token for testing
# In real scenario, this should fetch or generate a valid token
# Here we just assume a token string for illustration

def get_auth_token():
    return "Bearer test-valid-token"


def test_create_partner_endpoint():
    url = f"{BASE_URL}/api/partners"
    headers = {
        "Content-Type": "application/json",
        "Authorization": get_auth_token()
    }
    # Sample valid input data for creating a partner
    partner_data = {
        "name": "Test Partner Inc.",
        "email": "contact@testpartner.example.com",
        "phone": "+1234567890",
        "address": "123 Cowork St, Worktown",
        "description": "A test partner for coworking spaces",
        "website": "https://testpartner.example.com"
    }
    partner_id = None
    try:
        response = requests.post(url, json=partner_data, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 201, f"Expected status code 201, got {response.status_code}"
        response_json = response.json()
        assert "id" in response_json, "Response JSON does not contain 'id'"
        partner_id = response_json["id"]
        assert isinstance(partner_id, (int, str)), "Partner ID is not int or str"
        assert response_json.get("name") == partner_data["name"], "Partner name does not match"
        assert response_json.get("email") == partner_data["email"], "Partner email does not match"
    finally:
        if partner_id:
            try:
                delete_url = f"{BASE_URL}/api/partners/{partner_id}"
                del_resp = requests.delete(delete_url, headers=headers, timeout=TIMEOUT)
                # The deletion may respond with 204 No Content or 200 OK depending on implementation
                assert del_resp.status_code in (200, 204), f"Failed to delete partner with id {partner_id}"
            except Exception as e:
                print(f"Cleanup failed: could not delete partner with id {partner_id}. Error: {e}")


test_create_partner_endpoint()