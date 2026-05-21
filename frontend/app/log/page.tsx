"use client";

import { useRef, useState } from "react";
import { analyzeMeal, logMeal, DEMO_USER_ID, type MealAnalysis } from "@/lib/api";

const CONFIDENCE_STYLES = {
  high:   { badge: "bg-green-100  text-green-700",  label: "High confidence"   },
  medium: { badge: "bg-yellow-100 text-yellow-700", label: "Medium confidence" },
  low:    { badge: "bg-red-100    text-red-700",    label: "Low confidence"    },
};

function ConfidenceBadge({ confidence }: { confidence: MealAnalysis["confidence"] }) {
  const s = CONFIDENCE_STYLES[confidence] ?? CONFIDENCE_STYLES.medium;
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.badge}`}>{s.label}</span>;
}

export default function LogMeal() {
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
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleAnalyze() {
    if (!text.trim() && !image) {
      setError("Enter a meal description or upload an image.");
      return;
    }
    setError("");
    setResult(null);
    setSaved(false);
    setLoading(true);
    try {
      const data = await analyzeMeal(text, DEMO_USER_ID, image ?? undefined);
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
      await logMeal(DEMO_USER_ID, result, text || "Image meal");
      setSaved(true);
    } catch {
      setError("Failed to save meal.");
    } finally {
      setSaving(false);
    }
  }

  const n = result?.nutrients;

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">Log a Meal</h1>

      <div className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">What did you eat?</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder='e.g. "pizza and cola" or "chicken with rice and vegetables"'
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Or upload a photo</label>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          <button className="btn-secondary text-sm" onClick={() => fileRef.current?.click()}>
            {image ? image.name : "Choose image…"}
          </button>
          {preview && (
            <img src={preview} alt="meal preview" className="mt-3 rounded-lg max-h-48 object-cover" />
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button className="btn-primary w-full" onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>

      {result && (
        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Analysis result</h2>
            <ConfidenceBadge confidence={result.confidence} />
          </div>

          {result.confidence === "low" && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              We couldn&apos;t fully analyze this meal. Please check or edit the items and try again.
            </p>
          )}

          {result.items_detected.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Detected items</p>
              <p className="text-sm">{result.items_detected.join(", ")}</p>
            </div>
          )}

          {n && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Calories", value: n.calories,  unit: "kcal" },
                { label: "Protein",  value: n.protein_g, unit: "g"    },
                { label: "Carbs",    value: n.carbs_g,   unit: "g"    },
                { label: "Fat",      value: n.fat_g,     unit: "g"    },
                { label: "Sugar",    value: n.sugar_g,   unit: "g"    },
                { label: "Fiber",    value: n.fiber_g,   unit: "g"    },
              ].map(({ label, value, unit }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold">{Math.round(value)}<span className="text-xs font-normal text-gray-500">{unit}</span></p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          )}

          {result.imbalances.length > 0 && (
            <div>
              <p className="text-xs font-medium text-orange-600 uppercase tracking-wide mb-1">Imbalances</p>
              <ul className="space-y-1">
                {result.imbalances.map((item, i) => (
                  <li key={i} className="text-sm text-orange-700 flex gap-2">
                    <span>⚠</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.suggestions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Suggestions</p>
              <ul className="space-y-1">
                {result.suggestions.map((item, i) => (
                  <li key={i} className="text-sm text-green-800 flex gap-2">
                    <span>→</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {saved ? (
            <p className="text-sm text-green-700 font-medium">Saved to your log.</p>
          ) : (
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save to log"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
