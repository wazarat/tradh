import type { ReactNode } from "react";
import type { StrategyStatus } from "@tradh/core";
import { AllocationBar, type AllocationItem } from "./allocation-bar";
import { Rows, type Row } from "./rows";
import { StrategyStatusBadge } from "./status";

export interface StrategyCardProps {
  name: string;
  mode?: string;
  status: StrategyStatus;
  allocation?: AllocationItem[];
  limits?: Row[];
  actions?: ReactNode;
}

/** Summary of one strategy: mode, status, target allocation and the limits that bind it. */
export function StrategyCard({ name, mode = "Approval mode", status, allocation, limits, actions }: StrategyCardProps) {
  return (
    <section className="td-card td-strategy">
      <div className="td-eyebrow">Strategy · {mode}</div>
      <div className="td-strategy-top">
        <h3 className="td-h3">{name}</h3>
        <StrategyStatusBadge status={status} />
      </div>
      {allocation ? <AllocationBar items={allocation} /> : null}
      {limits ? <Rows rows={limits} /> : null}
      {actions ? <div className="td-actions">{actions}</div> : null}
    </section>
  );
}
