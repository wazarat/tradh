/**
 * Feature flags (spec §20). Every flag defaults to OFF. They are read from the server
 * environment; the client only ever sees the subset exposed through `publicFlags()`.
 * ENABLE_LIVE_MONEY is hard-pinned to false in this codebase until a separate approval.
 */
export const FLAG_NAMES = [
  "ENABLE_MOCK_TRADING",
  "ENABLE_MCP",
  "ENABLE_STRATEGY_PROPOSALS",
  "ENABLE_AUTOMATED_EXECUTION",
  "ENABLE_BASIC_SIMULATION",
  "ENABLE_HISTORICAL_BACKTESTING",
  "ENABLE_PAID_RESEARCH",
  "ENABLE_EXTERNAL_DEX_ROUTING",
  "ENABLE_OWN_EXCHANGE",
  "ENABLE_PROTOCOL_FEES",
  "ENABLE_PERPETUALS",
  "ENABLE_ERC8004",
  "ENABLE_PUBLIC_STRATEGIES",
  "ENABLE_STRATEGY_FOLLOWING",
  "ENABLE_LIVE_MONEY",
] as const;

export type FlagName = (typeof FLAG_NAMES)[number];
export type FeatureFlags = Readonly<Record<FlagName, boolean>>;

/** Flags that are safe to expose to the browser (presence only, never secrets). */
export const PUBLIC_FLAGS: readonly FlagName[] = [
  "ENABLE_MOCK_TRADING",
  "ENABLE_STRATEGY_PROPOSALS",
  "ENABLE_AUTOMATED_EXECUTION",
  "ENABLE_BASIC_SIMULATION",
  "ENABLE_HISTORICAL_BACKTESTING",
  "ENABLE_LIVE_MONEY",
];

function truthy(v: string | undefined): boolean {
  return v === "1" || v === "true" || v === "TRUE" || v === "yes";
}

export function readFlags(env: Record<string, string | undefined> = process.env): FeatureFlags {
  const out = {} as Record<FlagName, boolean>;
  for (const name of FLAG_NAMES) out[name] = truthy(env[name]);
  // Non-negotiable during the testnet phase.
  out.ENABLE_LIVE_MONEY = false;
  return out;
}

export function publicFlags(flags: FeatureFlags): Partial<FeatureFlags> {
  const out: Partial<Record<FlagName, boolean>> = {};
  for (const name of PUBLIC_FLAGS) out[name] = flags[name];
  return out;
}

export class FeatureDisabledError extends Error {
  constructor(public readonly flag: FlagName) {
    super(`${flag} is disabled`);
    this.name = "FeatureDisabledError";
  }
}

export function requireFlag(flags: FeatureFlags, flag: FlagName): void {
  if (!flags[flag]) throw new FeatureDisabledError(flag);
}
