import os
from datetime import date

from dotenv import load_dotenv
load_dotenv()

from flask import Flask, jsonify, request
from flask_cors import CORS

import ai
import db as database

app = Flask(__name__)
CORS(app)


def _json_error(message: str, status: int = 400):
    return jsonify({"error": message}), status


# ── Meal analysis ─────────────────────────────────────────────────────────────

@app.route("/api/analyze", methods=["POST"])
def analyze():
    user_id   = request.form.get("user_id", "demo-user")
    meal_text = request.form.get("text", "").strip()
    image_file = request.files.get("image")

    if not meal_text and not image_file:
        return _json_error("Provide meal text or an image.")

    inventory_names: list[str] = []
    try:
        items = database.get_inventory(user_id)
        inventory_names = [item["item_name"] for item in items]
    except Exception:
        pass

    try:
        if image_file:
            result = ai.analyze_meal_image(image_file.read(), inventory_names)
        else:
            today_history: list[dict] = []
            try:
                logs = database.get_history(user_id, str(date.today()))
                today_history = [
                    {"meal": l["meal_description"], "nutrients": l["nutrients"]}
                    for l in logs
                ]
            except Exception:
                pass
            result = ai.analyze_meal(meal_text, inventory_names, today_history)
    except Exception as exc:
        return _json_error(f"AI analysis failed: {exc}", 502)

    return jsonify(result)


# ── General Q&A chat (used by eval script) ───────────────────────────────────

@app.route("/api/chat", methods=["POST"])
def chat():
    body    = request.get_json(silent=True) or {}
    message = body.get("message", "").strip()
    user_id = body.get("user_id", "demo-user")

    if not message:
        return _json_error("message is required.")

    inventory_names: list[str] = []
    try:
        items = database.get_inventory(user_id)
        inventory_names = [item["item_name"] for item in items]
    except Exception:
        pass

    try:
        response_text = ai.chat(message, inventory_names)
        return jsonify({"response": response_text})
    except Exception as exc:
        return _json_error(f"Chat failed: {exc}", 502)


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
    body      = request.get_json(silent=True) or {}
    user_id   = body.get("user_id", "demo-user")
    item_name = body.get("item_name", "").strip()
    quantity  = float(body.get("quantity", 1))
    unit      = body.get("unit", "piece").strip()

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
    user_id  = request.args.get("user_id", "demo-user")
    for_date = request.args.get("date")
    try:
        return jsonify(database.get_history(user_id, for_date))
    except Exception as exc:
        return _json_error(str(exc), 500)


@app.route("/api/history", methods=["POST"])
def add_history():
    body    = request.get_json(silent=True) or {}
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


# ── GDPR data deletion ────────────────────────────────────────────────────────

@app.route("/api/user/data", methods=["DELETE"])
def delete_user_data():
    user_id = request.args.get("user_id", "demo-user")
    try:
        database.delete_user_data(user_id)
        return "", 204
    except Exception as exc:
        return _json_error(str(exc), 500)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
