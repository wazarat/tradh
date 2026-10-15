import { describe, expect, it } from "vitest";
import { applySlippage, formatPercent, formatUsd, fromUnits, toUnits, formatTokenAmount } from "../src/decimal";

describe("decimal helpers", () => {
  it("converts units both ways without float error", () => {
    expect(fromUnits(1_234_567n, 6).toString()).toBe("1.234567");
    expect(toUnits("0.1", 18)).toBe(100000000000000000n);
    expect(toUnits("1.0000009", 6)).toBe(1000000n); // rounds down
  });
  it("formats money and percents with true minus", () => {
    expect(formatUsd("24813.42")).toBe("$24,813.42");
    expect(formatUsd("-12.4")).toBe("−$12.40");
    expect(formatPercent(2.6)).toBe("+2.6%");
    expect(formatPercent(-1.84)).toBe("−1.8%");
    expect(formatPercent(0)).toBe("0.0%");
    expect(formatTokenAmount("2.7412", "mAAPL")).toBe("2.7412 mAAPL");
  });
  it("applies slippage in bps", () => {
    expect(applySlippage("100", 100).toString()).toBe("99");
  });
});
