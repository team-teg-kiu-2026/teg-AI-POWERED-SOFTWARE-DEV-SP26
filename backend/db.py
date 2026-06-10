import logging
import os
from datetime import date, timedelta
from supabase import create_client, Client

_log = logging.getLogger(__name__)
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
    _db().table("meal_plans").delete().eq("user_id", user_id).execute()
    _db().table("shopping_items").delete().eq("user_id", user_id).execute()
    _db().table("chat_messages").delete().eq("user_id", user_id).execute()
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
    result = (
        _db()
        .table("user_profiles")
        .upsert(payload, on_conflict="user_id")
        .execute()
    )
    return result.data[0]


# ── Meal plans (calendar) ────────────────────────────────────────────────────

def get_meal_plans(user_id: str, week_start: str) -> list[dict]:
    end = str(date.fromisoformat(week_start) + timedelta(days=6))
    result = (
        _db()
        .table("meal_plans")
        .select("*")
        .eq("user_id", user_id)
        .gte("plan_date", week_start)
        .lte("plan_date", end)
        .order("plan_date")
        .order("meal_type")
        .execute()
    )
    return result.data


def add_meal_plan(user_id: str, plan_date: str, meal_type: str,
                  meal_name: str, ingredients: list | None = None,
                  nutrients: dict | None = None, is_ai: bool = False,
                  notes: str | None = None) -> dict:
    row = {
        "user_id": user_id,
        "plan_date": plan_date,
        "meal_type": meal_type,
        "meal_name": meal_name,
        "ingredients": ingredients or [],
        "nutrients": nutrients or {},
        "is_ai": is_ai,
    }
    if notes:
        row["notes"] = notes
    result = _db().table("meal_plans").insert(row).execute()
    return result.data[0]


def update_meal_plan(plan_id: str, fields: dict) -> dict:
    allowed = {"plan_date", "meal_type", "meal_name", "ingredients", "nutrients", "is_ai", "notes"}
    payload = {k: v for k, v in fields.items() if k in allowed}
    result = _db().table("meal_plans").update(payload).eq("id", plan_id).execute()
    return result.data[0]


def delete_meal_plan(plan_id: str) -> None:
    _db().table("meal_plans").delete().eq("id", plan_id).execute()


def clear_ai_day_plans(user_id: str, plan_date: str) -> None:
    """Delete AI-generated meal plans for a single day only."""
    _db().table("meal_plans").delete().eq("user_id", user_id).eq("is_ai", True).eq("plan_date", plan_date).execute()


def clear_ai_meal_plans(user_id: str, week_start: str) -> None:
    end = str(date.fromisoformat(week_start) + timedelta(days=6))
    (
        _db()
        .table("meal_plans")
        .delete()
        .eq("user_id", user_id)
        .eq("is_ai", True)
        .gte("plan_date", week_start)
        .lte("plan_date", end)
        .execute()
    )


# ── Shopping list ─────────────────────────────────────────────────────────────

def get_shopping_items(user_id: str, week_start: str) -> list[dict]:
    result = (
        _db()
        .table("shopping_items")
        .select("*")
        .eq("user_id", user_id)
        .eq("week_start", week_start)
        .order("item_name")
        .execute()
    )
    return result.data


def set_shopping_items(user_id: str, week_start: str, items: list[dict]) -> list[dict]:
    _db().table("shopping_items").delete().eq("user_id", user_id).eq("week_start", week_start).execute()
    if not items:
        return []
    rows = [
        {"user_id": user_id, "week_start": week_start, "item_name": i["item_name"],
         "quantity": i.get("quantity", 1), "unit": i.get("unit", "piece"), "checked": False}
        for i in items
    ]
    result = _db().table("shopping_items").insert(rows).execute()
    return result.data


def update_shopping_item(item_id: str, checked: bool) -> dict:
    result = _db().table("shopping_items").update({"checked": checked}).eq("id", item_id).execute()
    return result.data[0]


# ── Chat messages ────────────────────────────────────────────────────────────

def get_chat_messages(user_id: str, limit: int = 50) -> list[dict]:
    result = (
        _db()
        .table("chat_messages")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at")
        .limit(limit)
        .execute()
    )
    return result.data


def add_chat_message(user_id: str, role: str, content: str) -> dict:
    result = (
        _db()
        .table("chat_messages")
        .insert({"user_id": user_id, "role": role, "content": content})
        .execute()
    )
    return result.data[0]


def clear_chat_messages(user_id: str) -> None:
    _db().table("chat_messages").delete().eq("user_id", user_id).execute()
