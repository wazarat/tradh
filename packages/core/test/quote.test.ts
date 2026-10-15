import { describe, expect, it } from "vitest";
import { previewExactIn } from "../src/quote";

describe("previewExactIn", () => {
  const pool = { reserveIn: "1000", reserveOut: "200000", lpFeeBps: 30, protocolFeeBps: 0 };
  it("matches constant-product math", () => {
    const q = previewExactIn(pool, "10");
    // netIn = 9.97 ; out = 9.97*200000/(1009.97)
    expect(q.amountOut.toFixed(6)).toBe("1974.316069");
    expect(q.lpFee.toString()).toBe("0.03");
    expect(q.priceImpactBps.gt(0)).toBe(true);
    expect(q.spotPrice.toString()).toBe("200");
  });
  it("rejects empty input", () => {
    expect(() => previewExactIn(pool, "0")).toThrow();
  });
});
