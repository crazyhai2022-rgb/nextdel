import { requireAdmin } from "@/lib/auth";
import { handleError, json } from "@/lib/http";
import { reconcilePendingOrders } from "@/lib/payments/fulfill";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req, "orders");
    const r = await reconcilePendingOrders(100);
    await audit(admin.id, "reconcile_run", { details: r });
    return json({ ok: true, message: `Checked ${r.checked}: ${r.paid} paid, ${r.expired} expired, ${r.failedNotified} failure emails` });
  } catch (e) {
    return handleError(e);
  }
}
