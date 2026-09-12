Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);

    const orderId =
      url.searchParams.get("m_payment_id");

    const appUrl = orderId
      ? `fuelnow://payment/success?orderId=${encodeURIComponent(orderId)}`
      : "fuelnow://payment/success";

    return Response.redirect(appUrl, 302);
  } catch (error) {
    console.error("PayFast return error:", error);

    return new Response(
      "Unable to return to FuelNow.",
      {
        status: 500,
        headers: {
          "Content-Type": "text/plain",
        },
      }
    );
  }
});