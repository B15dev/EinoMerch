import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      variants: { where: { isActive: true }, take: 1 },
    },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section
          style={{
            minHeight: "70vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "80px 24px",
          }}
        >
          <div style={{ maxWidth: 560 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--text-light)",
                marginBottom: 24,
                padding: "8px 20px",
                border: "1px solid var(--border)",
                borderRadius: 100,
                display: "inline-block",
              }}
            >
              New Collection
            </div>
            <h1
              style={{
                fontFamily: "var(--font-hand)",
                fontSize: "clamp(42px, 8vw, 72px)",
                fontWeight: 700,
                color: "#000",
                lineHeight: 1.05,
                marginBottom: 16,
              }}
            >
              Wear the{" "}
              <span style={{ color: "var(--primary)" }}>essentials</span>
            </h1>
            <p
              style={{
                fontFamily: "var(--font-hand)",
                fontSize: "clamp(18px, 3vw, 24px)",
                color: "var(--text-light)",
                marginBottom: 36,
              }}
            >
              Premium merch. Clean design. Built to last.
            </p>
            <Link href="/products" className="btn btn-primary">
              Shop Now →
            </Link>
          </div>
        </section>

        {/* Categories */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-label">Browse</div>
            <h2 className="section-title">Categories</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 20,
                marginTop: 32,
              }}
            >
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/products?category=${c.slug}`}
                  className="card"
                  style={{ padding: 32, textAlign: "center" }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-hand)",
                      fontSize: 24,
                      fontWeight: 600,
                    }}
                  >
                    {c.name}
                  </div>
                  {c.description && (
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--text-light)",
                        marginTop: 8,
                      }}
                    >
                      {c.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured products */}
        <section className="section" style={{ background: "#fafafa" }}>
          <div className="container">
            <div className="section-label">Featured</div>
            <h2 className="section-title">Best Sellers</h2>
            <div className="product-grid" style={{ marginTop: 40 }}>
              {products.map((p) => {
                const img = p.images[0]?.url;
                const hasDiscount =
                  p.compareAtPrice && p.compareAtPrice > p.basePrice;
                return (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className="card"
                    style={{ display: "block" }}
                  >
                    <div
                      style={{
                        aspectRatio: "3/4",
                        background: "#f0eee9",
                        overflow: "hidden",
                      }}
                    >
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt={p.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--text-faint)",
                          }}
                        >
                          No image
                        </div>
                      )}
                    </div>
                    <div style={{ padding: 16 }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          marginBottom: 6,
                        }}
                      >
                        {p.isNew && <span className="badge badge-new">New</span>}
                        {hasDiscount && (
                          <span className="badge badge-sale">Sale</span>
                        )}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>
                        {p.name}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 15 }}>
                        {hasDiscount && (
                          <span
                            style={{
                              textDecoration: "line-through",
                              color: "var(--text-faint)",
                              marginRight: 8,
                            }}
                          >
                            {p.compareAtPrice} EGP
                          </span>
                        )}
                        <span style={{ fontWeight: 600 }}>{p.basePrice} EGP</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <Link href="/products" className="btn btn-outline">
                View All Products
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
