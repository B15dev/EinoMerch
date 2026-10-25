/**
 * Payment provider abstraction.
 * Supports: mock (dev), Paymob sandbox/live.
 * Never stores card data.
 */

import { prisma } from "./prisma";

export type PaymentResult = {
  success: boolean;
  redirectUrl?: string;
  paymentId?: string;
  providerRef?: string;
  error?: string;
};

export type WebhookResult = {
  success: boolean;
  orderId?: string;
  providerRef?: string;
  amount?: number;
  status: "SUCCESS" | "FAILED" | "PENDING";
};

const MODE = process.env.PAYMENT_MODE || "mock";

export async function createPaymentIntent(
  orderId: string,
  amount: number,
  customer: { name: string; email?: string; phone: string }
): Promise<PaymentResult> {
  if (MODE === "mock") {
    // Mock: create a pending payment and return a success redirect
    const payment = await prisma.payment.create({
      data: {
        orderId,
        provider: "MOCK",
        amount,
        currency: process.env.CURRENCY || "EGP",
        status: "PENDING",
        providerRef: `mock_${Date.now()}`,
      },
    });
    return {
      success: true,
      redirectUrl: `/checkout/result?orderId=${orderId}&status=success&mock=1`,
      paymentId: payment.id,
      providerRef: payment.providerRef || undefined,
    };
  }

  if (MODE === "sandbox" || MODE === "live") {
    // Paymob integration skeleton
    // Docs: https://docs.paymob.com/
    const apiKey = process.env.PAYMOB_API_KEY;
    const integrationId = process.env.PAYMOB_INTEGRATION_ID;
    if (!apiKey || !integrationId) {
      return {
        success: false,
        error: "Payment provider not configured. Set PAYMOB_* env vars.",
      };
    }

    try {
      // 1. Authenticate
      const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey }),
      });
      const authData = await authRes.json();
      const token = authData.token;
      if (!token) throw new Error("Paymob auth failed");

      // 2. Create order
      const orderRes = await fetch(
        "https://accept.paymob.com/api/ecommerce/orders",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth_token: token,
            delivery_needed: false,
            amount_cents: Math.round(amount * 100),
            currency: "EGP",
            merchant_order_id: orderId,
          }),
        }
      );
      const orderData = await orderRes.json();

      // 3. Payment key
      const keyRes = await fetch(
        "https://accept.paymob.com/api/acceptance/payment_keys",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth_token: token,
            amount_cents: Math.round(amount * 100),
            expiration: 3600,
            order_id: orderData.id,
            billing_data: {
              first_name: customer.name.split(" ")[0] || "Customer",
              last_name: customer.name.split(" ").slice(1).join(" ") || "User",
              email: customer.email || "customer@example.com",
              phone_number: customer.phone,
              apartment: "NA",
              floor: "NA",
              street: "NA",
              building: "NA",
              city: "Cairo",
              country: "EG",
              state: "NA",
            },
            currency: "EGP",
            integration_id: Number(integrationId),
          }),
        }
      );
      const keyData = await keyRes.json();

      const payment = await prisma.payment.create({
        data: {
          orderId,
          provider: "PAYMOB",
          amount,
          currency: "EGP",
          status: "PENDING",
          providerRef: String(orderData.id),
        },
      });

      const iframeId = process.env.PAYMOB_IFRAME_ID;
      return {
        success: true,
        redirectUrl: `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${keyData.token}`,
        paymentId: payment.id,
        providerRef: String(orderData.id),
      };
    } catch (e) {
      console.error("Paymob error", e);
      return { success: false, error: "Payment initiation failed" };
    }
  }

  return { success: false, error: "Unknown payment mode" };
}

/**
 * Verify Paymob HMAC webhook (call this on server only)
 * Docs: https://docs.paymob.com/docs/hmac-calculation
 */
export function verifyPaymobHmac(
  obj: Record<string, unknown>,
  receivedHmac: string
): boolean {
  const secret = process.env.PAYMOB_HMAC_SECRET;
  if (!secret) return false;
  // Implement official HMAC concatenation + sha512
  // Placeholder: in production implement exact algorithm from docs
  return Boolean(receivedHmac && secret);
}

export async function handlePaymentWebhook(
  provider: string,
  payload: Record<string, unknown>
): Promise<WebhookResult> {
  if (provider === "MOCK") {
    const orderId = payload.orderId as string;
    const status = (payload.status as string) === "success" ? "SUCCESS" : "FAILED";
    return { success: true, orderId, status, providerRef: `mock_${Date.now()}` };
  }

  // Paymob webhook handling with idempotency
  const providerRef = String(payload.id || payload.order || "");
  if (!providerRef) {
    return { success: false, status: "FAILED" };
  }

  // Idempotency: check if already processed
  const existing = await prisma.payment.findFirst({
    where: { provider: "PAYMOB", providerRef },
  });
  if (existing && existing.status !== "PENDING") {
    return {
      success: true,
      orderId: existing.orderId,
      providerRef,
      status: existing.status as "SUCCESS" | "FAILED",
    };
  }

  // TODO: verify HMAC properly
  const success = Boolean(payload.success);
  return {
    success: true,
    orderId: existing?.orderId,
    providerRef,
    status: success ? "SUCCESS" : "FAILED",
    amount: existing?.amount,
  };
}
