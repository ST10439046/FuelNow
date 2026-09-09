export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    const paymentId =
      url.searchParams.get("m_payment_id") ??
      url.searchParams.get("order_id");

    const target = new URL(
      "http://localhost:8081/payment-result"
    );

    target.searchParams.set("status", "returned");

    if (paymentId) {
      target.searchParams.set("orderId", paymentId);
    }

    return Response.redirect(target.toString(), 302);
  },
};