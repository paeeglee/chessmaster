import type { ReactNode } from "react";

export type FindingTone = "success" | "danger" | "warning" | "neutral";

const ICON: Record<FindingTone, { glyph: string; className: string }> = {
  success: { glyph: "✓", className: "bg-success-soft text-success" },
  danger: { glyph: "✕", className: "bg-danger-soft text-danger" },
  warning: { glyph: "!", className: "bg-warning-soft text-warning" },
  neutral: { glyph: "i", className: "bg-canvas text-ink-muted" },
};

export function FindingItem({
  tone,
  title,
  detail,
}: {
  tone: FindingTone;
  title: string;
  detail?: ReactNode;
}) {
  const icon = ICON[tone];
  return (
    <li className="flex items-start gap-2.5">
      <span
        aria-hidden="true"
        className={`flex size-[22px] flex-none items-center justify-center rounded-full font-bold text-[13px] ${icon.className}`}
      >
        {icon.glyph}
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-[15px] text-ink">{title}</span>
        {detail && <span className="text-ink-muted text-sm">{detail}</span>}
      </div>
    </li>
  );
}
