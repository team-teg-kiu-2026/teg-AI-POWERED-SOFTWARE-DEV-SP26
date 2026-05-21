const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export const DEMO_USER_ID = "demo-user";

export interface NutrientData {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sugar_g: number;
  fiber_g: number;
}

export interface MealAnalysis {
  nutrients: NutrientData;
  imbalances: string[];
  suggestions: string[];
  confidence: "high" | "medium" | "low";
  items_detected: string[];
  model_used?: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  created_at: string;
}

export interface MealLog {
  id: string;
  user_id: string;
  meal_description: string;
  nutrients: NutrientData;
  imbalances: string[];
  suggestions: string[];
  confidence: string;
  items_detected: string[];
  created_at: string;
}

// ── Meal analysis ─────────────────────────────────────────────────────────────

export async function analyzeMeal(
  text: string,
  userId: string,
  image?: File
): Promise<MealAnalysis> {
  const form = new FormData();
  form.append("user_id", userId);
  form.append("text", text);
  if (image) form.append("image", image);

  const res = await fetch(`${API_URL}/api/analyze`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Analysis failed");
  }
  return res.json();
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export async function getInventory(userId: string): Promise<InventoryItem[]> {
  const res = await fetch(`${API_URL}/api/inventory?user_id=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch inventory");
  return res.json();
}

export async function addInventoryItem(
  userId: string,
  item: { item_name: string; quantity: number; unit: string }
): Promise<InventoryItem> {
  const res = await fetch(`${API_URL}/api/inventory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...item, user_id: userId }),
  });
  if (!res.ok) throw new Error("Failed to add item");
  return res.json();
}

export async function deleteInventoryItem(itemId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/inventory/${itemId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete item");
}

// ── Meal history ──────────────────────────────────────────────────────────────

export async function getMealHistory(userId: string, date?: string): Promise<MealLog[]> {
  const params = new URLSearchParams({ user_id: userId });
  if (date) params.append("date", date);
  const res = await fetch(`${API_URL}/api/history?${params}`);
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

export async function logMeal(userId: string, analysis: MealAnalysis, description: string): Promise<MealLog> {
  const res = await fetch(`${API_URL}/api/history`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      meal_description: description,
      nutrients: analysis.nutrients,
      imbalances: analysis.imbalances,
      suggestions: analysis.suggestions,
      confidence: analysis.confidence,
      items_detected: analysis.items_detected,
    }),
  });
  if (!res.ok) throw new Error("Failed to log meal");
  return res.json();
}
