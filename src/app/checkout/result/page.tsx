import { redirect } from "next/navigation";
import { confirmMockPayment } from "@/actions/order";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ orderId?: string; status?: string; mock?: string }>;
};

export default async function CheckoutResultPage({ searchParams }: Props) {
  const params = await searchParams;
  if (!params.orderId) redirect("/");

  if (params.mock === "1" && params.status === "success") {
    await confirmMockPayment(params.orderId);
  }

  const order = await prisma.order.findUnique({ where: { id: params.orderId } });
  if (!order) redirect("/");

  redirect(`/order/${order.orderNumber}`);
}
