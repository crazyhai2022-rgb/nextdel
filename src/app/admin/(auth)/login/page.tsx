import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { LoginForm } from "@/components/admin/LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getAdmin()) redirect("/admin");
  const [{ next }, general] = await Promise.all([searchParams, getSetting("general")]);
  return <LoginForm next={next ?? "/admin"} siteName={general.siteName} />;
}
