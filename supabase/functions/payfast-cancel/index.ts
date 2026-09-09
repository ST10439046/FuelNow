export default {
  async fetch(_req: Request): Promise<Response> {
    return Response.redirect(
      "http://localhost:8081/payment-result?status=cancelled",
      302
    );
  },
};