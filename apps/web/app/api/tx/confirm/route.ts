import { assertSameOrigin, errorResponse } from "@/lib/auth/http";
import { requireSession } from "@/lib/auth/session";
import { confirmSwap } from "@/lib/trading/server";
import { confirmTxSchema } from "@/lib/trading/types";

/** Server-side confirmation: reads the receipt from the chain and records it. Never trusts client-supplied amounts. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await requireSession();
    const parsed = confirmTxSchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
    const result = await confirmSwap(session, parsed.data.txHash as `0x${string}`, parsed.data.orderId);
    return Response.json(result);
  } catch (err) {
    if (err instanceof Error && /not a swap|not sent by/.test(err.message)) return Response.json({ error: err.message }, { status: 400 });
    return errorResponse(err);
  }
}
