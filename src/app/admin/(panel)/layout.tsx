import { redirect } from "next/navigation";
import { getAdmin, ROLE_PERMISSIONS } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { Sidebar } from "@/components/admin/Sidebar";

export const metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  const general = await getSetting("general");
  return (
    <div className="min-h-screen">
      <Sidebar perms={ROLE_PERMISSIONS[admin.role]} admin={admin} siteName={general.siteName} />
      <div className="lg:pl-60">
        <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
