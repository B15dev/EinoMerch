import Link from "next/link";
import { getCartDetails } from "@/lib/cart";
import { getSession } from "@/lib/auth";

export default async function Header() {
  const { itemCount } = await getCartDetails();
  const session = await getSession();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "linear-gradient(to bottom, #fff 70%, transparent)",
        padding: "20px 0",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-hand)",
            fontSize: 28,
            fontWeight: 700,
            color: "#000",
          }}
        >
          MerchStore
        </Link>

        <nav
          style={{
            display: "flex",
            gap: 28,
            alignItems: "center",
          }}
          className="desktop-nav"
        >
          <Link href="/products" style={{ fontSize: 14, color: "var(--text-light)" }}>
            Shop
          </Link>
          <Link href="/products?category=t-shirts" style={{ fontSize: 14, color: "var(--text-light)" }}>
            T-Shirts
          </Link>
          <Link href="/products?category=hoodies" style={{ fontSize: 14, color: "var(--text-light)" }}>
            Hoodies
          </Link>
          <Link href="/cart" style={{ fontSize: 14, color: "var(--text-light)", position: "relative" }}>
            Cart
            {itemCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -8,
                  right: -14,
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {itemCount}
              </span>
            )}
          </Link>
          {session?.role === "ADMIN" ? (
            <Link href="/admin" style={{ fontSize: 14, color: "var(--accent)", fontWeight: 600 }}>
              Admin
            </Link>
          ) : session ? (
            <Link href="/account" style={{ fontSize: 14, color: "var(--text-light)" }}>
              Account
            </Link>
          ) : (
            <Link href="/login" style={{ fontSize: 14, color: "var(--text-light)" }}>
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
