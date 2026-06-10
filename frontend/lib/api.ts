const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export const DEMO_USER_ID = "demo-user";

// ── Types ────────────────────────────────────────────────────────────────────

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

export interface UserProfile {
  user_id: string;
  calorie_target: number;
  protein_target_g: number;
  carbs_target_g: number;
  fat_target_g: number;
  dietary_restrictions: string[];
  allergies: string[];
  goals: string[];
  age: number | null;
  sex: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: string | null;
  updated_at: string;
}

export interface PlannedMeal {
  name: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  ingredients: string[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  uses_inventory: string[];
  reason: string;
}

export interface DailyPlan {
  summary: string;
  meals: PlannedMeal[];
  model_used: string;
}

export interface MealPlan {
  id: string;
  user_id: string;
  plan_date: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  meal_name: string;
  ingredients: string[];
  nutrients: { calories?: number; protein_g?: number; carbs_g?: number; fat_g?: number };
  is_ai: boolean;
  notes: string | null;
  created_at: string;
}

export interface ShoppingItem {
  id: string;
  user_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  week_start: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response, fallbackMsg: string): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? fallbackMsg);
  }
  return res.json();
}

function weekStartOf(d: Date = new Date()): string {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().split("T")[0];
}

export { weekStartOf };

// ── Meal analysis ────────────────────────────────────────────────────────────

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
  return handleResponse(res, "Analysis failed");
}

// ── Inventory ────────────────────────────────────────────────────────────────

export async function getInventory(userId: string): Promise<InventoryItem[]> {
  const res = await fetch(`${API_URL}/api/inventory?user_id=${userId}`);
  return handleResponse(res, "Failed to fetch inventory");
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
  return handleResponse(res, "Failed to add item");
}

export async function deleteInventoryItem(itemId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/inventory/${itemId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete item");
}

// ── Meal history ─────────────────────────────────────────────────────────────

export async function getMealHistory(userId: string, date?: string): Promise<MealLog[]> {
  const params = new URLSearchParams({ user_id: userId });
  if (date) params.append("date", date);
  const res = await fetch(`${API_URL}/api/history?${params}`);
  return handleResponse(res, "Failed to fetch history");
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
  return handleResponse(res, "Failed to log meal");
}

// ── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<UserProfile> {
  const res = await fetch(`${API_URL}/api/profile?user_id=${userId}`);
  return handleResponse(res, "Failed to load profile");
}

export async function updateProfile(userId: string, patch: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch(`${API_URL}/api/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, ...patch }),
  });
  return handleResponse(res, "Failed to save profile");
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export async function sendChat(message: string, userId: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, user_id: userId }),
  });
  const data = await handleResponse<{ response: string }>(res, "Chat failed");
  return data.response;
}

export async function getChatHistory(userId: string): Promise<ChatMessage[]> {
  const res = await fetch(`${API_URL}/api/chat-history?user_id=${userId}`);
  return handleResponse(res, "Failed to fetch chat history");
}

export async function clearChatHistory(userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/chat-history?user_id=${userId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to clear chat history");
}

// ── Daily plan (legacy single-day) ──────────────────────────────────────────

export async function getDailyPlan(userId: string): Promise<DailyPlan> {
  const res = await fetch(`${API_URL}/api/plan?user_id=${userId}`);
  return handleResponse(res, "Plan generation failed");
}

// ── Weekly meal plans (calendar) ─────────────────────────────────────────────

export async function getMealPlans(userId: string, weekStart: string): Promise<MealPlan[]> {
  const res = await fetch(`${API_URL}/api/meal-plans?user_id=${userId}&week_start=${weekStart}`);
  return handleResponse(res, "Failed to fetch meal plans");
}

export async function addMealPlan(
  userId: string,
  plan: { plan_date: string; meal_type: string; meal_name: string; ingredients?: string[]; nutrients?: Record<string, number>; notes?: string }
): Promise<MealPlan> {
  const res = await fetch(`${API_URL}/api/meal-plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...plan, user_id: userId, is_ai: false }),
  });
  return handleResponse(res, "Failed to add meal plan");
}

export async function updateMealPlan(planId: string, fields: Partial<MealPlan>): Promise<MealPlan> {
  const res = await fetch(`${API_URL}/api/meal-plans/${planId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  return handleResponse(res, "Failed to update meal plan");
}

export async function deleteMealPlan(planId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/meal-plans/${planId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete meal plan");
}

export async function generateWeekPlan(userId: string, weekStart: string): Promise<{ plans: MealPlan[]; model_used: string }> {
  const res = await fetch(`${API_URL}/api/meal-plans/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, week_start: weekStart }),
  });
  return handleResponse(res, "Week plan generation failed");
}

// ── Shopping list ────────────────────────────────────────────────────────────

export async function getShoppingList(userId: string, weekStart: string): Promise<ShoppingItem[]> {
  const res = await fetch(`${API_URL}/api/shopping-list?user_id=${userId}&week_start=${weekStart}`);
  return handleResponse(res, "Failed to fetch shopping list");
}

export async function generateShoppingList(userId: string, weekStart: string): Promise<ShoppingItem[]> {
  const res = await fetch(`${API_URL}/api/shopping-list/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, week_start: weekStart }),
  });
  return handleResponse(res, "Shopping list generation failed");
}

export async function toggleShoppingItem(itemId: string, checked: boolean): Promise<ShoppingItem> {
  const res = await fetch(`${API_URL}/api/shopping-list/${itemId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checked }),
  });
  return handleResponse(res, "Failed to update item");
}

export async function addShoppingToInventory(userId: string, itemIds: string[]): Promise<InventoryItem[]> {
  const res = await fetch(`${API_URL}/api/shopping-list/add-to-inventory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, item_ids: itemIds }),
  });
  return handleResponse(res, "Failed to add items to inventory");
}

// ── GDPR ─────────────────────────────────────────────────────────────────────

export async function exportData(userId: string): Promise<Blob> {
  const res = await fetch(`${API_URL}/api/user/export?user_id=${userId}`);
  if (!res.ok) throw new Error("Export failed");
  return res.blob();
}

export async function deleteAllData(userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/user/data?user_id=${userId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed");
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function authSignup(email: string, password: string): Promise<{ user_id: string; email: string }> {
  const res = await fetch(`${API_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res, "Signup failed");
}

export async function authLogin(email: string, password: string): Promise<{
  user_id: string; email: string; access_token: string; refresh_token: string;
}> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res, "Login failed");
}
