import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ category?: string; q?: string; sort?: string; page?: string }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const perPage = 12;
  const where: Record<string, unknown> = { isActive: true };

  if (params.category) {
    where.category = { slug: params.category };
  }
  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
    ];
  }

  let orderBy: Record<string, string> = { createdAt: "desc" };
  if (params.sort === "price-asc") orderBy = { basePrice: "asc" };
  if (params.sort === "price-desc") orderBy = { basePrice: "desc" };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: true,
        variants: { where: { isActive: true } },
      },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <>
      <Header />
      <main className="section">
        <div className="container">
          <div className="section-label">Shop</div>
          <h1 className="section-title">All Products</h1>

          {/* Filters */}
          <form
            method="get"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              margin: "32px 0",
              alignItems: "center",
            }}
          >
            <input
              type="search"
              name="q"
              defaultValue={params.q}
              placeholder="Search products..."
              className="form-input"
              style={{ maxWidth: 220 }}
            />
            <select name="category" defaultValue={params.category || ""} className="form-select" style={{ maxWidth: 180 }}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
            <select name="sort" defaultValue={params.sort || ""} className="form-select" style={{ maxWidth: 180 }}>
              <option value="">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
            <button type="submit" className="btn btn-primary btn-sm">Filter</button>
          </form>

          {products.length === 0 ? (
            <div className="empty">No products found.</div>
          ) : (
            <div className="product-grid">
              {products.map((p) => {
                const img = p.images[0]?.url;
                const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
                const hasDiscount = p.compareAtPrice && p.compareAtPrice > p.basePrice;
                return (
                  <Link key={p.id} href={`/products/${p.slug}`} className="card" style={{ display: "block" }}>
                    <div style={{ aspectRatio: "3/4", background: "#f0eee9", position: "relative" }}>
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : null}
                      {totalStock === 0 && (
                        <span className="badge badge-out" style={{ position: "absolute", top: 12, left: 12 }}>
                          Sold out
                        </span>
                      )}
                    </div>
                    <div style={{ padding: 16 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</div>
                      <div style={{ marginTop: 6, fontSize: 14, color: "var(--text-light)" }}>
                        {p.category?.name}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 15 }}>
                        {hasDiscount && (
                          <span style={{ textDecoration: "line-through", color: "var(--text-faint)", marginRight: 8 }}>
                            {p.compareAtPrice} EGP
                          </span>
                        )}
                        <strong>{p.basePrice} EGP</strong>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 40 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={`/products?page=${n}${params.category ? `&category=${params.category}` : ""}${params.q ? `&q=${params.q}` : ""}`}
                  className="btn btn-sm"
                  style={{
                    background: n === page ? "var(--text)" : "transparent",
                    color: n === page ? "#fff" : "var(--text)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {n}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
