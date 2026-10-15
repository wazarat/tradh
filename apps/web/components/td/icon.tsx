import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  Clock,
  Minus,
  Pause,
  Search,
  Send,
  Shield,
  Wallet,
  X,
  type LucideProps,
} from "lucide-react";

export type IconName =
  | "arrow-right"
  | "arrow-up-right"
  | "arrow-down-right"
  | "minus"
  | "check"
  | "x"
  | "search"
  | "calendar"
  | "clock"
  | "pause"
  | "shield"
  | "send"
  | "activity"
  | "wallet";

const ICONS = {
  "arrow-right": ArrowRight,
  "arrow-up-right": ArrowUpRight,
  "arrow-down-right": ArrowDownRight,
  minus: Minus,
  check: Check,
  x: X,
  search: Search,
  calendar: Calendar,
  clock: Clock,
  pause: Pause,
  shield: Shield,
  send: Send,
  activity: Activity,
  wallet: Wallet,
} as const;

/** Lucide, outline only, strokeWidth 1.75, currentColor (brand README). */
export function Icon({ name, size = 16, ...rest }: { name: IconName; size?: number } & Omit<LucideProps, "size">) {
  const C = ICONS[name];
  return <C size={size} strokeWidth={1.75} aria-hidden className="td-icon" {...rest} />;
}
