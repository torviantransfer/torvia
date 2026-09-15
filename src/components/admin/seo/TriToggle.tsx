"use client";

import { cx } from "@/components/admin/ui";

/**
 * A three-state switch for the tri-state boolean columns.
 *
 * "Varsayılan" is a real, distinct value and the default: it means the page's
 * own decision stands. Collapsing it into false would make every save assert
 * "definitely index this", overriding the deliberate noindex that region and
 * blog pages apply to locales they are not translated into.
 */
export default function TriToggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}) {
  const options: [string, boolean | null][] = [
    ["Varsayılan", null],
    ["Kapalı", false],
    ["Açık", true],
  ];

  return (
    <div>
      <p className="text-[13px] font-semibold text-adm-ink">{label}</p>
      <p className="mb-2 mt-0.5 text-[11.5px] leading-snug text-adm-muted">{description}</p>
      <div role="group" aria-label={label} className="inline-flex rounded-adm bg-adm-seg p-[3px]">
        {options.map(([text, v]) => {
          const on = value === v;
          // Turning one of these on is what removes a page from Google, so it
          // is the one state the switch colours as a warning and confirms.
          const danger = v === true;
          return (
            <button
              key={text}
              type="button"
              aria-pressed={on}
              onClick={() => {
                if (
                  danger &&
                  !confirm(`"${label}" açılıyor.\n\n${description}\n\nDevam edilsin mi?`)
                ) {
                  return;
                }
                onChange(v);
              }}
              className={cx(
                "inline-flex h-7 items-center rounded-adm-sm px-3 text-[12.5px] font-semibold transition-colors",
                on
                  ? danger
                    ? "bg-adm-rose text-white"
                    : "bg-adm-surface text-adm-ink shadow-adm-sm"
                  : "text-adm-muted hover:text-adm-ink"
              )}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
