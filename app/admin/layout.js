import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminLayout({ children }) {
  await requireAdmin();
  return children;
}
