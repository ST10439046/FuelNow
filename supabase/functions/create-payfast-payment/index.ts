import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import md5 from 'npm:md5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const PAYFAST_SANDBOX =
  'https://sandbox.payfast.co.za/eng/process';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl =
      Deno.env.get('SUPABASE_URL')!;

    const supabaseAnonKey =
      Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization:
              req.headers.get('Authorization') ?? '',
          },
        },
      }
    );

    // --------------------------------------------------
    // 1. Verify FuelNow user
    // --------------------------------------------------

    const {
      data: {
        user,
      },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error(
        'Authentication required.'
      );
    }

    // --------------------------------------------------
    // 2. Read order ID
    // --------------------------------------------------

    const body = await req.json();

    const orderId = body?.orderId;

    if (!orderId) {
      throw new Error(
        'orderId is required.'
      );
    }

    // --------------------------------------------------
    // 3. Retrieve REAL order
    // --------------------------------------------------

    const {
      data: order,
      error: orderError,
    } = await supabase
      .from('orders')
      .select(`
        order_id,
        customer_id,
        rand_amount,
        volume_litres,
        status,
        delivery_type,
        fuel_type_id
      `)
      .eq('order_id', orderId)
      .eq('customer_id', user.id)
      .single();

    if (orderError || !order) {
      throw new Error(
        'Order not found or does not belong to you.'
      );
    }

    // --------------------------------------------------
    // 4. Make sure payment has not already completed
    // --------------------------------------------------

    if (order.status === 'PAID') {
      throw new Error(
        'This order has already been paid.'
      );
    }

    // --------------------------------------------------
    // 5. Amount comes from database
    // --------------------------------------------------

    const amount =
      Number(order.rand_amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(
        'Invalid order amount.'
      );
    }

    // PayFast requires a minimum amount in live mode.
    // Sandbox testing is fine with the test environment.
    const formattedAmount =
      amount.toFixed(2);

    // --------------------------------------------------
    // 6. PayFast secrets
    // --------------------------------------------------

    const merchantId =
      Deno.env.get(
        'PAYFAST_MERCHANT_ID'
      );

    const merchantKey =
      Deno.env.get(
        'PAYFAST_MERCHANT_KEY'
      );

    const passphrase =
      Deno.env.get(
        'PAYFAST_PASSPHRASE'
      );

    if (!merchantId || !merchantKey) {
      throw new Error(
        'PayFast credentials are not configured.'
      );
    }

    // --------------------------------------------------
    // 7. Customer details
    // --------------------------------------------------

    const fullName =
      user.user_metadata?.full_name ??
      '';

    const nameParts =
      fullName.trim().split(/\s+/);

    const firstName =
      nameParts[0] || 'FuelNow';

    const lastName =
      nameParts.slice(1).join(' ');

    // --------------------------------------------------
    // 8. URLs
    // --------------------------------------------------

    const returnUrl =
      `${supabaseUrl}/functions/v1/payfast-return`;

    const cancelUrl =
      `${supabaseUrl}/functions/v1/payfast-cancel`;

    const notifyUrl =
      `${supabaseUrl}/functions/v1/payfast-itn`;

    // --------------------------------------------------
    // 9. PayFast custom integration data
    // --------------------------------------------------

    const paymentData: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,

      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,

      name_first: firstName,
      name_last: lastName,
      email_address: user.email ?? '',

      m_payment_id: order.order_id,

      amount: formattedAmount,

      item_name:
        `FuelNow Order ${order.order_id}`,
    };

    // --------------------------------------------------
    // 10. Generate PayFast custom signature
    // --------------------------------------------------

    const signature =
      generatePayFastSignature(
        paymentData,
        passphrase
      );

    paymentData.signature = signature;

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.order_id,

        paymentUrl:
          PAYFAST_SANDBOX,

        paymentData,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type':
            'application/json',
        },
      }
    );
  } catch (error) {
    console.error(
      'PayFast creation error:',
      error
    );

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to create PayFast payment.',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type':
            'application/json',
        },
      }
    );
  }
});

function generatePayFastSignature(
  data: Record<string, string>,
  passphrase?: string
): string {
  const parameterOrder = [
    'merchant_id',
    'merchant_key',
    'return_url',
    'cancel_url',
    'notify_url',
    'name_first',
    'name_last',
    'email_address',
    'cell_number',
    'm_payment_id',
    'amount',
    'item_name',
    'item_description',
  ];

  const parts: string[] = [];

  for (const key of parameterOrder) {
    const value = data[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      parts.push(
        `${key}=${encodeURIComponent(
          value.trim()
        ).replace(/%20/g, '+')}`
      );
    }
  }

  let parameterString =
    parts.join('&');

  if (passphrase) {
    parameterString +=
      `&passphrase=${encodeURIComponent(
        passphrase.trim()
      ).replace(/%20/g, '+')}`;
  }

  return md5(parameterString);
}