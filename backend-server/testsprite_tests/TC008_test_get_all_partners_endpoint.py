import requests

BASE_URL = "http://localhost:5001"
TIMEOUT = 30

def test_get_all_partners_endpoint():
    """
    Verify that the /api/partners GET endpoint returns a list of all partners 
    with correct data and respects authorization rules.
    """

    # Authentication credentials or token setup
    # Assuming JWT bearer token authentication for this endpoint.
    # Replace 'your_test_token' with a valid token for the test environment.
    token = "your_test_token"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }

    try:
        response = requests.get(f"{BASE_URL}/api/partners", headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to /api/partners failed: {e}"

    # Validate HTTP status code for authorized access
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    # Validate response content-type
    content_type = response.headers.get("Content-Type", "")
    assert "application/json" in content_type, f"Expected JSON response, got Content-Type: {content_type}"

    data = None
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate that the data is a list
    assert isinstance(data, list), f"Expected response data to be a list, got {type(data)}"

    # If there are partners, verify each partner has expected fields 
    # The exact fields are not specified, but common partner info might be id, name, email
    expected_fields = {"id", "name", "email"}

    for partner in data:
        assert isinstance(partner, dict), f"Each partner should be a dict, got {type(partner)}"
        missing_fields = expected_fields - partner.keys()
        assert not missing_fields, f"Partner item missing fields: {missing_fields}"

    # Additional authorization negative test:
    # Try without auth token and expect 401 or 403
    no_auth_response = None
    try:
        no_auth_response = requests.get(f"{BASE_URL}/api/partners", timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request without auth to /api/partners failed: {e}"

    assert no_auth_response.status_code in (401, 403), (
        f"Expected 401 or 403 for unauthorized request, got {no_auth_response.status_code}"
    )

test_get_all_partners_endpoint()