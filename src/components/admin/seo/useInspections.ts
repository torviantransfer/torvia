"use client";

import { useCallback, useState } from "react";
import type { PageInspection } from "@/lib/seoInspect";
import type { Entry } from "./entries";

/** Which deployment a reading came from. */
export type ScanTarget = "public" | "deployment";

export interface InspectionSource {
  origin: string;
  target: ScanTarget;
}

export function pathOf(entry: Entry, loc: string) {
  const route = entry.routeFor(loc);
  return `/${loc}${route ? `/${route}` : ""}`;
}

/**
 * Reads the live SEO surface of pages and remembers what came back.
 *
 * Inspections are keyed by the path they were taken from and held above the
 * list, so a whole-site scan survives opening and closing individual pages.
 * The source is kept alongside them because a preview's numbers and
 * production's numbers are different facts and must never be shown as one.
 */
export function useInspections() {
  const [inspections, setInspections] = useState<Record<string, PageInspection>>({});
  const [scanning, setScanning] = useState<Set<string>>(new Set());
  const [source, setSource] = useState<InspectionSource | null>(null);
  const [target, setTarget] = useState<ScanTarget>("public");

  const scan = useCallback(
    async (targets: { entry: Entry; loc: string }[]) => {
      const paths = [...new Set(targets.map((t) => pathOf(t.entry, t.loc)))];
      if (paths.length === 0) return;
      setScanning((prev) => new Set([...prev, ...paths]));
      // The endpoint caps a request at 12 renders so one call stays inside the
      // serverless timeout; a full-site scan is therefore several calls.
      for (let i = 0; i < paths.length; i += 10) {
        const batch = paths.slice(i, i + 10);
        try {
          const res = await fetch("/api/admin/seo-inspect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paths: batch, target }),
          });
          const json = await res.json();
          if (json.origin) setSource({ origin: json.origin, target: json.target });
          if (json.results) setInspections((prev) => ({ ...prev, ...json.results }));
        } catch {
          // A failed batch simply leaves those paths uninspected, which the UI
          // renders as "taranmadı" rather than as "no value".
        } finally {
          setScanning((prev) => {
            const next = new Set(prev);
            for (const p of batch) next.delete(p);
            return next;
          });
        }
      }
    },
    [target]
  );

  /** Switching deployments throws the readings away — they describe the old one. */
  const switchTarget = useCallback((next: ScanTarget) => {
    setTarget(next);
    setInspections({});
    setSource(null);
  }, []);

  return { inspections, scanning, source, target, scan, switchTarget };
}
