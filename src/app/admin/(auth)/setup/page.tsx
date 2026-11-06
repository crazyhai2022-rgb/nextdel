import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SetupForm } from "@/components/admin/SetupForm";

/** One-time first-admin creation. Only available when ADMIN_SETUP_TOKEN is set AND no admin exists. */
export default async function SetupPage() {
  if (!process.env.ADMIN_SETUP_TOKEN || (await prisma.adminUser.count()) > 0) notFound();
  return <SetupForm />;
}
