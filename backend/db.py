import os
from datetime import date
from supabase import create_client, Client

_client: Client | None = None


def _db() -> Client:
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_ANON_KEY"]
        _client = create_client(url, key)
    return _client


# ── Inventory ─────────────────────────────────────────────────────────────────

def get_inventory(user_id: str) -> list[dict]:
    result = _db().table("inventory").select("*").eq("user_id", user_id).execute()
    return result.data


def add_inventory_item(user_id: str, item_name: str, quantity: float, unit: str) -> dict:
    result = (
        _db()
        .table("inventory")
        .insert({"user_id": user_id, "item_name": item_name, "quantity": quantity, "unit": unit})
        .execute()
    )
    return result.data[0]


def delete_inventory_item(item_id: str) -> None:
    _db().table("inventory").delete().eq("id", item_id).execute()


# ── Meal logs ─────────────────────────────────────────────────────────────────

def get_history(user_id: str, for_date: str | None = None) -> list[dict]:
    query = _db().table("meal_logs").select("*").eq("user_id", user_id)
    if for_date:
        query = query.gte("created_at", f"{for_date}T00:00:00").lte("created_at", f"{for_date}T23:59:59")
    result = query.order("created_at", desc=True).execute()
    return result.data


def add_meal_log(
    user_id: str,
    meal_description: str,
    nutrients: dict,
    imbalances: list,
    suggestions: list,
    confidence: str,
    items_detected: list,
) -> dict:
    result = (
        _db()
        .table("meal_logs")
        .insert({
            "user_id": user_id,
            "meal_description": meal_description,
            "nutrients": nutrients,
            "imbalances": imbalances,
            "suggestions": suggestions,
            "confidence": confidence,
            "items_detected": items_detected,
        })
        .execute()
    )
    return result.data[0]


def delete_user_data(user_id: str) -> None:
    _db().table("inventory").delete().eq("user_id", user_id).execute()
    _db().table("meal_logs").delete().eq("user_id", user_id).execute()
    _db().table("user_profiles").delete().eq("user_id", user_id).execute()


# ── User profiles ─────────────────────────────────────────────────────────────

PROFILE_DEFAULTS: dict = {
    "calorie_target": 2000,
    "protein_target_g": 120,
    "carbs_target_g": 250,
    "fat_target_g": 70,
    "dietary_restrictions": [],
    "allergies": [],
    "goals": [],
    "age": None,
    "sex": None,
    "height_cm": None,
    "weight_kg": None,
    "activity_level": None,
}


def get_profile(user_id: str) -> dict | None:
    result = _db().table("user_profiles").select("*").eq("user_id", user_id).execute()
    return result.data[0] if result.data else None


def upsert_profile(user_id: str, fields: dict) -> dict:
    payload = {k: v for k, v in fields.items() if k in PROFILE_DEFAULTS}
    payload["user_id"] = user_id
    payload["updated_at"] = "now()"
    # Supabase python client doesn't render now() — use server default by omitting it
    payload.pop("updated_at")
    result = (
        _db()
        .table("user_profiles")
        .upsert(payload, on_conflict="user_id")
        .execute()
    )
    return result.data[0]
