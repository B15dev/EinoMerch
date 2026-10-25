import { cookies } from "next/headers";
import { prisma } from "./prisma";

export type CartItem = {
  variantId: string;
  quantity: number;
};

export type CartLine = {
  variantId: string;
  quantity: number;
  productId: string;
  productName: string;
  size: string;
  color: string;
  unitPrice: number;
  stock: number;
  imageUrl: string | null;
  lineTotal: number;
};

const CART_COOKIE = "cart";

export async function getCartItems(): Promise<CartItem[]> {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

export async function setCartItems(items: CartItem[]) {
  const store = await cookies();
  store.set(CART_COOKIE, JSON.stringify(items), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function getCartDetails(): Promise<{
  lines: CartLine[];
  subtotal: number;
  itemCount: number;
}> {
  const items = await getCartItems();
  if (items.length === 0) {
    return { lines: [], subtotal: 0, itemCount: 0 };
  }

  const variantIds = items.map((i) => i.variantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds }, isActive: true },
    include: {
      product: {
        include: {
          images: { where: { isPrimary: true }, take: 1 },
        },
      },
    },
  });

  const lines: CartLine[] = [];
  let subtotal = 0;
  let itemCount = 0;

  for (const item of items) {
    const v = variants.find((x) => x.id === item.variantId);
    if (!v || !v.product.isActive) continue;
    const qty = Math.min(item.quantity, v.stock);
    if (qty <= 0) continue;
    const price = v.price ?? v.product.basePrice;
    const lineTotal = price * qty;
    lines.push({
      variantId: v.id,
      quantity: qty,
      productId: v.productId,
      productName: v.product.name,
      size: v.size,
      color: v.color,
      unitPrice: price,
      stock: v.stock,
      imageUrl: v.product.images[0]?.url ?? null,
      lineTotal,
    });
    subtotal += lineTotal;
    itemCount += qty;
  }

  return { lines, subtotal, itemCount };
}
