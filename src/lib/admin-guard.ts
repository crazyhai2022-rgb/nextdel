import { redirect } from "next/navigation";
import { can, getAdmin, type SessionAdmin } from "./auth";

/** For admin server pages: ensures permission or redirects to the dashboard. */
export async function guardPage(perm: string): Promise<SessionAdmin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (!can(admin.role, perm)) redirect("/admin?denied=1");
  return admin;
}
