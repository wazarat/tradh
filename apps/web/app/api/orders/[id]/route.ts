import { and, eq } from "drizzle-orm";
import { tradeOrders } from "@tradh/db";
import { canTransition } from "@tradh/core";
import { db } from "@/lib/db";
import { assertSameOrigin, errorResponse } from "@/lib/auth/http";
import { requireSession } from "@/lib/auth/session";
import { orderStateSchema } from "@/lib/trading/types";

/** Moves an order between non-terminal states (awaiting → submitted / rejected / expired). */
export async function PATCH(req: Request, ctx: RouteContext<"/api/orders/[id]">) {
  try {
    assertSameOrigin(req);
    const session = await requireSession();
    const { id } = await ctx.params;
    const parsed = orderStateSchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
    const d = db();
    const order = await d.query.tradeOrders.findFirst({ where: and(eq(tradeOrders.id, id), eq(tradeOrders.userId, session.userId)) });
    if (!order) return Response.json({ error: "not_found" }, { status: 404 });
    if (!canTransition(order.state, parsed.data.state)) return Response.json({ error: "invalid_transition", from: order.state, to: parsed.data.state }, { status: 409 });
    await d.update(tradeOrders).set({ state: parsed.data.state, updatedAt: new Date() }).where(eq(tradeOrders.id, id));
    return Response.json({ id, state: parsed.data.state });
  } catch (err) {
    return errorResponse(err);
  }
}
