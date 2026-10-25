"use client";

import { useState, useTransition } from "react";
import { addToCart } from "@/actions/cart";
import { useRouter } from "next/navigation";

type Variant = {
  id: string;
  size: string;
  color: string;
  colorHex: string | null;
  stock: number;
  price: number;
};

export default function AddToCartForm({
  variants,
  sizes,
  colors,
}: {
  variants: Variant[];
  sizes: string[];
  colors: string[];
}) {
  const [size, setSize] = useState(sizes[0] || "");
  const [color, setColor] = useState(colors[0] || "");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const selected = variants.find((v) => v.size === size && v.color === color);
  const maxQty = selected?.stock ?? 0;

  function handleAdd() {
    setError("");
    setSuccess(false);
    if (!selected) {
      setError("Please select size and color");
      return;
    }
    if (maxQty < 1) {
      setError("This combination is out of stock");
      return;
    }
    startTransition(async () => {
      const res = await addToCart(selected.id, qty);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        router.refresh();
      }
    });
  }

  return (
    <div>
      {/* Size */}
      <div className="form-group">
        <label className="form-label">Size</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {sizes.map((s) => {
            const available = variants.some((v) => v.size === s && v.color === color && v.stock > 0);
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                disabled={!available}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: size === s ? "2px solid var(--text)" : "1.5px solid var(--border)",
                  background: size === s ? "var(--text)" : "#fff",
                  color: size === s ? "#fff" : "var(--text)",
                  fontWeight: 600,
                  fontSize: 14,
                  opacity: available ? 1 : 0.4,
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color */}
      <div className="form-group">
        <label className="form-label">Color: {color}</label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {colors.map((c) => {
            const v = variants.find((x) => x.color === c);
            const available = variants.some((x) => x.color === c && x.size === size && x.stock > 0);
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                disabled={!available}
                title={c}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: v?.colorHex || "#ccc",
                  border: color === c ? "3px solid var(--text)" : "2px solid var(--border)",
                  opacity: available ? 1 : 0.3,
                  boxShadow: color === c ? "0 0 0 2px #fff, 0 0 0 4px var(--text)" : undefined,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Qty */}
      <div className="form-group">
        <label className="form-label">Quantity {maxQty > 0 && `(${maxQty} available)`}</label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setQty(Math.max(1, qty - 1))}
          >
            −
          </button>
          <span style={{ fontWeight: 600, minWidth: 24, textAlign: "center" }}>{qty}</span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setQty(Math.min(maxQty, qty + 1))}
            disabled={qty >= maxQty}
          >
            +
          </button>
        </div>
      </div>

      {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}
      {success && (
        <p style={{ color: "var(--success)", marginBottom: 12, fontWeight: 600 }}>
          Added to cart!
        </p>
      )}

      <button
        type="button"
        className="btn btn-primary"
        onClick={handleAdd}
        disabled={pending || !selected || maxQty < 1}
        style={{ width: "100%", marginTop: 8 }}
      >
        {pending ? "Adding..." : "Add to Cart"}
      </button>
    </div>
  );
}
