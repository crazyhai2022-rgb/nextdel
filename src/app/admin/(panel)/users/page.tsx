import { prisma } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { Badge, PageHeader, Panel, Table, td, fmtDate } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/client";
import { NewAdminForm, ChangePasswordForm } from "@/components/admin/UserForms";

export const metadata = { title: "Admin Users" };

export default async function UsersPage() {
  const me = await guardPage("users");
  const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <div>
      <PageHeader title="Admin users" description="Roles: Super admin (everything), Admin (all except user management), Support (orders, customers, emails, inquiries)." />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Table head={["User", "Role", "Status", "Last login", ""]}>
          {users.map((u) => (
            <tr key={u.id}>
              <td className={td}><div className="text-ink">{u.name}{u.id === me.id && <span className="ml-1 text-xs text-ink-muted">(you)</span>}</div><div className="text-xs text-ink-muted">{u.email}</div></td>
              <td className={td}>{u.role.replace("_", " ").toLowerCase()}</td>
              <td className={td}><Badge tone={u.active ? "green" : "zinc"} label={u.active ? "Active" : "Disabled"} /></td>
              <td className={td}>{fmtDate(u.lastLoginAt)}</td>
              <td className={td}>{u.id !== me.id && <ActionButton url="/api/admin/users" method="PATCH" body={{ id: u.id, active: !u.active }} label={u.active ? "Disable" : "Enable"} confirm={u.active ? `Disable ${u.email}? Their sessions end immediately.` : undefined} />}</td>
            </tr>
          ))}
        </Table>
        <div className="space-y-4">
          <Panel title="Add admin"><NewAdminForm /></Panel>
          <Panel title="Change your password"><ChangePasswordForm /></Panel>
        </div>
      </div>
    </div>
  );
}
