import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import md5 from "npm:md5@2.3.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function generateAPISignature(
  data: Record<string, string>,
  passPhrase: string | null = null,
): string {
  // Sort all variables alphabetically by key.
  const orderedData: Record<string, string> = {};

  Object.keys(data)
    .sort()
    .forEach((key) => {
      const value = data[key];

      // Only include non-empty values.
      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        orderedData[key] = String(value).trim();
      }
    });

  // Build the signature string.
  const parts: string[] = [];

  for (const key in orderedData) {
    parts.push(
      `${key}=${encodeURIComponent(orderedData[key]).replace(/%20/g, "+")}`,
    );
  }

  let getString = parts.join("&");

  // Append passphrase after the sorted variables.
  if (passPhrase !== null && passPhrase.trim() !== "") {
    getString += `&passphrase=${
      encodeURIComponent(passPhrase.trim()).replace(/%20/g, "+")
    }`;
  }

  console.log("PayFast signature variable order:", Object.keys(orderedData));
  console.log("PayFast signature:", String(md5(getString)));

  return String(md5(getString)).toLowerCase();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    // =====================================================
    // 1. Environment variables
    // =====================================================

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    const merchantId = Deno.env.get("PAYFAST_MERCHANT_ID");
    const merchantKey = Deno.env.get("PAYFAST_MERCHANT_KEY");
    const passphrase = Deno.env.get("PAYFAST_PASSPHRASE");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase environment variables are missing.");
    }

    if (!merchantId || !merchantKey || !passphrase) {
      throw new Error(
        "PayFast environment variables are missing. " +
        "PAYFAST_MERCHANT_ID, PAYFAST_MERCHANT_KEY and PAYFAST_PASSPHRASE are required.",
      );
    }

    // =====================================================
    // 2. Get authenticated Supabase user
    // =====================================================

    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing authorization header.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid or expired authentication session.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // =====================================================
    // 3. Read request
    // =====================================================

    const body = await req.json();

    const orderId = body?.orderId;

    if (!orderId || typeof orderId !== "string") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "A valid orderId is required.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // =====================================================
    // 4. Get application user
    // =====================================================

    const {
      data: appUser,
      error: userError,
    } = await supabase
      .from("users")
      .select(`
        user_id,
        auth_id,
        full_name,
        email,
        status
      `)
      .eq("auth_id", user.id)
      .single();

    if (userError || !appUser) {
      console.error("Application user lookup failed:", userError);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Application user account could not be found.",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (appUser.status !== "active") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Your account is not active.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // =====================================================
    // 5. Get order belonging to this customer
    // =====================================================

    const {
      data: order,
      error: orderError,
    } = await supabase
      .from("orders")
      .select(`
        order_id,
        customer_id,
        rand_amount,
        status
      `)
      .eq("order_id", orderId)
      .eq("customer_id", appUser.user_id)
      .single();

    if (orderError || !order) {
      console.error("Order lookup failed:", orderError);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Order not found or does not belong to this customer.",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // =====================================================
    // 6. Prevent duplicate payment
    // =====================================================

    if (order.status === "PAID") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "This order has already been paid.",
        }),
        {
          status: 409,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // =====================================================
    // 7. Amount comes from the database
    // =====================================================

    const amount = Number(order.rand_amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Order has an invalid payment amount.");
    }

    const formattedAmount = amount.toFixed(2);

    // =====================================================
    // 8. Customer information
    // =====================================================

    const fullName = String(appUser.full_name ?? "").trim();
    const nameParts = fullName.split(/\s+/);

    const firstName = nameParts.shift() || "FuelNow";
    const lastName = nameParts.join(" ") || "Customer";

    const email = String(appUser.email ?? user.email ?? "").trim();

    if (!email) {
      throw new Error("Customer email address is required for PayFast.");
    }

    // =====================================================
    // 9. PayFast URLs
    // =====================================================

    const returnUrl =
      Deno.env.get("PAYFAST_RETURN_URL") ??
      "https://YOUR_PROJECT_REF.supabase.co/functions/v1/payfast-return";

    const cancelUrl =
      Deno.env.get("PAYFAST_CANCEL_URL") ??
      "https://YOUR_PROJECT_REF.supabase.co/functions/v1/payfast-cancel";

    const notifyUrl =
      Deno.env.get("PAYFAST_NOTIFY_URL") ??
      "https://YOUR_PROJECT_REF.supabase.co/functions/v1/payfast-itn";

    // =====================================================
    // 10. PayFast API payment data
    // =====================================================

    const paymentData: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,

      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,

      name_first: firstName,
      name_last: lastName,
      email_address: email,

      m_payment_id: order.order_id,

      amount: formattedAmount,

      item_name: `FuelNow Order ${order.order_id.slice(0, 8)}`,
    };

    // =====================================================
    // 11. Generate API signature
    // =====================================================

    const signature = generateAPISignature(
      paymentData,
      passphrase,
    );

    if (!/^[a-f0-9]{32}$/i.test(signature)) {
      throw new Error(
        `Invalid PayFast signature generated. Expected 32 hexadecimal characters, received ${signature.length}.`,
      );
    }

    // Add signature to payment data after generating it.
    paymentData.signature = signature;

    // =====================================================
    // 12. PayFast sandbox
    // =====================================================

    const paymentUrl =
      "https://sandbox.payfast.co.za/eng/process";

    // =====================================================
    // 13. Return payment information
    // =====================================================

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl,
        paymentData,
        orderId: order.order_id,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error(
      "create-payfast-payment error:",
      error,
    );

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create PayFast payment.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});