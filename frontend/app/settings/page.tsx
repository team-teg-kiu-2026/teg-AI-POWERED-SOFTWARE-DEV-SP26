"use client";

import { useEffect, useState } from "react";
import { DEMO_USER_ID } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

interface Profile {
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

async function getProfile(userId: string): Promise<Profile> {
  const res = await fetch(`${API_URL}/api/profile?user_id=${userId}`);
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json();
}
async function updateProfile(userId: string, patch: Partial<Profile>): Promise<Profile> {
  const res = await fetch(`${API_URL}/api/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, ...patch }),
  });
  if (!res.ok) throw new Error("Failed to save profile");
  return res.json();
}
async function exportData(userId: string): Promise<Blob> {
  const res = await fetch(`${API_URL}/api/user/export?user_id=${userId}`);
  if (!res.ok) throw new Error("Export failed");
  return res.blob();
}
async function deleteAllData(userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/user/data?user_id=${userId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed");
}

const RESTRICTION_PRESETS = ["Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Lactose-free"];
const GOAL_PRESETS = ["Weight loss", "Muscle gain", "Maintenance", "Energy", "Better sleep"];
const SEX_OPTIONS = [
  { value: "", label: "—" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];
const ACTIVITY_OPTIONS = [
  { value: "", label: "—" },
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "active", label: "Active" },
  { value: "very_active", label: "Very active" },
];

function SavedPill({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-primary-container text-on-primary-container animate-pulse">
      <span className="material-symbols-outlined material-symbols-filled text-sm">check_circle</span>
      Saved
    </span>
  );
}

export default function Settings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Section save state
  const [savingTargets, setSavingTargets] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingAbout, setSavingAbout] = useState(false);
  const [savedTargets, setSavedTargets] = useState(false);
  const [savedPrefs, setSavedPrefs] = useState(false);
  const [savedAbout, setSavedAbout] = useState(false);

  // Local form mirrors
  const [calorieTarget, setCalorieTarget] = useState("");
  const [proteinTarget, setProteinTarget] = useState("");
  const [carbsTarget, setCarbsTarget] = useState("");
  const [fatTarget, setFatTarget] = useState("");
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [allergiesText, setAllergiesText] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [activityLevel, setActivityLevel] = useState("");

  // Danger zone
  const [exporting, setExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    getProfile(DEMO_USER_ID)
      .then((p) => {
        setProfile(p);
        setCalorieTarget(String(p.calorie_target ?? ""));
        setProteinTarget(String(p.protein_target_g ?? ""));
        setCarbsTarget(String(p.carbs_target_g ?? ""));
        setFatTarget(String(p.fat_target_g ?? ""));
        setRestrictions(p.dietary_restrictions ?? []);
        setAllergiesText((p.allergies ?? []).join(", "));
        setGoals(p.goals ?? []);
        setAge(p.age != null ? String(p.age) : "");
        setSex(p.sex ?? "");
        setHeightCm(p.height_cm != null ? String(p.height_cm) : "");
        setWeightKg(p.weight_kg != null ? String(p.weight_kg) : "");
        setActivityLevel(p.activity_level ?? "");
      })
      .catch(() => setError("Could not load profile. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  function flashSaved(setter: (b: boolean) => void) {
    setter(true);
    setTimeout(() => setter(false), 1800);
  }

  async function saveTargets() {
    setSavingTargets(true);
    setError("");
    try {
      const updated = await updateProfile(DEMO_USER_ID, {
        calorie_target: parseInt(calorieTarget) || 0,
        protein_target_g: parseInt(proteinTarget) || 0,
        carbs_target_g: parseInt(carbsTarget) || 0,
        fat_target_g: parseInt(fatTarget) || 0,
      });
      setProfile(updated);
      flashSaved(setSavedTargets);
    } catch {
      setError("Failed to save nutrition targets.");
    } finally {
      setSavingTargets(false);
    }
  }

  async function savePrefs() {
    setSavingPrefs(true);
    setError("");
    try {
      const allergies = allergiesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const updated = await updateProfile(DEMO_USER_ID, {
        dietary_restrictions: restrictions,
        allergies,
        goals,
      });
      setProfile(updated);
      setAllergiesText((updated.allergies ?? []).join(", "));
      flashSaved(setSavedPrefs);
    } catch {
      setError("Failed to save preferences.");
    } finally {
      setSavingPrefs(false);
    }
  }

  async function saveAbout() {
    setSavingAbout(true);
    setError("");
    try {
      const updated = await updateProfile(DEMO_USER_ID, {
        age: age.trim() ? parseInt(age) : null,
        sex: sex || null,
        height_cm: heightCm.trim() ? parseFloat(heightCm) : null,
        weight_kg: weightKg.trim() ? parseFloat(weightKg) : null,
        activity_level: activityLevel || null,
      });
      setProfile(updated);
      flashSaved(setSavedAbout);
    } catch {
      setError("Failed to save personal info.");
    } finally {
      setSavingAbout(false);
    }
  }

  function toggleChip(list: string[], value: string, setter: (v: string[]) => void) {
    if (list.includes(value)) setter(list.filter((x) => x !== value));
    else setter([...list, value]);
  }

  async function handleExport() {
    setExporting(true);
    setError("");
    try {
      const blob = await exportData(DEMO_USER_ID);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `nutrismart-${DEMO_USER_ID}-${date}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Export failed. Try again later.");
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    try {
      await deleteAllData(DEMO_USER_ID);
      setDeleteSuccess(true);
      setShowDeleteModal(false);
    } catch {
      setError("Delete failed. Try again later.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <>
        <section>
          <h1 className="text-3xl font-extrabold tracking-tighter font-headline">Settings</h1>
        </section>
        <section className="card-soft h-40 animate-pulse" />
        <section className="card-soft h-56 animate-pulse" />
        <section className="card-soft h-48 animate-pulse" />
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <section>
        <h1 className="text-3xl font-extrabold tracking-tighter text-on-surface font-headline">
          Settings
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Tune your nutrition profile and manage your data.
        </p>
      </section>

      {error && (
        <section className="text-sm text-error bg-error-container/20 rounded-lg px-3 py-2">
          {error}
        </section>
      )}

      {/* 1. Nutrition targets */}
      <section className="card-soft space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold font-label uppercase tracking-widest text-on-surface-variant">
            Nutrition targets
          </h2>
          <SavedPill show={savedTargets} />
        </div>

        <div>
          <label className="text-xs text-on-surface-variant font-medium">
            Calorie target (kcal)
          </label>
          <input
            className="input-soft mt-1"
            type="number"
            min="0"
            value={calorieTarget}
            onChange={(e) => setCalorieTarget(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-on-surface-variant font-medium">Protein (g)</label>
            <input
              className="input-soft mt-1"
              type="number"
              min="0"
              value={proteinTarget}
              onChange={(e) => setProteinTarget(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant font-medium">Carbs (g)</label>
            <input
              className="input-soft mt-1"
              type="number"
              min="0"
              value={carbsTarget}
              onChange={(e) => setCarbsTarget(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant font-medium">Fat (g)</label>
            <input
              className="input-soft mt-1"
              type="number"
              min="0"
              value={fatTarget}
              onChange={(e) => setFatTarget(e.target.value)}
            />
          </div>
        </div>

        <button
          className="btn-primary w-full"
          onClick={saveTargets}
          disabled={savingTargets}
        >
          {savingTargets ? "Saving…" : "Save targets"}
        </button>
      </section>

      {/* 2. Dietary restrictions, allergies, goals */}
      <section className="card-soft space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold font-label uppercase tracking-widest text-on-surface-variant">
            Diet & goals
          </h2>
          <SavedPill show={savedPrefs} />
        </div>

        <div>
          <label className="text-sm font-semibold text-on-surface">Dietary restrictions</label>
          <p className="text-xs text-on-surface-variant mt-0.5">Tap to add or remove.</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {RESTRICTION_PRESETS.map((r) => {
              const active = restrictions.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleChip(restrictions, r, setRestrictions)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                    active
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
          {restrictions.filter((r) => !RESTRICTION_PRESETS.includes(r)).length > 0 && (
            <p className="text-xs text-on-surface-variant mt-2">
              Other: {restrictions.filter((r) => !RESTRICTION_PRESETS.includes(r)).join(", ")}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-on-surface">Allergies</label>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Comma-separated list (e.g. peanuts, shellfish).
          </p>
          <input
            className="input-soft mt-2"
            placeholder="peanuts, shellfish, soy"
            value={allergiesText}
            onChange={(e) => setAllergiesText(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-on-surface">Goals</label>
          <p className="text-xs text-on-surface-variant mt-0.5">Pick any that fit you.</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {GOAL_PRESETS.map((g) => {
              const active = goals.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleChip(goals, g, setGoals)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                    active
                      ? "bg-secondary text-on-secondary shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        <button className="btn-primary w-full" onClick={savePrefs} disabled={savingPrefs}>
          {savingPrefs ? "Saving…" : "Save diet & goals"}
        </button>
      </section>

      {/* 3. About you */}
      <section className="card-soft space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold font-label uppercase tracking-widest text-on-surface-variant">
            About you (optional)
          </h2>
          <SavedPill show={savedAbout} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-on-surface-variant font-medium">Age</label>
            <input
              className="input-soft mt-1"
              type="number"
              min="0"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant font-medium">Sex</label>
            <select
              className="input-soft mt-1 appearance-none"
              value={sex}
              onChange={(e) => setSex(e.target.value)}
            >
              {SEX_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-on-surface-variant font-medium">Height (cm)</label>
            <input
              className="input-soft mt-1"
              type="number"
              min="0"
              step="0.1"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant font-medium">Weight (kg)</label>
            <input
              className="input-soft mt-1"
              type="number"
              min="0"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-on-surface-variant font-medium">Activity level</label>
            <select
              className="input-soft mt-1 appearance-none"
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value)}
            >
              {ACTIVITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className="btn-primary w-full" onClick={saveAbout} disabled={savingAbout}>
          {savingAbout ? "Saving…" : "Save personal info"}
        </button>
      </section>

      {/* 4. Danger zone */}
      <section className="card-soft border border-error/30 space-y-4">
        <h2 className="text-xs font-bold font-label uppercase tracking-widest text-error">
          Your data — danger zone
        </h2>

        {deleteSuccess ? (
          <div className="rounded-lg bg-primary-container/40 text-on-primary-container px-4 py-3 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined material-symbols-filled text-primary">
              check_circle
            </span>
            All your data has been deleted.
          </div>
        ) : (
          <>
            <p className="text-sm text-on-surface-variant">
              Download a complete copy of your profile, inventory, and meal history, or wipe it
              all permanently.
            </p>

            <div className="flex flex-col gap-2">
              <button className="btn-soft" onClick={handleExport} disabled={exporting}>
                <span className="inline-flex items-center gap-2 justify-center">
                  <span className="material-symbols-outlined text-base">download</span>
                  {exporting ? "Preparing…" : "Download my data"}
                </span>
              </button>

              <button
                className="bg-error text-on-error px-4 py-3 rounded-xl font-semibold tracking-wide
                           active:scale-95 transition-all shadow-sm shadow-error/20
                           disabled:opacity-50 disabled:active:scale-100"
                onClick={() => {
                  setDeleteConfirmText("");
                  setShowDeleteModal(true);
                }}
              >
                <span className="inline-flex items-center gap-2 justify-center">
                  <span className="material-symbols-outlined text-base">delete_forever</span>
                  Delete all my data
                </span>
              </button>
            </div>
          </>
        )}
      </section>

      {/* 5. About / disclaimer */}
      <section className="text-on-surface-variant text-xs leading-relaxed px-1 pb-4">
        NutriSmart is not a medical or dietary tool. It does not replace professional advice. Data
        is stored in Supabase EU and auto-deleted after 30 days.
      </section>

      {/* Delete confirm modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-error-container/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-error material-symbols-filled">
                  warning
                </span>
              </div>
              <h3 className="text-lg font-extrabold tracking-tight font-headline">
                Delete everything?
              </h3>
            </div>
            <p className="text-sm text-on-surface-variant">
              This will permanently delete your profile, inventory, and meal history. Type{" "}
              <span className="font-bold text-error">DELETE</span> to confirm.
            </p>
            <input
              autoFocus
              className="input-soft border border-error/30"
              placeholder="Type DELETE"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                className="btn-soft flex-1"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-error text-on-error px-4 py-3 rounded-xl font-semibold tracking-wide
                           active:scale-95 transition-all shadow-sm shadow-error/20
                           disabled:opacity-50 disabled:active:scale-100"
                onClick={handleDelete}
                disabled={deleting || deleteConfirmText !== "DELETE"}
              >
                {deleting ? "Deleting…" : "Delete forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
