"use client";

import { useTransition } from "react";
import { updateCartQty, removeFromCart } from "@/actions/cart";
import { useRouter } from "next/navigation";

export default function CartActions({
  variantId,
  quantity,
  maxStock,
}: {
  variantId: string;
  quantity: number;
  maxStock: number;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
      <button
        className="btn btn-outline btn-sm"
        disabled={pending || quantity <= 1}
        onClick={() =>
          start(async () => {
            await updateCartQty(variantId, quantity - 1);
            router.refresh();
          })
        }
      >
        −
      </button>
      <span style={{ minWidth: 20, textAlign: "center", fontWeight: 600 }}>{quantity}</span>
      <button
        className="btn btn-outline btn-sm"
        disabled={pending || quantity >= maxStock}
        onClick={() =>
          start(async () => {
            await updateCartQty(variantId, quantity + 1);
            router.refresh();
          })
        }
      >
        +
      </button>
      <button
        className="btn btn-sm"
        style={{ marginLeft: 8, color: "var(--danger)", background: "transparent" }}
        disabled={pending}
        onClick={() =>
          start(async () => {
            await removeFromCart(variantId);
            router.refresh();
          })
        }
      >
        Remove
      </button>
    </div>
  );
}
