import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        padding: "48px 0 24px",
        marginTop: 80,
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr",
            gap: 40,
            marginBottom: 40,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-hand)",
                fontSize: 28,
                fontWeight: 700,
                color: "var(--primary)",
                marginBottom: 12,
              }}
            >
              MerchStore
            </div>
            <p style={{ fontSize: 14, color: "var(--text-light)", maxWidth: 280 }}>
              Premium clothing and merch. Clean design, quality materials.
            </p>
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Shop
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/products" style={{ fontSize: 14, color: "var(--text-light)" }}>
                All Products
              </Link>
              <Link href="/products?category=t-shirts" style={{ fontSize: 14, color: "var(--text-light)" }}>
                T-Shirts
              </Link>
              <Link href="/products?category=hoodies" style={{ fontSize: 14, color: "var(--text-light)" }}>
                Hoodies
              </Link>
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Info
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/policies/shipping" style={{ fontSize: 14, color: "var(--text-light)" }}>
                Shipping
              </Link>
              <Link href="/policies/returns" style={{ fontSize: 14, color: "var(--text-light)" }}>
                Returns
              </Link>
              <Link href="/policies/privacy" style={{ fontSize: 14, color: "var(--text-light)" }}>
                Privacy
              </Link>
              <Link href="/policies/terms" style={{ fontSize: 14, color: "var(--text-light)" }}>
                Terms
              </Link>
            </div>
          </div>
        </div>
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: 20,
            textAlign: "center",
            fontSize: 13,
            color: "var(--text-faint)",
          }}
        >
          © {new Date().getFullYear()} MerchStore. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
