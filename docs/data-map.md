# NutriSmart Data Map

**Last updated:** 14 May 2026  
**Document version:** 1.0

---

## 1. Data Collected

| Data Type | Fields Stored | Storage Location | Retention | User Deletion |
|---|---|---|---|---|
| Meal logs | meal_description, nutrients (JSON), imbalances, suggestions, confidence, items_detected, created_at | Supabase (EU) — `meal_logs` table | 30 days (auto-delete via Supabase scheduled function) | `DELETE /api/user/data?user_id=…` |
| Food inventory | item_name, quantity, unit, created_at | Supabase (EU) — `inventory` table | Until user removes item | `DELETE /api/inventory/<id>` or via `DELETE /api/user/data` |
| Episode log | event_type, model, token counts, cost_usd, latency_ms, input_hash (SHA-256 first 16 chars), fallback_triggered, error | `logs/episode-log.jsonl` (local server) | 90 days rolling (manual rotation) | Manual file deletion by operator |
| MCP audit log | event_type, tool_name, input_hash, result_status, latency_ms, error | `logs/mcp-audit.jsonl` (local server) | 90 days rolling | Manual deletion by operator |

## 2. What Is NOT Stored

- **User names, emails, or phone numbers** — NutriSmart does not implement authentication; users are identified by a session-scoped `user_id` string only.
- **Raw food images** — uploaded images are processed in memory by the AI and immediately discarded; no images are persisted.
- **Raw food descriptions in episode logs** — the actual text of meal inputs is never written to the episode log. Only a SHA-256 hash of MCP tool inputs appears in `mcp-audit.jsonl`.
- **OpenRouter API responses** — only the parsed nutrient values are saved to Supabase.
- **IP addresses or device identifiers** — not collected at any layer.

## 3. Data Flow

```
User browser
  → Next.js frontend (Vercel)
    → Flask API (Render / localhost:5000)
      → OpenRouter API   [food text or image only, no PII]
      → Supabase         [structured nutrient results, user_id]
      → logs/episode-log.jsonl  [token counts, latency, NO meal text]
```

## 4. Third-Party Data Sharing

| Third Party | Data Sent | Purpose |
|---|---|---|
| OpenRouter (USA) | Meal text or food photo | AI nutrition analysis |
| Supabase (EU) | user_id, nutrient JSON, inventory items | Persistent storage |
| Vercel (USA) | HTTP requests / static files | Frontend hosting |

**Neither service receives user names, emails, or health diagnoses.**

## 5. User Rights

| Right | How to exercise |
|---|---|
| View data | Visible in the app dashboard and history page |
| Download data | Not yet implemented (planned: `GET /api/user/export`) |
| Delete data | Settings → "Delete my data" → calls `DELETE /api/user/data` |
| Withdraw consent | Delete account (same endpoint) |

## 6. Data Governance Controls

| Control | Implementation |
|---|---|
| Cross-user isolation | All Supabase queries filter by `user_id`; RLS enforced at DB level |
| No PII in AI calls | Only meal descriptions and food photos sent to OpenRouter |
| No PII in episode log | Input text hashed (SHA-256) before logging; meal text never written |
| No `.env` in git | `.env` in `.gitignore` from day one; confirmed via `git log --all -- .env` |
| 30-day auto-delete | Supabase retention policy on `meal_logs` and `inventory` tables |
| Secure secrets | All API keys in environment variables, never hardcoded |

## 7. Disclaimer

NutriSmart is a student course project, not a production health application. It is not a medical device and must not be used for clinical decisions. Data handling described here represents the design intent; a production deployment would require a full GDPR compliance review.
