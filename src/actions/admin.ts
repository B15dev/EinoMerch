"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export async function updateOrderStatus(orderId: string, newStatus: string, note?: string) {
  const admin = await requireAdmin();
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { error: "Order not found" };

  const allowed = ALLOWED_TRANSITIONS[order.status] || [];
  if (!allowed.includes(newStatus)) {
    return { error: `Cannot transition from ${order.status} to ${newStatus}` };
  }

  await prisma.$transaction(async (tx) => {
    if (newStatus === "CANCELLED" && order.inventoryReserved) {
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
              adminId: admin.id,
              note: "Order cancelled by admin",
            },
          });
        }
      }
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        inventoryReserved: newStatus === "CANCELLED" ? false : order.inventoryReserved,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: newStatus,
        note: note || undefined,
        changedBy: admin.id,
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}
