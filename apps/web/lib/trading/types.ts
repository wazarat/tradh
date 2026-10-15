import { z } from "zod";

export const createOrderSchema = z.object({
  idempotencyKey: z.string().uuid(),
  chainId: z.literal(46630),
  venue: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  sellAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  buyAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  amountIn: z.string(),
  quotedAmountOut: z.string(),
  minAmountOut: z.string(),
  quotedPriceImpactBps: z.number().int().min(0),
  slippageBps: z.number().int().min(1).max(500),
  lpFee: z.string(),
  protocolFee: z.string(),
  quoteExpiresAt: z.string().datetime(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderStateSchema = z.object({
  state: z.enum(["awaiting", "submitted", "rejected", "expired"]),
  txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/).optional(),
});

export const confirmTxSchema = z.object({
  txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  orderId: z.string().uuid().optional(),
});
