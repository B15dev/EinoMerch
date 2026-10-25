import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 50,
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Orders</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <Link href={`/admin/orders/${o.id}`} style={{ fontWeight: 600, color: "var(--accent)" }}>
                  {o.orderNumber}
                </Link>
              </td>
              <td>
                <div>{o.customerName}</div>
                <div style={{ fontSize: 12, color: "var(--text-faint)" }}>{o.customerPhone}</div>
              </td>
              <td>{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
              <td>{o.total} EGP</td>
              <td>
                <span className={`status status-${o.status.toLowerCase()}`}>{o.status}</span>
              </td>
              <td>
                <span className={`status status-${o.paymentStatus.toLowerCase()}`}>
                  {o.paymentStatus}
                </span>
              </td>
              <td style={{ fontSize: 13 }}>{o.createdAt.toLocaleString()}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", color: "var(--text-faint)" }}>
                No orders yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
