"use client";

import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { GRADE_COLOR, GRADE_LABEL, type SeoScore, type CheckStatus } from "@/lib/seoScore";

const ICON: Record<CheckStatus, typeof CheckCircle2> = {
  pass: CheckCircle2,
  warn: AlertTriangle,
  fail: XCircle,
};

const COLOR: Record<CheckStatus, string> = {
  pass: "#16a34a",
  warn: "#d97706",
  fail: "#dc2626",
};

/** Order the list so the things worth fixing sit at the top. */
const RANK: Record<CheckStatus, number> = { fail: 0, warn: 1, pass: 2 };

export function ScoreRing({ percent, size = 64 }: { percent: number; size?: number }) {
  const grade = percent >= 85 ? "excellent" : percent >= 65 ? "good" : percent >= 40 ? "fair" : "poor";
  const color = GRADE_COLOR[grade];
  const stroke = size >= 56 ? 6 : 4;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <svg width={size} height={size} className="shrink-0" role="img" aria-label={`SEO skoru %${percent}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - percent / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 400ms ease, stroke 200ms ease" }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fill={color}
        style={{ fontSize: size * 0.28, fontWeight: 700 }}
      >
        {percent}
      </text>
    </svg>
  );
}

/** Compact badge for a list row. */
export function ScoreBadge({ percent }: { percent: number }) {
  const grade = percent >= 85 ? "excellent" : percent >= 65 ? "good" : percent >= 40 ? "fair" : "poor";
  const color = GRADE_COLOR[grade];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums"
      style={{ backgroundColor: `${color}14`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />%{percent}
    </span>
  );
}

export default function SeoScorePanel({
  score,
  onFieldClick,
}: {
  score: SeoScore;
  /** Focuses the matching input when a check is clicked. */
  onFieldClick?: (field: string) => void;
}) {
  const sorted = [...score.checks].sort((a, b) => RANK[a.status] - RANK[b.status] || b.weight - a.weight);
  const problems = score.checks.filter((c) => c.status !== "pass").length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-4 border-b border-slate-100">
        <ScoreRing percent={score.percent} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            İçerik SEO skoru — {GRADE_LABEL[score.grade]}
          </p>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {score.passed}/{score.total} kontrol geçti
            {problems > 0 && ` · ${problems} iyileştirme mevcut`}
          </p>
          {/* Named apart from the technical panel on purpose: this grades the
              copy, that one reports facts about the delivered HTML. Merging
              them would let a missing focus keyword — a planning field the
              site never emits — read like a defect in the page. */}
          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
            Yayındaki değerler üzerinden hesaplanır. Teknik hatalar üstteki
            &quot;Teknik SEO kontrolleri&quot; bölümündedir.
          </p>
        </div>
      </div>

      <ul className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
        {sorted.map((check) => {
          const Icon = ICON[check.status];
          const clickable = Boolean(check.field && onFieldClick);
          return (
            <li key={check.id}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => check.field && onFieldClick?.(check.field)}
                className="w-full flex items-start gap-2.5 px-4 py-2.5 text-left transition-colors enabled:hover:bg-slate-50 enabled:cursor-pointer"
              >
                <Icon size={15} style={{ color: COLOR[check.status] }} className="mt-0.5 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-medium text-slate-800">
                    {check.label}
                  </span>
                  <span className="block text-[11.5px] text-slate-500 leading-snug mt-0.5">
                    {check.detail}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
