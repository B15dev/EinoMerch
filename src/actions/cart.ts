"use server";

import { revalidatePath } from "next/cache";
import { getCartItems, setCartItems } from "@/lib/cart";
import { prisma } from "@/lib/prisma";

export async function addToCart(variantId: string, quantity: number = 1) {
  if (quantity < 1) return { error: "Invalid quantity" };

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });
  if (!variant || !variant.isActive || !variant.product.isActive) {
    return { error: "Product not available" };
  }
  if (variant.stock < quantity) {
    return { error: `Only ${variant.stock} left in stock` };
  }

  const items = await getCartItems();
  const existing = items.find((i) => i.variantId === variantId);
  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > variant.stock) {
      return { error: `Only ${variant.stock} left in stock` };
    }
    existing.quantity = newQty;
  } else {
    items.push({ variantId, quantity });
  }
  await setCartItems(items);
  revalidatePath("/");
  revalidatePath("/cart");
  return { success: true };
}

export async function updateCartQty(variantId: string, quantity: number) {
  const items = await getCartItems();
  if (quantity <= 0) {
    await setCartItems(items.filter((i) => i.variantId !== variantId));
  } else {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant || quantity > variant.stock) {
      return { error: `Only ${variant?.stock ?? 0} left` };
    }
    const item = items.find((i) => i.variantId === variantId);
    if (item) item.quantity = quantity;
    await setCartItems(items);
  }
  revalidatePath("/cart");
  return { success: true };
}

export async function removeFromCart(variantId: string) {
  const items = await getCartItems();
  await setCartItems(items.filter((i) => i.variantId !== variantId));
  revalidatePath("/cart");
  return { success: true };
}

export async function clearCart() {
  await setCartItems([]);
  revalidatePath("/cart");
}
