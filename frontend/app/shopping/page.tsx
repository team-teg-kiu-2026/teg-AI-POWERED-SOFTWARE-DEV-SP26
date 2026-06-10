"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getShoppingList,
  generateShoppingList,
  toggleShoppingItem,
  addShoppingToInventory,
  weekStartOf,
  type ShoppingItem,
} from "@/lib/api";
import { useUserId } from "@/lib/auth";

export default function Shopping() {
  const userId = useUserId();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [addingToPantry, setAddingToPantry] = useState(false);
  const [error, setError] = useState("");

  const weekStart = weekStartOf();

  /* ── Fetch list on mount ──────────────────────────────────────────────── */
  const fetchList = useCallback(() => {
    setLoading(true);
    setError("");
    getShoppingList(userId, weekStart)
      .then(setItems)
      .catch(() => setError("Could not load shopping list. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [userId, weekStart]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  /* ── Generate from meal plan ──────────────────────────────────────────── */
  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const generated = await generateShoppingList(userId, weekStart);
      setItems(generated);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Generation failed";
      setError(msg);
    } finally {
      setGenerating(false);
    }
  }

  /* ── Toggle item (optimistic) ─────────────────────────────────────────── */
  async function handleToggle(item: ShoppingItem) {
    const newChecked = !item.checked;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, checked: newChecked } : i))
    );

    try {
      await toggleShoppingItem(item.id, newChecked);
    } catch {
      // Revert on failure
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, checked: item.checked } : i))
      );
    }
  }

  /* ── Add checked items to pantry ──────────────────────────────────────── */
  async function handleAddToPantry() {
    const checkedIds = items.filter((i) => i.checked).map((i) => i.id);
    if (checkedIds.length === 0) return;

    setAddingToPantry(true);
    setError("");
    try {
      await addShoppingToInventory(userId, checkedIds);
      // Remove the added items from the list
      setItems((prev) => prev.filter((i) => !i.checked));
    } catch {
      setError("Failed to add items to pantry.");
    } finally {
      setAddingToPantry(false);
    }
  }

  /* ── Derived state ────────────────────────────────────────────────────── */
  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);
  const checkedCount = checked.length;
  const totalCount = items.length;

  /* ── Skeleton loader ──────────────────────────────────────────────────── */
  function SkeletonRows() {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl animate-pulse"
          >
            <div className="w-6 h-6 rounded-full bg-surface-container-high shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-surface-container-high rounded-lg w-3/5" />
            </div>
            <div className="h-6 w-16 bg-surface-container-high rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  /* ── Single list item ─────────────────────────────────────────────────── */
  function ShoppingRow({ item }: { item: ShoppingItem }) {
    return (
      <li
        className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl cursor-pointer select-none
                   hover:shadow-md transition-all duration-200 group"
        onClick={() => handleToggle(item)}
        role="checkbox"
        aria-checked={item.checked}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle(item);
          }
        }}
      >
        {/* Custom round checkbox */}
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
                      transition-all duration-200
                      ${
                        item.checked
                          ? "bg-primary border-primary"
                          : "border-outline-variant group-hover:border-primary/60"
                      }`}
        >
          {item.checked && (
            <span className="material-symbols-outlined text-on-primary text-sm font-bold">
              check
            </span>
          )}
        </div>

        {/* Item name */}
        <span
          className={`flex-1 font-medium transition-all duration-200
                      ${
                        item.checked
                          ? "line-through text-on-surface-variant/50"
                          : "text-on-surface"
                      }`}
        >
          {item.item_name}
        </span>

        {/* Quantity + unit pill */}
        <span
          className={`inline-flex items-center gap-1 bg-surface-container-low rounded-full px-3 py-1
                      text-xs font-semibold font-label transition-opacity duration-200
                      ${item.checked ? "opacity-40" : "text-on-surface-variant"}`}
        >
          {item.quantity} {item.unit}
        </span>
      </li>
    );
  }

  return (
    <>
      {/* Header */}
      <section>
        <h1 className="text-3xl font-extrabold tracking-tighter text-on-surface font-headline">
          Shopping List
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Auto-generated from your weekly meal plan
        </p>
      </section>

      {/* Actions bar */}
      <section className="flex flex-col sm:flex-row gap-3">
        <button
          className="btn-primary flex items-center justify-center gap-2"
          onClick={handleGenerate}
          disabled={generating}
        >
          <span
            className={`material-symbols-outlined text-base ${generating ? "animate-spin" : ""}`}
          >
            {generating ? "progress_activity" : "auto_awesome"}
          </span>
          {generating ? "Generating..." : "Generate from meal plan"}
        </button>

        {checkedCount > 0 && (
          <button
            className="btn-soft flex items-center justify-center gap-2"
            onClick={handleAddToPantry}
            disabled={addingToPantry}
          >
            <span className="material-symbols-outlined text-base">
              {addingToPantry ? "progress_activity" : "kitchen"}
            </span>
            {addingToPantry
              ? "Adding..."
              : `Add checked to pantry (${checkedCount})`}
          </button>
        )}
      </section>

      {/* Error */}
      {error && (
        <div className="bg-error-container/20 border-l-4 border-error rounded-xl p-5 space-y-2">
          <p className="text-sm text-on-error-container font-semibold">{error}</p>
          <p className="text-xs text-on-surface-variant">
            Make sure you have a meal plan for this week, then try again.
          </p>
        </div>
      )}

      {/* Summary */}
      {!loading && totalCount > 0 && (
        <section className="flex items-center justify-between px-1">
          <h2 className="text-xl font-extrabold tracking-tight font-headline">Items</h2>
          <span className="text-xs font-medium text-primary font-label uppercase tracking-wider">
            {checkedCount} of {totalCount} checked
          </span>
        </section>
      )}

      {/* Loading skeleton */}
      {loading && <SkeletonRows />}

      {/* Empty state */}
      {!loading && totalCount === 0 && !error && (
        <section className="card-soft text-center py-12 space-y-4">
          <span className="material-symbols-outlined text-on-surface-variant text-5xl">
            shopping_cart
          </span>
          <p className="font-headline text-lg font-bold text-on-surface">
            No shopping list yet.
          </p>
          <p className="text-sm text-on-surface-variant max-w-xs mx-auto">
            Generate one from your weekly meal plan!
          </p>
          <Link href="/calendar" className="btn-soft inline-flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-base">calendar_month</span>
            Go to meal calendar
          </Link>
        </section>
      )}

      {/* Item list: unchecked first, then checked */}
      {!loading && totalCount > 0 && (
        <section className="space-y-6">
          {/* Unchecked items */}
          {unchecked.length > 0 && (
            <ul className="space-y-2">
              {unchecked.map((item) => (
                <ShoppingRow key={item.id} item={item} />
              ))}
            </ul>
          )}

          {/* Checked items */}
          {checked.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-3 px-1">
                Checked off
              </p>
              <ul className="space-y-2">
                {checked.map((item) => (
                  <ShoppingRow key={item.id} item={item} />
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </>
  );
}
