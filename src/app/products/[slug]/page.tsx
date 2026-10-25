import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import AddToCartForm from "./AddToCartForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
      variants: { where: { isActive: true }, orderBy: [{ color: "asc" }, { size: "asc" }] },
    },
  });
  if (!product) notFound();

  const sizes = [...new Set(product.variants.map((v) => v.size))];
  const colors = [...new Set(product.variants.map((v) => v.color))];
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.basePrice;
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);

  return (
    <>
      <Header />
      <main className="section">
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 48,
              alignItems: "start",
            }}
            className="product-detail"
          >
            {/* Images */}
            <div>
              <div
                style={{
                  aspectRatio: "3/4",
                  background: "#f0eee9",
                  borderRadius: "var(--radius)",
                  overflow: "hidden",
                  marginBottom: 12,
                }}
              >
                {product.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0].url}
                    alt={product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : null}
              </div>
              {product.images.length > 1 && (
                <div style={{ display: "flex", gap: 8 }}>
                  {product.images.map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={img.id}
                      src={img.url}
                      alt=""
                      style={{
                        width: 72,
                        height: 72,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              {product.category && (
                <div className="section-label">{product.category.name}</div>
              )}
              <h1
                style={{
                  fontFamily: "var(--font-hand)",
                  fontSize: "clamp(28px, 4vw, 40px)",
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                {product.name}
              </h1>
              <div style={{ fontSize: 22, marginBottom: 20 }}>
                {hasDiscount && (
                  <span
                    style={{
                      textDecoration: "line-through",
                      color: "var(--text-faint)",
                      marginRight: 12,
                      fontSize: 18,
                    }}
                  >
                    {product.compareAtPrice} EGP
                  </span>
                )}
                <strong>{product.basePrice} EGP</strong>
              </div>
              {product.description && (
                <p style={{ color: "var(--text-light)", marginBottom: 28, lineHeight: 1.8 }}>
                  {product.description}
                </p>
              )}

              {totalStock === 0 ? (
                <div className="badge badge-out" style={{ fontSize: 14, padding: "8px 16px" }}>
                  Currently out of stock
                </div>
              ) : (
                <AddToCartForm
                  variants={product.variants.map((v) => ({
                    id: v.id,
                    size: v.size,
                    color: v.color,
                    colorHex: v.colorHex,
                    stock: v.stock,
                    price: v.price ?? product.basePrice,
                  }))}
                  sizes={sizes}
                  colors={colors}
                />
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <style>{`
        @media (max-width: 768px) {
          .product-detail { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </>
  );
}
