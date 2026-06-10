"use client";

import { useRef, useState } from "react";
import { analyzeMeal, logMeal, type MealAnalysis } from "@/lib/api";
import { useUserId } from "@/lib/auth";

const CONFIDENCE_BADGE = {
  high:   "bg-primary-container/40    text-on-primary-container",
  medium: "bg-tertiary-fixed/30       text-on-tertiary-container",
  low:    "bg-error-container/30      text-on-error-container",
};

export default function LogMeal() {
  const userId = useUserId();
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<MealAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImage(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleAnalyze() {
    if (!text.trim() && !image) {
      setError("Enter a meal description or upload a photo.");
      return;
    }
    setError("");
    setResult(null);
    setSaved(false);
    setLoading(true);
    try {
      const data = await analyzeMeal(text, userId, image ?? undefined);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      await logMeal(userId, result, text || "Photo meal");
      setSaved(true);
    } catch {
      setError("Failed to save meal.");
    } finally {
      setSaving(false);
    }
  }

  const n = result?.nutrients;

  return (
    <>
      {/* Header */}
      <section>
        <h1 className="text-3xl font-extrabold tracking-tighter text-on-surface font-headline">
          What's on your plate?
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Describe a meal or upload a photo — we'll analyze the nutrients.
        </p>
      </section>

      {/* Hero scan button */}
      <section>
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-container rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-full aspect-square max-w-[280px] mx-auto bg-primary rounded-[2rem] flex flex-col items-center justify-center text-on-primary shadow-xl active:scale-95 transition-transform duration-200"
          >
            <span
              className="material-symbols-outlined material-symbols-filled mb-3"
              style={{ fontSize: "4rem" }}
            >
              {preview ? "check_circle" : "linked_camera"}
            </span>
            <span className="text-xl font-bold font-headline tracking-tight">
              {preview ? "Photo ready" : "Scan Meal"}
            </span>
            <span className="text-xs opacity-80 mt-1 uppercase tracking-widest font-label font-medium">
              {preview ? image?.name : "AI Photo Recognition"}
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </div>
        {preview && (
          <img src={preview} alt="meal preview" className="mt-4 rounded-xl max-h-48 object-cover mx-auto shadow-sm" />
        )}
      </section>

      {/* Manual entry */}
      <section className="card-soft space-y-4">
        <label className="block">
          <span className="text-xs font-bold font-label uppercase tracking-widest text-on-surface-variant">
            Or describe it
          </span>
          <textarea
            className="input-soft mt-2 resize-none"
            rows={3}
            placeholder='e.g. "chicken with rice and vegetables"'
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>

        {error && (
          <p className="text-sm text-error bg-error-container/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button className="btn-primary w-full" onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analyzing…" : "Analyze Meal"}
        </button>
      </section>

      {/* Result */}
      {result && (
        <section className="card-soft space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold font-headline">Analysis</h2>
            <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${CONFIDENCE_BADGE[result.confidence] ?? CONFIDENCE_BADGE.medium}`}>
              {result.confidence} confidence
            </span>
          </div>

          {result.items_detected.length > 0 && (
            <div>
              <p className="text-[10px] font-bold font-label uppercase tracking-widest text-on-surface-variant mb-1">
                Detected
              </p>
              <p className="text-sm">{result.items_detected.join(", ")}</p>
            </div>
          )}

          {n && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "kcal",  value: n.calories },
                { label: "Prot",  value: n.protein_g },
                { label: "Carb",  value: n.carbs_g },
                { label: "Fat",   value: n.fat_g },
                { label: "Sugar", value: n.sugar_g },
                { label: "Fiber", value: n.fiber_g },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface-container-low rounded-xl p-3 text-center">
                  <p className="text-lg font-bold font-headline">{Math.round(value)}</p>
                  <p className="text-[10px] font-bold font-label uppercase text-on-surface-variant">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {result.imbalances.length > 0 && (
            <div className="bg-tertiary-container/30 rounded-xl p-4 border-l-4 border-tertiary">
              <p className="text-[10px] font-bold font-label uppercase tracking-widest text-on-tertiary-container mb-1">
                Watch out
              </p>
              <ul className="space-y-1">
                {result.imbalances.map((item, i) => (
                  <li key={i} className="text-sm text-on-tertiary-container">{item}</li>
                ))}
              </ul>
            </div>
          )}

          {result.suggestions.length > 0 && (
            <div className="bg-secondary-container/30 rounded-xl p-4 border-l-4 border-secondary">
              <p className="text-[10px] font-bold font-label uppercase tracking-widest text-on-secondary-container mb-1">
                AI suggestion
              </p>
              <ul className="space-y-1">
                {result.suggestions.map((item, i) => (
                  <li key={i} className="text-sm text-on-secondary-container">{item}</li>
                ))}
              </ul>
            </div>
          )}

          {saved ? (
            <p className="text-sm text-primary font-bold flex items-center gap-2">
              <span className="material-symbols-outlined material-symbols-filled">check_circle</span>
              Saved to your log.
            </p>
          ) : (
            <button className="btn-primary w-full" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save to log"}
            </button>
          )}
        </section>
      )}
    </>
  );
}
