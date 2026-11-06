import { destroySession } from "@/lib/auth";
import { assertSameOrigin, handleError, json } from "@/lib/http";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    await destroySession();
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
