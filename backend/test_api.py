import requests

BASE_URL = "http://127.0.0.1:8000/api"

# Test Registration
print("Testing Registration...")
response = requests.post(f"{BASE_URL}/register/", json={
    "username": "testuser2",
    "email": "test2@example.com",
    "password": "testpass123"
})
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}\n")

# Test Login
print("Testing Login...")
session = requests.Session()
response = session.post(f"{BASE_URL}/login/", json={
    "username": "testuser2",
    "password": "testpass123"
})
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}\n")

# Test Get Items
print("Testing Get Items...")
response = session.get(f"{BASE_URL}/items/")
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}\n")

# Test Create Item
print("Testing Create Item...")
response = session.post(f"{BASE_URL}/items/", json={
    "encrypted_data": "encrypted_test",
    "iv": "iv_test",
    "website": "example.com",
    "username": "user123",
    "folder": "Personal",
    "favorite": False
})
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}\n")
