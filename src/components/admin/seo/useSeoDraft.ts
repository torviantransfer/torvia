"use client";

import { useCallback, useMemo, useState } from "react";
import { field, str, type Entry } from "./entries";
import type { Loc } from "./fields";
import { computeChanges, type FieldChange } from "./SaveDiffDialog";
import type { FieldName } from "./scoring";

export interface SeoDraft {
  draft: Record<string, unknown>;
  /** The column this logical field maps to, or null where the concept does not exist. */
  col: (name: FieldName) => string | null;
  get: (name: FieldName) => string;
  set: (name: FieldName, v: unknown) => void;
  /** Writes a column that is the same in every locale — an image, a flag. */
  setRaw: (column: string, v: unknown) => void;
  raw: (column: string) => string;
  changes: FieldChange[];
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  error: string | null;
  save: () => Promise<void>;
}

/**
 * The edited copy of one page's row, and the write that commits it.
 *
 * The draft is kept apart from the panel that renders it so the form fields do
 * not each have to know how a save is built. `changes` is computed once and
 * used both to show the confirmation diff and to build the payload, so the
 * screen can never show one set of changes while writing another.
 */
export function useSeoDraft({
  entry,
  locale,
  onSaved,
  onCommitted,
}: {
  entry: Entry;
  locale: Loc;
  onSaved: (next: Record<string, unknown>) => void;
  /** Runs after a successful write, to re-read the page that was just saved. */
  onCommitted?: () => void;
}): SeoDraft {
  const [draft, setDraft] = useState<Record<string, unknown>>({ ...entry.row });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const col = useCallback(
    (name: FieldName) => field(entry.fieldMap, name, locale),
    [entry.fieldMap, locale]
  );

  const get = useCallback((name: FieldName) => str(draft, col(name)), [draft, col]);

  const set = useCallback(
    (name: FieldName, v: unknown) => {
      const c = col(name);
      if (!c) return;
      setDraft((d) => ({ ...d, [c]: v }));
      setSaved(false);
    },
    [col]
  );

  const setRaw = useCallback((column: string, v: unknown) => {
    setDraft((d) => ({ ...d, [column]: v }));
    setSaved(false);
  }, []);

  const raw = useCallback((column: string) => str(draft, column), [draft]);

  const changes = useMemo(() => computeChanges(entry.row, draft), [draft, entry.row]);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    // Only changed columns are sent. A whole-row update would resend fields
    // this screen does not manage — pricing joins, coordinates — and any stale
    // value in the client copy would overwrite a newer one.
    const payload: Record<string, unknown> = {};
    for (const c of changes) payload[c.field] = draft[c.field];
    payload.updated_at = new Date().toISOString();
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: entry.table, action: "update", id: entry.id, data: payload }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Kaydedilemedi");
      onSaved(json.data ?? payload);
      setSaved(true);
      onCommitted?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  }, [changes, draft, entry.table, entry.id, onSaved, onCommitted]);

  return {
    draft,
    col,
    get,
    set,
    setRaw,
    raw,
    changes,
    dirty: changes.length > 0,
    saving,
    saved,
    error,
    save,
  };
}
