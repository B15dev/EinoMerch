import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import UpdateOrderStatus from "./UpdateOrderStatus";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetail({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
      payments: true,
    },
  });
  if (!order) notFound();

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        Order {order.orderNumber}
      </h1>
      <p style={{ color: "var(--text-light)", marginBottom: 24 }}>
        {order.createdAt.toLocaleString()}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 12 }}>Customer</h3>
          <p>{order.customerName}</p>
          <p style={{ fontSize: 14, color: "var(--text-light)" }}>{order.customerPhone}</p>
          {order.customerEmail && (
            <p style={{ fontSize: 14, color: "var(--text-light)" }}>{order.customerEmail}</p>
          )}
          <p style={{ marginTop: 12, fontSize: 14 }}>
            {order.address}<br />
            {order.city}, {order.governorate}
          </p>
          {order.notes && (
            <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-faint)" }}>
              Note: {order.notes}
            </p>
          )}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 12 }}>Status</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <span className={`status status-${order.status.toLowerCase()}`}>{order.status}</span>
            <span className={`status status-${order.paymentStatus.toLowerCase()}`}>
              {order.paymentStatus}
            </span>
          </div>
          <UpdateOrderStatus orderId={order.id} currentStatus={order.status} />
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginTop: 24 }}>
        <h3 style={{ marginBottom: 12 }}>Items</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Variant</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id}>
                <td>{i.productName}</td>
                <td>{i.size} / {i.color}</td>
                <td>{i.quantity}</td>
                <td>{i.unitPrice} EGP</td>
                <td>{i.lineTotal} EGP</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ textAlign: "right", marginTop: 16, fontWeight: 700, fontSize: 18 }}>
          Total: {order.total} EGP
        </div>
      </div>

      {order.statusHistory.length > 0 && (
        <div className="card" style={{ padding: 20, marginTop: 24 }}>
          <h3 style={{ marginBottom: 12 }}>History</h3>
          {order.statusHistory.map((h) => (
            <div key={h.id} style={{ fontSize: 13, marginBottom: 8, color: "var(--text-light)" }}>
              {h.createdAt.toLocaleString()} — {h.fromStatus || "—"} → <strong>{h.toStatus}</strong>
              {h.note && ` (${h.note})`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
