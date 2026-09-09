import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from "supabase";
import md5 from "md5";

const PAYFAST_VALIDATION_URL =
  'https://sandbox.payfast.co.za/eng/query/validate';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(
      'Method Not Allowed',
      {
        status: 405,
      }
    );
  }

  try {
    // --------------------------------------------------
    // 1. Read raw PayFast POST body
    // --------------------------------------------------

    const rawBody =
      await req.text();

    const params =
      new URLSearchParams(rawBody);

    const data: Record<string, string> = {};

    for (const [
      key,
      value,
    ] of params.entries()) {
      data[key] = value;
    }

    console.log(
      'PayFast ITN received:',
      data
    );

    // --------------------------------------------------
    // 2. Basic required fields
    // --------------------------------------------------

    const orderId =
      data.m_payment_id;

    const paymentStatus =
      data.payment_status;

    const grossAmount =
      Number(data.amount_gross);

    if (!orderId) {
      throw new Error(
        'Missing m_payment_id.'
      );
    }

    if (!paymentStatus) {
      throw new Error(
        'Missing payment_status.'
      );
    }

    // --------------------------------------------------
    // 3. Verify merchant
    // --------------------------------------------------

    const merchantId =
      Deno.env.get(
        'PAYFAST_MERCHANT_ID'
      );

    const passphrase =
      Deno.env.get(
        'PAYFAST_PASSPHRASE'
      );

    if (!merchantId) {
      throw new Error(
        'PayFast merchant ID is not configured.'
      );
    }

    if (
      data.merchant_id !==
      merchantId
    ) {
      throw new Error(
        'Invalid PayFast merchant ID.'
      );
    }

    // --------------------------------------------------
    // 4. Verify signature
    // --------------------------------------------------

    const receivedSignature =
      data.signature;

    if (!receivedSignature) {
      throw new Error(
        'Missing PayFast signature.'
      );
    }

    const signatureString =
      buildITNSignatureString(
        data,
        passphrase
      );

    const calculatedSignature =
      md5(signatureString);

    if (
      calculatedSignature !==
      receivedSignature
    ) {
      throw new Error(
        'Invalid PayFast signature.'
      );
    }

    // --------------------------------------------------
    // 5. Validate transaction with PayFast
    // --------------------------------------------------

    const validationResponse =
      await fetch(
        PAYFAST_VALIDATION_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/x-www-form-urlencoded',
          },
          body: rawBody,
        }
      );

    const validationText =
      await validationResponse.text();

    console.log(
      'PayFast validation:',
      validationText
    );

    if (
      validationText.trim() !==
      'VALID'
    ) {
      throw new Error(
        'PayFast transaction validation failed.'
      );
    }

    // --------------------------------------------------
    // 6. Use service-role Supabase client
    // --------------------------------------------------

    const supabaseUrl =
      Deno.env.get(
        'SUPABASE_URL'
      )!;

    const serviceRoleKey =
      Deno.env.get(
        'SUPABASE_SERVICE_ROLE_KEY'
      )!;

    const supabase =
      createClient(
        supabaseUrl,
        serviceRoleKey
      );

    // --------------------------------------------------
    // 7. Retrieve order
    // --------------------------------------------------

    const {
      data: order,
      error: orderError,
    } = await supabase
      .from('orders')
      .select(`
        order_id,
        rand_amount,
        status
      `)
      .eq(
        'order_id',
        orderId
      )
      .single();

    if (
      orderError ||
      !order
    ) {
      throw new Error(
        'FuelNow order not found.'
      );
    }

    // --------------------------------------------------
    // 8. Verify amount
    // --------------------------------------------------

    const expectedAmount =
      Number(order.rand_amount);

    if (
      !Number.isFinite(expectedAmount) ||
      !Number.isFinite(grossAmount)
    ) {
      throw new Error(
        'Invalid payment amount.'
      );
    }

    if (
      Math.abs(
        expectedAmount -
          grossAmount
      ) > 0.01
    ) {
      throw new Error(
        `Payment amount mismatch. Expected ${expectedAmount}, received ${grossAmount}.`
      );
    }

    // --------------------------------------------------
    // 9. Handle payment
    // --------------------------------------------------

    if (
      paymentStatus ===
      'COMPLETE'
    ) {
      const {
        error: paymentError,
      } = await supabase
        .from('payments')
        .upsert(
          {
            order_id:
              orderId,

            payment_method_id:
              'payfast',

            fuel_subtotal:
              expectedAmount,

            delivery_fee:
              0,

            service_fee:
              0,

            vat_amount:
              0,

            total_amount:
              expectedAmount,

            status:
              'COMPLETE',

            charged_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              'order_id',
          }
        );

      if (paymentError) {
        throw paymentError;
      }

      const {
        error: updateOrderError,
      } = await supabase
        .from('orders')
        .update({
          status: 'PAID',
        })
        .eq(
          'order_id',
          orderId
        );

      if (updateOrderError) {
        throw updateOrderError;
      }
    } else {
      await supabase
        .from('payments')
        .upsert(
          {
            order_id:
              orderId,

            payment_method_id:
              'payfast',

            fuel_subtotal:
              expectedAmount,

            delivery_fee:
              0,

            service_fee:
              0,

            vat_amount:
              0,

            total_amount:
              expectedAmount,

            status:
              paymentStatus,
          },
          {
            onConflict:
              'order_id',
          }
        );
    }

    return new Response(
      'OK',
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'PayFast ITN error:',
      error
    );

    return new Response(
      'ITN validation failed',
      {
        status: 400,
      }
    );
  }
});

function buildITNSignatureString(
  data: Record<string, string>,
  passphrase?: string
): string {
  const parts: string[] = [];

  for (const [
    key,
    value,
  ] of Object.entries(data)) {
    if (key === 'signature') {
      break;
    }

    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      parts.push(
        `${key}=${encodeURIComponent(
          value
        ).replace(/%20/g, '+')}`
      );
    }
  }

  let result =
    parts.join('&');

  if (passphrase) {
    result +=
      `&passphrase=${encodeURIComponent(
        passphrase
      ).replace(/%20/g, '+')}`;
  }

  return result;
}