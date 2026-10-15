import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";

export interface BadgeProps {
  tone?: "neutral" | "brand" | "positive" | "negative";
  icon?: IconName;
  dot?: boolean;
  children?: ReactNode;
  title?: string;
}

/** Rectangular status label. Colour never carries meaning alone: every badge has a word. */
export function Badge({ tone = "neutral", icon, dot, children, title }: BadgeProps) {
  return (
    <span className={`td-badge td-badge-${tone}`} title={title}>
      {icon ? <Icon name={icon} size={14} /> : dot ? <span className="td-dot" /> : null}
      {children}
    </span>
  );
}
