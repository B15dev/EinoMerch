import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      variants: true,
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Products</h1>
        <Link href="/admin/products/new" className="btn btn-primary btn-sm">
          + Add Product
        </Link>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const stock = p.variants.reduce((s, v) => s + v.stock, 0);
            return (
              <tr key={p.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {p.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0].url}
                        alt=""
                        style={{ width: 40, height: 48, objectFit: "cover", borderRadius: 4 }}
                      />
                    )}
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                  </div>
                </td>
                <td>{p.category?.name || "—"}</td>
                <td>{p.basePrice} EGP</td>
                <td>
                  <span style={{ color: stock === 0 ? "var(--danger)" : stock <= 5 ? "var(--warning)" : undefined }}>
                    {stock}
                  </span>
                </td>
                <td>
                  <span className={`status ${p.isActive ? "status-paid" : "status-cancelled"}`}>
                    {p.isActive ? "Active" : "Hidden"}
                  </span>
                </td>
                <td>
                  <Link href={`/admin/products/${p.id}`} style={{ color: "var(--accent)", fontSize: 13 }}>
                    Edit
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
