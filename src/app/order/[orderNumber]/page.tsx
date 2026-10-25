import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ orderNumber: string }> };

export default async function OrderPage({ params }: Props) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <>
      <Header />
      <main className="section">
        <div className="container" style={{ maxWidth: 640 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div
              style={{
                fontSize: 48,
                marginBottom: 12,
              }}
            >
              ✓
            </div>
            <h1 className="section-title">Order Confirmed</h1>
            <p style={{ color: "var(--text-light)" }}>
              Thank you! Your order <strong>{order.orderNumber}</strong> has been received.
            </p>
          </div>

          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <span className="status status-{order.status.toLowerCase()}">{order.status}</span>
              <span className={`status status-${order.paymentStatus.toLowerCase()}`}>
                Payment: {order.paymentStatus}
              </span>
            </div>
            <p style={{ fontSize: 14, color: "var(--text-light)", marginBottom: 20 }}>
              {order.customerName} · {order.customerPhone}
              <br />
              {order.address}, {order.city}, {order.governorate}
            </p>
            {order.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 14,
                  marginBottom: 8,
                }}
              >
                <span>
                  {item.productName} ({item.size}/{item.color}) × {item.quantity}
                </span>
                <span>{item.lineTotal} EGP</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Subtotal</span>
                <span>{order.subtotal} EGP</span>
              </div>
              {order.discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--success)" }}>
                  <span>Discount</span>
                  <span>-{order.discountAmount} EGP</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Shipping</span>
                <span>{order.shippingCost === 0 ? "Free" : `${order.shippingCost} EGP`}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 700,
                  fontSize: 18,
                  marginTop: 8,
                }}
              >
                <span>Total</span>
                <span>{order.total} EGP</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Link href="/products" className="btn btn-outline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
