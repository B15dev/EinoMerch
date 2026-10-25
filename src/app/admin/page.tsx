import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    totalOrders,
    pendingOrders,
    processingOrders,
    completedOrders,
    cancelledOrders,
    paidOrders,
    productCount,
    lowStock,
    outOfStock,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "PROCESSING" } }),
    prisma.order.count({ where: { status: { in: ["SHIPPED", "DELIVERED"] } } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
    prisma.order.findMany({
      where: { paymentStatus: "PAID" },
      select: { total: true },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.productVariant.count({
      where: { stock: { lte: 5, gt: 0 }, isActive: true },
    }),
    prisma.productVariant.count({ where: { stock: 0, isActive: true } }),
  ]);

  const revenue = paidOrders.reduce((s, o) => s + o.total, 0);

  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { items: true },
  });

  const cards = [
    { label: "Total Orders", value: totalOrders },
    { label: "Pending", value: pendingOrders },
    { label: "Processing", value: processingOrders },
    { label: "Completed", value: completedOrders },
    { label: "Cancelled", value: cancelledOrders },
    { label: "Revenue (Paid)", value: `${revenue.toFixed(0)} EGP` },
    { label: "Products", value: productCount },
    { label: "Low Stock", value: lowStock },
    { label: "Out of Stock", value: outOfStock },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 28 }}>Dashboard</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 16,
          marginBottom: 40,
        }}
      >
        {cards.map((c) => (
          <div key={c.label} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: "var(--text-light)", marginBottom: 6 }}>
              {c.label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{c.value}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Recent Orders</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {recentOrders.map((o) => (
            <tr key={o.id}>
              <td>
                <Link href={`/admin/orders/${o.id}`} style={{ color: "var(--accent)", fontWeight: 600 }}>
                  {o.orderNumber}
                </Link>
              </td>
              <td>{o.customerName}</td>
              <td>{o.total} EGP</td>
              <td>
                <span className={`status status-${o.status.toLowerCase()}`}>{o.status}</span>
              </td>
              <td>
                <span className={`status status-${o.paymentStatus.toLowerCase()}`}>
                  {o.paymentStatus}
                </span>
              </td>
              <td style={{ fontSize: 13, color: "var(--text-light)" }}>
                {o.createdAt.toLocaleDateString()}
              </td>
            </tr>
          ))}
          {recentOrders.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", color: "var(--text-faint)" }}>
                No orders yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
