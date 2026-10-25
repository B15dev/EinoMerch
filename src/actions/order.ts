"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCartDetails, setCartItems } from "@/lib/cart";
import { createPaymentIntent } from "@/lib/payment";
import { getSession } from "@/lib/auth";

const checkoutSchema = z.object({
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().min(8).max(20),
  governorate: z.string().min(2),
  city: z.string().min(2),
  address: z.string().min(5),
  notes: z.string().max(500).optional(),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(["COD", "PAYMOB", "MOCK"]),
});

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MS-${ts}-${rand}`;
}

export async function createOrder(formData: FormData) {
  const raw = {
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail") || "",
    customerPhone: formData.get("customerPhone"),
    governorate: formData.get("governorate"),
    city: formData.get("city"),
    address: formData.get("address"),
    notes: formData.get("notes") || undefined,
    couponCode: formData.get("couponCode") || undefined,
    paymentMethod: formData.get("paymentMethod") || "MOCK",
  };

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid form data", details: parsed.error.flatten() };
  }
  const data = parsed.data;

  const { lines, subtotal } = await getCartDetails();
  if (lines.length === 0) {
    return { error: "Cart is empty" };
  }

  // Re-validate stock & prices from DB
  for (const line of lines) {
    const v = await prisma.productVariant.findUnique({
      where: { id: line.variantId },
    });
    if (!v || v.stock < line.quantity) {
      return {
        error: `Insufficient stock for ${line.productName} (${line.size}/${line.color})`,
      };
    }
  }

  // Coupon
  let discountAmount = 0;
  let couponId: string | undefined;
  let couponCode: string | undefined;
  if (data.couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: data.couponCode.toUpperCase() },
    });
    if (
      coupon &&
      coupon.isActive &&
      (!coupon.startsAt || coupon.startsAt <= new Date()) &&
      (!coupon.endsAt || coupon.endsAt >= new Date()) &&
      (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) &&
      (!coupon.minOrderAmount || subtotal >= coupon.minOrderAmount)
    ) {
      if (coupon.type === "PERCENT") {
        discountAmount = (subtotal * coupon.value) / 100;
        if (coupon.maxDiscount) {
          discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        }
      } else {
        discountAmount = coupon.value;
      }
      couponId = coupon.id;
      couponCode = coupon.code;
    }
  }

  // Shipping
  const zone = await prisma.shippingZone.findFirst({
    where: { name: data.governorate, isActive: true },
  });
  let shippingCost = zone?.price ?? Number(process.env.DEFAULT_SHIPPING_COST || 50);
  if (zone?.freeAbove && subtotal - discountAmount >= zone.freeAbove) {
    shippingCost = 0;
  }

  const total = Math.max(0, subtotal - discountAmount + shippingCost);
  const session = await getSession();
  const orderNumber = generateOrderNumber();

  // Transaction: create order + reserve stock
  try {
    const order = await prisma.$transaction(async (tx) => {
      // Double-check stock inside transaction
      for (const line of lines) {
        const v = await tx.productVariant.findUnique({
          where: { id: line.variantId },
        });
        if (!v || v.stock < line.quantity) {
          throw new Error(`Stock changed for ${line.productName}`);
        }
        await tx.productVariant.update({
          where: { id: line.variantId },
          data: { stock: { decrement: line.quantity } },
        });
        await tx.inventoryLog.create({
          data: {
            variantId: line.variantId,
            change: -line.quantity,
            reason: "ORDER",
            note: `Order ${orderNumber}`,
          },
        });
      }

      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: session?.id,
          customerName: data.customerName,
          customerEmail: data.customerEmail || null,
          customerPhone: data.customerPhone,
          governorate: data.governorate,
          city: data.city,
          address: data.address,
          notes: data.notes,
          subtotal,
          discountAmount,
          shippingCost,
          total,
          couponId,
          couponCode,
          status: "PENDING",
          paymentStatus: "PENDING",
          paymentMethod: data.paymentMethod,
          inventoryReserved: true,
          items: {
            create: lines.map((l) => ({
              productId: l.productId,
              variantId: l.variantId,
              productName: l.productName,
              size: l.size,
              color: l.color,
              unitPrice: l.unitPrice,
              quantity: l.quantity,
              lineTotal: l.lineTotal,
              imageUrl: l.imageUrl,
            })),
          },
          statusHistory: {
            create: {
              toStatus: "PENDING",
              note: "Order created",
              changedBy: "system",
            },
          },
        },
      });

      return newOrder;
    });

    // Payment
    if (data.paymentMethod === "COD") {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "PENDING", status: "PROCESSING" },
      });
      await setCartItems([]);
      revalidatePath("/admin");
      return { success: true, orderId: order.id, orderNumber, redirect: `/order/${order.orderNumber}` };
    }

    const payment = await createPaymentIntent(order.id, total, {
      name: data.customerName,
      email: data.customerEmail,
      phone: data.customerPhone,
    });

    if (!payment.success) {
      // Release stock on payment init failure
      await releaseOrderStock(order.id);
      return { error: payment.error || "Payment failed to start" };
    }

    await setCartItems([]);
    revalidatePath("/admin");
    return {
      success: true,
      orderId: order.id,
      orderNumber,
      redirect: payment.redirectUrl || `/order/${order.orderNumber}`,
    };
  } catch (e) {
    console.error(e);
    return { error: e instanceof Error ? e.message : "Failed to create order" };
  }
}

async function releaseOrderStock(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || !order.inventoryReserved) return;

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
        await tx.inventoryLog.create({
          data: {
            variantId: item.variantId,
            change: item.quantity,
            reason: "CANCEL",
            orderId,
            note: "Stock released - payment failed",
          },
        });
      }
    }
    await tx.order.update({
      where: { id: orderId },
      data: {
        inventoryReserved: false,
        status: "CANCELLED",
        paymentStatus: "FAILED",
      },
    });
  });
}

export async function confirmMockPayment(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Order not found" };

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        status: "PROCESSING",
      },
    });
    await tx.payment.updateMany({
      where: { orderId, status: "PENDING" },
      data: { status: "SUCCESS", processedAt: new Date() },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: "PROCESSING",
        note: "Payment confirmed (mock)",
        changedBy: "system",
      },
    });
  });

  revalidatePath("/admin");
  return { success: true };
}
