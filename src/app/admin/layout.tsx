import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/coupons", label: "Coupons" },
    { href: "/admin/settings", label: "Settings" },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div style={{ padding: "0 24px 24px", fontFamily: "var(--font-hand)", fontSize: 24, fontWeight: 700 }}>
          MerchStore
        </div>
        <nav className="admin-nav">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: 24, marginTop: "auto" }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
            {session.email}
          </p>
          <form action={logoutAction}>
            <button
              type="submit"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </form>
          <Link href="/" style={{ display: "block", marginTop: 12, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            ← View Store
          </Link>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
