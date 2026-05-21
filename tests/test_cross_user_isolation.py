"""
Cross-user data isolation test for NutriSmart.

Verifies that User B cannot access User A's meal logs or inventory.
The test is self-contained: it writes, checks, then cleans up test data.

Requirements:
    pip install requests pytest
    Backend running: python backend/app.py

Run:
    python -m pytest tests/test_cross_user_isolation.py -v
"""

import pytest
import requests

BASE_URL = "http://localhost:5000"
USER_A   = "iso-test-user-a"
USER_B   = "iso-test-user-b"

MEAL_PAYLOAD = {
    "user_id":          USER_A,
    "meal_description": "Isolation test — chicken and rice",
    "nutrients": {
        "calories": 520, "protein_g": 38, "carbs_g": 55,
        "fat_g": 12, "sugar_g": 3, "fiber_g": 4,
    },
    "imbalances":     [],
    "suggestions":    [],
    "confidence":     "high",
    "items_detected": ["chicken", "rice"],
}

INVENTORY_PAYLOAD = {
    "user_id":   USER_A,
    "item_name": "isolation-test-chicken",
    "quantity":  200,
    "unit":      "g",
}


@pytest.fixture(autouse=True)
def cleanup():
    """Delete test users' data before and after every test."""
    for uid in [USER_A, USER_B]:
        requests.delete(f"{BASE_URL}/api/user/data?user_id={uid}")
    yield
    for uid in [USER_A, USER_B]:
        requests.delete(f"{BASE_URL}/api/user/data?user_id={uid}")


def test_meal_log_isolation():
    """User B cannot see User A's meal log entries."""
    # Add a meal for User A
    r = requests.post(f"{BASE_URL}/api/history", json=MEAL_PAYLOAD)
    assert r.status_code == 201, f"Setup failed: {r.text}"
    a_entry_id = r.json()["id"]

    # User A can see their own entry
    a_resp = requests.get(f"{BASE_URL}/api/history?user_id={USER_A}")
    assert a_resp.status_code == 200
    a_ids = {e["id"] for e in a_resp.json()}
    assert a_entry_id in a_ids, "User A should see their own meal entry"

    # User B should NOT see User A's entry
    b_resp = requests.get(f"{BASE_URL}/api/history?user_id={USER_B}")
    assert b_resp.status_code == 200
    b_ids = {e["id"] for e in b_resp.json()}

    breach = a_ids & b_ids
    assert len(breach) == 0, (
        f"ISOLATION BREACH: User B can see {len(breach)} entries belonging to User A. "
        f"Leaked IDs: {breach}"
    )


def test_inventory_isolation():
    """User B cannot see User A's inventory items."""
    # Add an inventory item for User A
    r = requests.post(f"{BASE_URL}/api/inventory", json=INVENTORY_PAYLOAD)
    assert r.status_code == 201, f"Setup failed: {r.text}"
    a_item_id = r.json()["id"]

    # User A can see their own inventory
    a_resp = requests.get(f"{BASE_URL}/api/inventory?user_id={USER_A}")
    assert a_resp.status_code == 200
    a_ids = {item["id"] for item in a_resp.json()}
    assert a_item_id in a_ids, "User A should see their own inventory item"

    # User B should NOT see User A's inventory
    b_resp = requests.get(f"{BASE_URL}/api/inventory?user_id={USER_B}")
    assert b_resp.status_code == 200
    b_ids = {item["id"] for item in b_resp.json()}

    breach = a_ids & b_ids
    assert len(breach) == 0, (
        f"ISOLATION BREACH: User B can see {len(breach)} inventory items belonging to User A. "
        f"Leaked IDs: {breach}"
    )


def test_gdpr_delete_does_not_affect_other_users():
    """Deleting User A's data does not remove User B's data."""
    # Add data for both users
    requests.post(f"{BASE_URL}/api/history", json=MEAL_PAYLOAD)
    b_payload = {**MEAL_PAYLOAD, "user_id": USER_B,
                 "meal_description": "User B test meal"}
    r_b = requests.post(f"{BASE_URL}/api/history", json=b_payload)
    assert r_b.status_code == 201
    b_entry_id = r_b.json()["id"]

    # Delete User A's data
    del_resp = requests.delete(f"{BASE_URL}/api/user/data?user_id={USER_A}")
    assert del_resp.status_code == 204

    # User B's data must still exist
    b_resp = requests.get(f"{BASE_URL}/api/history?user_id={USER_B}")
    b_ids = {e["id"] for e in b_resp.json()}
    assert b_entry_id in b_ids, (
        "ISOLATION BREACH: Deleting User A's data also removed User B's entry."
    )
