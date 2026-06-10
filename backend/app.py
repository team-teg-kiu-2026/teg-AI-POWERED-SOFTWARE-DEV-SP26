import logging
import os
from datetime import date, datetime, timedelta

from dotenv import load_dotenv
load_dotenv()

from flask import Flask, jsonify, request, Response
from flask_cors import CORS

import json as _json

import ai
import db as database

app = Flask(__name__)
CORS(app)

_log = logging.getLogger("nutrismart")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


def _json_error(message: str, status: int = 400):
    return jsonify({"error": message}), status


def _get_user_id() -> str:
    if request.is_json:
        body = request.get_json(silent=True) or {}
        return body.get("user_id") or request.args.get("user_id", "demo-user")
    return request.form.get("user_id") or request.args.get("user_id", "demo-user")


def _profile_with_defaults(stored: dict | None, user_id: str) -> dict:
    merged = {"user_id": user_id, **database.PROFILE_DEFAULTS}
    if stored:
        merged.update({k: v for k, v in stored.items() if v is not None or k in stored})
    return merged


def _today_totals(user_id: str) -> dict:
    totals = {"calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0}
    try:
        logs = database.get_history(user_id, str(date.today()))
        for entry in logs:
            n = entry.get("nutrients") or {}
            for k in totals:
                totals[k] += n.get(k, 0) or 0
    except Exception as exc:
        _log.warning("Failed to fetch today's totals for %s: %s", user_id, exc)
    return totals


def _week_start_from(d: date | None = None) -> str:
    d = d or date.today()
    return str(d - timedelta(days=d.weekday()))


# ── Meal analysis ─────────────────────────────────────────────────────────────

@app.route("/api/analyze", methods=["POST"])
def analyze():
    user_id = request.form.get("user_id", "demo-user")
    meal_text = request.form.get("text", "").strip()
    image_file = request.files.get("image")

    if not meal_text and not image_file:
        return _json_error("Provide meal text or an image.")

    inventory_names: list[str] = []
    try:
        items = database.get_inventory(user_id)
        inventory_names = [item["item_name"] for item in items]
    except Exception as exc:
        _log.warning("Failed to fetch inventory for %s: %s", user_id, exc)

    profile: dict | None = None
    try:
        profile = database.get_profile(user_id)
    except Exception as exc:
        _log.warning("Failed to fetch profile for %s: %s", user_id, exc)

    today_totals = _today_totals(user_id)

    try:
        if image_file:
            result = ai.analyze_meal_image(
                image_file.read(), inventory_names,
                profile=profile, today_totals=today_totals,
            )
        else:
            today_history: list[dict] = []
            try:
                logs = database.get_history(user_id, str(date.today()))
                today_history = [
                    {"meal": l["meal_description"], "nutrients": l["nutrients"]}
                    for l in logs
                ]
            except Exception as exc:
                _log.warning("Failed to fetch today's history for %s: %s", user_id, exc)
            result = ai.analyze_meal(
                meal_text, inventory_names, today_history,
                profile=profile, today_totals=today_totals,
            )
    except Exception as exc:
        return _json_error(f"AI analysis failed: {exc}", 502)

    return jsonify(result)


# ── General Q&A chat ─────────────────────────────────────────────────────────

@app.route("/api/chat", methods=["POST"])
def chat():
    body = request.get_json(silent=True) or {}
    message = body.get("message", "").strip()
    user_id = body.get("user_id", "demo-user")

    if not message:
        return _json_error("message is required.")

    inventory_names: list[str] = []
    try:
        items = database.get_inventory(user_id)
        inventory_names = [item["item_name"] for item in items]
    except Exception as exc:
        _log.warning("Failed to fetch inventory for chat: %s", exc)

    try:
        response_text = ai.chat(message, inventory_names)
    except Exception as exc:
        return _json_error(f"Chat failed: {exc}", 502)

    # Persist both sides of the conversation
    try:
        database.add_chat_message(user_id, "user", message)
        database.add_chat_message(user_id, "assistant", response_text)
    except Exception as exc:
        _log.warning("Failed to persist chat messages for %s: %s", user_id, exc)

    return jsonify({"response": response_text})


# ── Chat history ─────────────────────────────────────────────────────────────

@app.route("/api/chat-history", methods=["GET"])
def get_chat_history():
    user_id = request.args.get("user_id", "demo-user")
    limit = int(request.args.get("limit", 50))
    try:
        messages = database.get_chat_messages(user_id, limit)
        return jsonify(messages)
    except Exception as exc:
        return _json_error(str(exc), 500)


@app.route("/api/chat-history", methods=["DELETE"])
def clear_chat_history():
    user_id = request.args.get("user_id", "demo-user")
    try:
        database.clear_chat_messages(user_id)
        return "", 204
    except Exception as exc:
        return _json_error(str(exc), 500)


# ── Inventory ─────────────────────────────────────────────────────────────────

@app.route("/api/inventory", methods=["GET"])
def get_inventory():
    user_id = request.args.get("user_id", "demo-user")
    try:
        return jsonify(database.get_inventory(user_id))
    except Exception as exc:
        return _json_error(str(exc), 500)


@app.route("/api/inventory", methods=["POST"])
def add_inventory():
    body = request.get_json(silent=True) or {}
    user_id = body.get("user_id", "demo-user")
    item_name = body.get("item_name", "").strip()
    quantity = float(body.get("quantity", 1))
    unit = body.get("unit", "piece").strip()

    if not item_name:
        return _json_error("item_name is required.")
    try:
        item = database.add_inventory_item(user_id, item_name, quantity, unit)
        return jsonify(item), 201
    except Exception as exc:
        return _json_error(str(exc), 500)


@app.route("/api/inventory/<item_id>", methods=["DELETE"])
def delete_inventory(item_id: str):
    try:
        database.delete_inventory_item(item_id)
        return "", 204
    except Exception as exc:
        return _json_error(str(exc), 500)


# ── Meal history ──────────────────────────────────────────────────────────────

@app.route("/api/history", methods=["GET"])
def get_history():
    user_id = request.args.get("user_id", "demo-user")
    for_date = request.args.get("date")
    try:
        return jsonify(database.get_history(user_id, for_date))
    except Exception as exc:
        return _json_error(str(exc), 500)


@app.route("/api/history", methods=["POST"])
def add_history():
    body = request.get_json(silent=True) or {}
    user_id = body.get("user_id", "demo-user")
    try:
        log = database.add_meal_log(
            user_id=user_id,
            meal_description=body.get("meal_description", ""),
            nutrients=body.get("nutrients", {}),
            imbalances=body.get("imbalances", []),
            suggestions=body.get("suggestions", []),
            confidence=body.get("confidence", "medium"),
            items_detected=body.get("items_detected", []),
        )
        return jsonify(log), 201
    except Exception as exc:
        return _json_error(str(exc), 500)


# ── GDPR data deletion ──────────────────────────────────────────────────────

@app.route("/api/user/data", methods=["DELETE"])
def delete_user_data():
    user_id = request.args.get("user_id", "demo-user")
    try:
        database.delete_user_data(user_id)
        return "", 204
    except Exception as exc:
        return _json_error(str(exc), 500)


# ── User profile ─────────────────────────────────────────────────────────────

@app.route("/api/profile", methods=["GET"])
def get_profile():
    user_id = request.args.get("user_id", "demo-user")
    try:
        stored = database.get_profile(user_id)
    except Exception as exc:
        return _json_error(str(exc), 500)
    return jsonify(_profile_with_defaults(stored, user_id))


@app.route("/api/profile", methods=["PUT"])
def put_profile():
    body = request.get_json(silent=True) or {}
    user_id = body.get("user_id", "demo-user")
    fields = {k: v for k, v in body.items() if k != "user_id"}
    try:
        row = database.upsert_profile(user_id, fields)
        return jsonify(_profile_with_defaults(row, user_id))
    except Exception as exc:
        return _json_error(str(exc), 500)


# ── AI meal plan (single day — legacy) ───────────────────────────────────────

@app.route("/api/plan", methods=["GET"])
def get_plan():
    user_id = request.args.get("user_id", "demo-user")
    try:
        stored = database.get_profile(user_id)
        profile = _profile_with_defaults(stored, user_id)
        items = database.get_inventory(user_id)
        inventory_names = [item["item_name"] for item in items]
        totals = _today_totals(user_id)
    except Exception as exc:
        return _json_error(str(exc), 500)

    try:
        result = ai.plan_day(profile, inventory_names, totals)
    except Exception as exc:
        return _json_error(f"Plan generation failed: {exc}", 502)

    # Auto-save generated meals to the calendar for today
    today_str = str(date.today())
    try:
        database.clear_ai_day_plans(user_id, today_str)
        for meal in result.get("meals", []):
            database.add_meal_plan(
                user_id=user_id,
                plan_date=today_str,
                meal_type=meal.get("meal_type", "snack"),
                meal_name=meal.get("name", "Unnamed"),
                ingredients=meal.get("ingredients", []),
                nutrients={
                    "calories": meal.get("calories", 0),
                    "protein_g": meal.get("protein_g", 0),
                    "carbs_g": meal.get("carbs_g", 0),
                    "fat_g": meal.get("fat_g", 0),
                },
                is_ai=True,
                notes=meal.get("reason"),
            )
    except Exception as exc:
        _log.warning("Failed to auto-save daily plan to calendar for %s: %s", user_id, exc)

    return jsonify(result)


# ── Meal plans (calendar) ────────────────────────────────────────────────────

@app.route("/api/meal-plans", methods=["GET"])
def get_meal_plans():
    user_id = request.args.get("user_id", "demo-user")
    week_start = request.args.get("week_start", _week_start_from())
    try:
        plans = database.get_meal_plans(user_id, week_start)
        return jsonify(plans)
    except Exception as exc:
        return _json_error(str(exc), 500)


@app.route("/api/meal-plans", methods=["POST"])
def add_meal_plan():
    body = request.get_json(silent=True) or {}
    user_id = body.get("user_id", "demo-user")
    plan_date = body.get("plan_date")
    meal_type = body.get("meal_type")
    meal_name = body.get("meal_name", "").strip()

    if not plan_date or not meal_type or not meal_name:
        return _json_error("plan_date, meal_type, and meal_name are required.")

    try:
        plan = database.add_meal_plan(
            user_id=user_id,
            plan_date=plan_date,
            meal_type=meal_type,
            meal_name=meal_name,
            ingredients=body.get("ingredients"),
            nutrients=body.get("nutrients"),
            is_ai=body.get("is_ai", False),
            notes=body.get("notes"),
        )
        return jsonify(plan), 201
    except Exception as exc:
        return _json_error(str(exc), 500)


@app.route("/api/meal-plans/<plan_id>", methods=["PUT"])
def update_meal_plan(plan_id: str):
    body = request.get_json(silent=True) or {}
    try:
        updated = database.update_meal_plan(plan_id, body)
        return jsonify(updated)
    except Exception as exc:
        return _json_error(str(exc), 500)


@app.route("/api/meal-plans/<plan_id>", methods=["DELETE"])
def delete_meal_plan(plan_id: str):
    try:
        database.delete_meal_plan(plan_id)
        return "", 204
    except Exception as exc:
        return _json_error(str(exc), 500)


@app.route("/api/meal-plans/generate", methods=["POST"])
def generate_meal_plans():
    body = request.get_json(silent=True) or {}
    user_id = body.get("user_id", "demo-user")
    week_start = body.get("week_start", _week_start_from())

    try:
        stored = database.get_profile(user_id)
        profile = _profile_with_defaults(stored, user_id)
        items = database.get_inventory(user_id)
        inventory_names = [item["item_name"] for item in items]
    except Exception as exc:
        return _json_error(str(exc), 500)

    try:
        result = ai.plan_week(profile, inventory_names, week_start)
    except Exception as exc:
        return _json_error(f"Week plan generation failed: {exc}", 502)

    database.clear_ai_meal_plans(user_id, week_start)

    saved_plans: list[dict] = []
    for day in result.get("days", []):
        day_date = day.get("date", "")
        for meal in day.get("meals", []):
            try:
                plan = database.add_meal_plan(
                    user_id=user_id,
                    plan_date=day_date,
                    meal_type=meal.get("meal_type", "snack"),
                    meal_name=meal.get("name", "Unnamed"),
                    ingredients=meal.get("ingredients", []),
                    nutrients={
                        "calories": meal.get("calories", 0),
                        "protein_g": meal.get("protein_g", 0),
                        "carbs_g": meal.get("carbs_g", 0),
                        "fat_g": meal.get("fat_g", 0),
                    },
                    is_ai=True,
                )
                saved_plans.append(plan)
            except Exception as exc:
                _log.warning("Failed to save meal plan entry: %s", exc)

    return jsonify({"plans": saved_plans, "model_used": result.get("model_used", "")}), 201


# ── Shopping list ─────────────────────────────────────────────────────────────

@app.route("/api/shopping-list", methods=["GET"])
def get_shopping_list():
    user_id = request.args.get("user_id", "demo-user")
    week_start = request.args.get("week_start", _week_start_from())
    try:
        items = database.get_shopping_items(user_id, week_start)
        return jsonify(items)
    except Exception as exc:
        return _json_error(str(exc), 500)


@app.route("/api/shopping-list/generate", methods=["POST"])
def generate_shopping_list():
    body = request.get_json(silent=True) or {}
    user_id = body.get("user_id", "demo-user")
    week_start = body.get("week_start", _week_start_from())

    try:
        plans = database.get_meal_plans(user_id, week_start)
        if not plans:
            return _json_error("No meal plans found for this week. Generate a weekly plan first.")

        items = database.get_inventory(user_id)
        inventory_names = [item["item_name"] for item in items]
    except Exception as exc:
        return _json_error(str(exc), 500)

    try:
        result = ai.generate_shopping_list(plans, inventory_names)
    except Exception as exc:
        return _json_error(f"Shopping list generation failed: {exc}", 502)

    try:
        saved = database.set_shopping_items(user_id, week_start, result.get("items", []))
        return jsonify(saved), 201
    except Exception as exc:
        return _json_error(str(exc), 500)


@app.route("/api/shopping-list/<item_id>", methods=["PUT"])
def update_shopping_item(item_id: str):
    body = request.get_json(silent=True) or {}
    checked = body.get("checked", False)
    try:
        updated = database.update_shopping_item(item_id, checked)
        return jsonify(updated)
    except Exception as exc:
        return _json_error(str(exc), 500)


@app.route("/api/shopping-list/add-to-inventory", methods=["POST"])
def shopping_to_inventory():
    body = request.get_json(silent=True) or {}
    user_id = body.get("user_id", "demo-user")
    item_ids = body.get("item_ids", [])

    if not item_ids:
        return _json_error("item_ids is required.")

    try:
        week_start = _week_start_from()
        all_items = database.get_shopping_items(user_id, week_start)
        selected = [i for i in all_items if i["id"] in item_ids]

        added = []
        for item in selected:
            inv = database.add_inventory_item(user_id, item["item_name"], item["quantity"], item["unit"])
            database.update_shopping_item(item["id"], True)
            added.append(inv)

        return jsonify(added), 201
    except Exception as exc:
        return _json_error(str(exc), 500)


# ── GDPR data export ─────────────────────────────────────────────────────────

@app.route("/api/user/export", methods=["GET"])
def export_user_data():
    user_id = request.args.get("user_id", "demo-user")
    try:
        stored = database.get_profile(user_id)
        profile = _profile_with_defaults(stored, user_id)
        inventory = database.get_inventory(user_id)
        history = database.get_history(user_id)
    except Exception as exc:
        return _json_error(str(exc), 500)

    payload = {
        "exported_at": datetime.utcnow().isoformat() + "Z",
        "profile": profile,
        "inventory": inventory,
        "history": history,
    }
    filename = f"nutrismart-{user_id}-{date.today().isoformat()}.json"
    return Response(
        _json.dumps(payload, default=str),
        mimetype="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── Auth (Supabase) ──────────────────────────────────────────────────────────

@app.route("/api/auth/signup", methods=["POST"])
def auth_signup():
    body = request.get_json(silent=True) or {}
    email = body.get("email", "").strip()
    password = body.get("password", "")

    if not email or not password:
        return _json_error("email and password are required.")
    if len(password) < 6:
        return _json_error("Password must be at least 6 characters.")

    try:
        from supabase import create_client
        sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_ANON_KEY"])
        result = sb.auth.sign_up({"email": email, "password": password})
        user = result.user
        if not user:
            return _json_error("Signup failed — please try again.", 500)
        return jsonify({"user_id": user.id, "email": user.email}), 201
    except Exception as exc:
        msg = str(exc)
        if "already registered" in msg.lower():
            return _json_error("An account with this email already exists.", 409)
        return _json_error(f"Signup failed: {msg}", 500)


@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    body = request.get_json(silent=True) or {}
    email = body.get("email", "").strip()
    password = body.get("password", "")

    if not email or not password:
        return _json_error("email and password are required.")

    try:
        from supabase import create_client
        sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_ANON_KEY"])
        result = sb.auth.sign_in_with_password({"email": email, "password": password})
        session = result.session
        user = result.user
        if not session or not user:
            return _json_error("Invalid email or password.", 401)
        return jsonify({
            "user_id": user.id,
            "email": user.email,
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
        })
    except Exception as exc:
        msg = str(exc)
        if "invalid" in msg.lower() or "credentials" in msg.lower():
            return _json_error("Invalid email or password.", 401)
        return _json_error(f"Login failed: {msg}", 500)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
