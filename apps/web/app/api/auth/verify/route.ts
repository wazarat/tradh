import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { parseSiweMessage, validateSiweMessage } from "viem/siwe";
import { getPublicClient, robinhoodTestnet } from "@tradh/chain";
import { siweNonces } from "@tradh/db";
import { db } from "@/lib/db";
import { assertSameOrigin, errorResponse } from "@/lib/auth/http";
import { createSessionForWallet } from "@/lib/auth/session";

const bodySchema = z.object({
  message: z.string().min(1).max(4000),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
    const { message, signature } = parsed.data;

    const siwe = parseSiweMessage(message);
    const host = req.headers.get("host") ?? "";
    if (!siwe.address || !siwe.nonce || !siwe.chainId) return Response.json({ error: "invalid_message" }, { status: 400 });
    if (!validateSiweMessage({ message: siwe, domain: host })) return Response.json({ error: "invalid_message" }, { status: 400 });
    if (siwe.chainId !== robinhoodTestnet.id) return Response.json({ error: "wrong_chain" }, { status: 400 });

    const d = db();
    const [nonceRow] = await d
      .update(siweNonces)
      .set({ consumedAt: new Date() })
      .where(and(eq(siweNonces.nonce, siwe.nonce), isNull(siweNonces.consumedAt), gt(siweNonces.expiresAt, new Date())))
      .returning({ nonce: siweNonces.nonce });
    if (!nonceRow) return Response.json({ error: "invalid_nonce" }, { status: 400 });

    const ok = await getPublicClient().verifySiweMessage({ message, signature: signature as `0x${string}` });
    if (!ok) return Response.json({ error: "invalid_signature" }, { status: 401 });

    const session = await createSessionForWallet(siwe.address, siwe.chainId, req.headers.get("user-agent"), req.headers.get("x-forwarded-for"));
    return Response.json({ ok: true, address: session.walletAddress, chainId: session.chainId, expiresAt: session.expiresAt.toISOString() });
  } catch (err) {
    return errorResponse(err);
  }
}
