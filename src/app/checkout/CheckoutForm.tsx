"use client";

import { useState, useTransition } from "react";
import { createOrder } from "@/actions/order";
import { useRouter } from "next/navigation";

type Line = {
  variantId: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type Zone = { id: string; name: string; price: number; freeAbove: number | null };

export default function CheckoutForm({
  lines,
  subtotal,
  zones,
}: {
  lines: Line[];
  subtotal: number;
  zones: Zone[];
}) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [gov, setGov] = useState(zones[0]?.name || "");
  const router = useRouter();

  const zone = zones.find((z) => z.name === gov);
  let shipping = zone?.price ?? 50;
  if (zone?.freeAbove && subtotal >= zone.freeAbove) shipping = 0;
  const total = subtotal + shipping;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await createOrder(fd);
      if (res.error) {
        setError(res.error);
      } else if (res.redirect) {
        router.push(res.redirect);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr",
        gap: 40,
        marginTop: 32,
      }}
      className="checkout-grid"
    >
      <div>
        <h3 style={{ marginBottom: 16 }}>Shipping Details</h3>
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input name="customerName" required className="form-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Phone *</label>
          <input name="customerPhone" required type="tel" className="form-input" placeholder="+20..." />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input name="customerEmail" type="email" className="form-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Governorate *</label>
          <select
            name="governorate"
            required
            className="form-select"
            value={gov}
            onChange={(e) => setGov(e.target.value)}
          >
            {zones.map((z) => (
              <option key={z.id} value={z.name}>
                {z.name} ({z.price} EGP{z.freeAbove ? ` · free over ${z.freeAbove}` : ""})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">City *</label>
          <input name="city" required className="form-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Full Address *</label>
          <textarea name="address" required className="form-textarea" rows={3} />
        </div>
        <div className="form-group">
          <label className="form-label">Notes (optional)</label>
          <textarea name="notes" className="form-textarea" rows={2} />
        </div>
        <div className="form-group">
          <label className="form-label">Coupon Code</label>
          <input name="couponCode" className="form-input" placeholder="WELCOME10" />
        </div>
        <div className="form-group">
          <label className="form-label">Payment Method *</label>
          <select name="paymentMethod" className="form-select" defaultValue="MOCK">
            <option value="MOCK">Mock Payment (Dev)</option>
            <option value="COD">Cash on Delivery</option>
            <option value="PAYMOB">Card (Paymob)</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 24, height: "fit-content" }}>
        <h3 style={{ marginBottom: 16 }}>Order Summary</h3>
        {lines.map((l) => (
          <div
            key={l.variantId}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 14,
              marginBottom: 10,
            }}
          >
            <span>
              {l.productName} ({l.size}/{l.color}) × {l.quantity}
            </span>
            <span>{l.lineTotal} EGP</span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid var(--border)", margin: "16px 0", paddingTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "var(--text-light)" }}>Subtotal</span>
            <span>{subtotal} EGP</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "var(--text-light)" }}>Shipping</span>
            <span>{shipping === 0 ? "Free" : `${shipping} EGP`}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 700,
              fontSize: 18,
              marginTop: 12,
            }}
          >
            <span>Total</span>
            <span>{total} EGP</span>
          </div>
        </div>
        {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}
        <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={pending}>
          {pending ? "Placing Order..." : "Place Order"}
        </button>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </form>
  );
}
