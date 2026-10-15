import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "./icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  iconRight?: IconName;
  block?: boolean;
}

/** Pill button. One primary per view. */
export function Button({ variant = "primary", size = "md", iconRight, block, className, children, type = "button", ...rest }: ButtonProps) {
  const cls = ["td-btn", `td-btn-${variant}`, `td-btn-${size}`, block && "td-btn-block", className].filter(Boolean).join(" ");
  return (
    <button type={type} className={cls} {...rest}>
      {children}
      {iconRight ? <Icon name={iconRight} size={size === "lg" ? 18 : 16} /> : null}
    </button>
  );
}
