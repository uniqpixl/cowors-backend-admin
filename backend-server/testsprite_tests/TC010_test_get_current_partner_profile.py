import requests

BASE_URL = "http://localhost:5001"
TIMEOUT = 30

# Replace these with valid credentials for a partner user in the system
PARTNER_EMAIL = "partner@example.com"
PARTNER_PASSWORD = "strongpassword"

def get_auth_token(email: str, password: str) -> str:
    url = f"{BASE_URL}/api/auth/login"
    payload = {
        "email": email,
        "password": password
    }
    try:
        response = requests.post(url, json=payload, timeout=TIMEOUT)
        response.raise_for_status()
        data = response.json()
        token = data.get("access_token") or data.get("token") or data.get("jwt")
        if not token:
            raise ValueError("No token found in login response")
        return token
    except Exception as e:
        raise RuntimeError(f"Failed to login and get auth token: {e}")

def test_get_current_partner_profile():
    token = get_auth_token(PARTNER_EMAIL, PARTNER_PASSWORD)
    headers = {
        "Authorization": f"Bearer {token}"
    }
    url = f"{BASE_URL}/api/partners/me"
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
        data = response.json()
        # Basic validation of expected profile fields (minimal)
        assert "id" in data and isinstance(data["id"], (str, int)), "Profile missing 'id'"
        assert "email" in data and isinstance(data["email"], str), "Profile missing or invalid 'email'"
        assert "name" in data and isinstance(data["name"], str), "Profile missing or invalid 'name'"
    except requests.RequestException as e:
        raise RuntimeError(f"HTTP request failed: {e}")

test_get_current_partner_profile()