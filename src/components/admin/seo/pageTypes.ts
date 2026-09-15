import { FileText, Home, MapPin, Newspaper, Rocket, type LucideIcon } from "lucide-react";
import type { PageType } from "./entries";

/**
 * How each kind of page is labelled and coloured in the list. Kept apart from
 * `entries.ts`, which describes what a page *is* rather than how it looks.
 */
export const GROUP_META: Record<PageType, { label: string; icon: LucideIcon; color: string }> = {
  home: { label: "Ana Sayfa", icon: Home, color: "#f97316" },
  landing: { label: "Landing", icon: Rocket, color: "#8b5cf6" },
  static: { label: "Statik", icon: FileText, color: "#0ea5e9" },
  region: { label: "Bölge", icon: MapPin, color: "#10b981" },
  blog: { label: "Blog", icon: Newspaper, color: "#ec4899" },
};

export const GROUP_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "home", label: "Ana sayfa" },
  { value: "landing", label: "Landing" },
  { value: "static", label: "Statik" },
  { value: "region", label: "Bölge" },
  { value: "blog", label: "Blog" },
];

export const ISSUE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Hepsi" },
  { value: "problems", label: "Sorunlu" },
  { value: "missing", label: "Eksik metadata" },
  { value: "noindex", label: "noindex" },
];
