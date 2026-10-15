import type { InputHTMLAttributes } from "react";
import { Icon } from "./icon";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  icon?: "search" | "calendar";
  suffix?: string;
  hint?: string;
  invalid?: boolean;
}

/** Labelled input with optional leading icon, unit suffix and hint or error line. */
export function TextField({ label, icon, suffix, hint, invalid, className, ...input }: TextFieldProps) {
  return (
    <label className={["td-field", className].filter(Boolean).join(" ")}>
      {label ? <span className="td-field-label">{label}</span> : null}
      <span className={["td-input", invalid && "td-input-invalid"].filter(Boolean).join(" ")}>
        {icon === "search" ? <Icon name="search" /> : null}
        <input aria-invalid={invalid || undefined} {...input} />
        {suffix ? <span className="td-input-suffix">{suffix}</span> : null}
        {icon === "calendar" ? <Icon name="calendar" /> : null}
      </span>
      {hint ? <span className={["td-field-hint", invalid && "td-field-hint-error"].filter(Boolean).join(" ")}>{hint}</span> : null}
    </label>
  );
}
