import { assertSameOrigin, errorResponse } from "@/lib/auth/http";
import { destroySession } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    await destroySession();
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
