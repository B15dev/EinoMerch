import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCartDetails } from "@/lib/cart";
import CartActions from "./CartActions";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const { lines, subtotal, itemCount } = await getCartDetails();

  return (
    <>
      <Header />
      <main className="section">
        <div className="container">
          <div className="section-label">Cart</div>
          <h1 className="section-title">Your Cart ({itemCount})</h1>

          {lines.length === 0 ? (
            <div className="empty">
              <p>Your cart is empty.</p>
              <Link href="/products" className="btn btn-primary" style={{ marginTop: 20 }}>
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 1fr",
                gap: 40,
                marginTop: 32,
              }}
              className="cart-layout"
            >
              <div>
                {lines.map((line) => (
                  <div
                    key={line.variantId}
                    className="card"
                    style={{
                      display: "flex",
                      gap: 16,
                      padding: 16,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 90,
                        height: 110,
                        background: "#f0eee9",
                        borderRadius: 8,
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {line.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={line.imageUrl}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{line.productName}</div>
                      <div style={{ fontSize: 13, color: "var(--text-light)", marginTop: 4 }}>
                        {line.size} / {line.color}
                      </div>
                      <div style={{ marginTop: 8, fontWeight: 600 }}>
                        {line.unitPrice} EGP
                      </div>
                      <CartActions
                        variantId={line.variantId}
                        quantity={line.quantity}
                        maxStock={line.stock}
                      />
                    </div>
                    <div style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                      {line.lineTotal} EGP
                    </div>
                  </div>
                ))}
              </div>

              <div className="card" style={{ padding: 24, height: "fit-content" }}>
                <h3 style={{ fontSize: 18, marginBottom: 16 }}>Order Summary</h3>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "var(--text-light)" }}>Subtotal</span>
                  <span>{subtotal} EGP</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 13, color: "var(--text-faint)" }}>
                  <span>Shipping calculated at checkout</span>
                </div>
                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    paddingTop: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 700,
                    fontSize: 18,
                    marginBottom: 24,
                  }}
                >
                  <span>Total</span>
                  <span>{subtotal} EGP</span>
                </div>
                <Link href="/checkout" className="btn btn-primary" style={{ width: "100%" }}>
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <style>{`
        @media (max-width: 768px) {
          .cart-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
