import type { StrategyStatus, TxState } from "@tradh/core";
import { Badge, type BadgeProps } from "./badge";
import type { IconName } from "./icon";

const TX: Record<TxState, [BadgeProps["tone"], IconName | null, string]> = {
  draft: ["neutral", null, "Draft"],
  awaiting: ["neutral", "clock", "Awaiting approval"],
  submitted: ["brand", "send", "Submitted"],
  confirmed: ["positive", "check", "Confirmed"],
  failed: ["negative", "x", "Failed"],
  expired: ["neutral", "minus", "Expired"],
  rejected: ["neutral", "x", "Rejected"],
};

/** The seven transaction states. Only `confirmed` (after the onchain receipt) is green. */
export function TxStatus({ state }: { state: TxState }) {
  const [tone, icon, label] = TX[state];
  return (
    <Badge tone={tone} icon={icon ?? undefined} dot={!icon}>
      {label}
    </Badge>
  );
}

const STRAT: Record<StrategyStatus, [BadgeProps["tone"], IconName | null, string]> = {
  draft: ["neutral", null, "Draft"],
  awaiting: ["neutral", "clock", "Awaiting approval"],
  authorized: ["brand", "shield", "Authorized to trade"],
  paused: ["neutral", "pause", "Paused"],
  archived: ["neutral", null, "Archived"],
};

/** Authorized to trade is brand-tinted, never green: permission is not performance. */
export function StrategyStatusBadge({ status }: { status: StrategyStatus }) {
  const [tone, icon, label] = STRAT[status];
  return (
    <Badge tone={tone} icon={icon ?? undefined} dot={!icon}>
      {label}
    </Badge>
  );
}
