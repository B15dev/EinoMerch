import { redirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCartDetails } from "@/lib/cart";
import { prisma } from "@/lib/prisma";
import CheckoutForm from "./CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const { lines, subtotal, itemCount } = await getCartDetails();
  if (itemCount === 0) redirect("/cart");

  const zones = await prisma.shippingZone.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <>
      <Header />
      <main className="section">
        <div className="container">
          <div className="section-label">Checkout</div>
          <h1 className="section-title">Complete Your Order</h1>
          <CheckoutForm lines={lines} subtotal={subtotal} zones={zones} />
        </div>
      </main>
      <Footer />
    </>
  );
}
