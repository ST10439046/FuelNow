import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import md5 from "npm:md5@2.3.0";

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

    const supabaseServiceKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const authClient = createClient(
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
    } = await authClient.auth.getUser();

    if (authError || !user) {
      throw new Error(
        'Authentication required. Please log in again.'
      );
    }

    // --------------------------------------------------
    // 2. Read order ID & client amount
    // --------------------------------------------------

    const body = await req.json().catch(() => ({}));

    const orderId = body?.orderId;
    const clientAmount = Number(body?.amount);

    if (!orderId) {
      throw new Error(
        'orderId is required.'
      );
    }

    // --------------------------------------------------
    // 3. Resolve customer/user IDs
    // --------------------------------------------------
    const dbClient = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey)
      : authClient;

    const candidateUserIds: string[] = [user.id];

    try {
      const { data: appUsers } = await dbClient
        .from('users')
        .select('user_id, auth_id, email')
        .or(`user_id.eq.${user.id},auth_id.eq.${user.id},email.eq.${user.email ?? ''}`);

      if (appUsers && Array.isArray(appUsers)) {
        for (const u of appUsers) {
          if (u.user_id && !candidateUserIds.includes(u.user_id)) {
            candidateUserIds.push(u.user_id);
          }
        }
      }
    } catch (lookupErr) {
      console.warn('Candidate user lookup warning:', lookupErr);
    }

    // --------------------------------------------------
    // 4. Retrieve REAL order
    // --------------------------------------------------

    let order: any = null;

    const {
      data: orderWithUser,
      error: orderError,
    } = await dbClient
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
      .in('customer_id', candidateUserIds)
      .maybeSingle();

    if (orderWithUser) {
      order = orderWithUser;
    } else {
      // Fallback: check by order_id directly using service key if available
      const { data: directOrder } = await dbClient
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
        .maybeSingle();

      if (directOrder) {
        order = directOrder;
      }
    }

    if (!order) {
      console.error('Order query error:', orderError, 'for candidateUserIds:', candidateUserIds, 'orderId:', orderId);
      throw new Error(
        'Order not found or does not belong to your account.'
      );
    }

    // --------------------------------------------------
    // 5. Make sure payment has not already completed
    // --------------------------------------------------

    if (order.status === 'PAID') {
      throw new Error(
        'This order has already been paid.'
      );
    }

    // --------------------------------------------------
    // 6. Amount determination (prefer DB rand_amount, fallback to client total)
    // --------------------------------------------------

    const dbAmount = Number(order.rand_amount);
    const amount = Number.isFinite(dbAmount) && dbAmount > 0
      ? dbAmount
      : (Number.isFinite(clientAmount) && clientAmount > 0 ? clientAmount : 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(
        'Invalid payment amount.'
      );
    }

    // If order in database had missing rand_amount, update it
    if ((!order.rand_amount || Number(order.rand_amount) <= 0) && amount > 0) {
      try {
        await dbClient.from('orders').update({ rand_amount: amount }).eq('order_id', order.order_id);
      } catch (dbUpdateErr) {
        console.warn('Could not update order rand_amount in DB:', dbUpdateErr);
      }
    }

    // PayFast requires a formatted amount (2 decimal places)
    const formattedAmount =
      amount.toFixed(2);

    // --------------------------------------------------
    // 7. PayFast secrets (fallback to PayFast official sandbox credentials if not configured)
    // --------------------------------------------------

    const merchantId =
      Deno.env.get('PAYFAST_MERCHANT_ID') || '10000100';

    const merchantKey =
      Deno.env.get('PAYFAST_MERCHANT_KEY') || '46f0cd694581a';

    const passphrase =
      Deno.env.get('PAYFAST_PASSPHRASE') || (merchantId === '10000100' ? undefined : undefined);

    // --------------------------------------------------
    // 8. Customer details
    // --------------------------------------------------

    const fullName =
      user.user_metadata?.full_name ??
      '';

    const nameParts =
      fullName.trim().split(/\s+/);

    const firstName =
      nameParts[0] || 'FuelNow';

    const lastName =
      nameParts.slice(1).join(' ') || 'Customer';

    // --------------------------------------------------
    // 9. URLs
    // --------------------------------------------------

    const returnUrl =
      `${supabaseUrl}/functions/v1/payfast-return`;

    const cancelUrl =
      `${supabaseUrl}/functions/v1/payfast-cancel`;

    const notifyUrl =
      `${supabaseUrl}/functions/v1/payfast-itn`;

    // --------------------------------------------------
    // 10. PayFast custom integration data
    // --------------------------------------------------

    const paymentData: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,

      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,

      name_first: firstName,
      name_last: lastName,
      email_address: user.email ?? 'customer@fuelnow.co.za',

      m_payment_id: order.order_id,

      amount: formattedAmount,

      item_name:
        `FuelNow Order ${order.order_id.slice(0, 8)}`,
    };

    // --------------------------------------------------
    // 11. Generate PayFast signature
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
      String(value).trim() !== ''
    ) {
      parts.push(
        `${key}=${encodeURIComponent(
          String(value).trim()
        ).replace(/%20/g, '+')}`
      );
    }
  }

  let parameterString = parts.join('&');

  if (passphrase && passphrase.trim() !== '') {
    parameterString +=
      `&passphrase=${encodeURIComponent(
        passphrase.trim()
      ).replace(/%20/g, '+')}`;
  }

  const hash = calculateMd5(parameterString);
  return hash;
}

function calculateMd5(string: string): string {
  function rotateLeft(lValue: number, iShiftBits: number) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }

  function addUnsigned(lX: number, lY: number) {
    const lX4 = lX & 0x40000000;
    const lY4 = lY & 0x40000000;
    const lX8 = lX & 0x80000000;
    const lY8 = lY & 0x80000000;
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      else return lResult ^ 0x40000000 ^ lX8 ^ lY8;
    } else {
      return lResult ^ lX8 ^ lY8;
    }
  }

  function F(x: number, y: number, z: number) { return (x & y) | (~x & z); }
  function G(x: number, y: number, z: number) { return (x & z) | (y & ~z); }
  function H(x: number, y: number, z: number) { return x ^ y ^ z; }
  function I(x: number, y: number, z: number) { return y ^ (x | ~z); }

  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(str: string) {
    let lWordCount;
    const lMessageLength = str.length;
    const lNumberOfWords_temp1 = lMessageLength + 8;
    const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    const lWordArray = Array(lNumberOfWords - 1);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }

  function wordToHex(lValue: number) {
    let wordToHexValue = '', wordToHexValue_temp = '', lByte, lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      wordToHexValue_temp = '0' + lByte.toString(16);
      wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
    }
    return wordToHexValue;
  }

  function utf8Encode(str: string) {
    return unescape(encodeURIComponent(str));
  }

  const x = convertToWordArray(utf8Encode(string));
  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;
  const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    a = FF(a, b, c, d, x[k + 0] || 0, S11, 0xd76aa478);
    d = FF(d, a, b, c, x[k + 1] || 0, S12, 0xe8c7b756);
    c = FF(c, d, a, b, x[k + 2] || 0, S13, 0x242070db);
    b = FF(b, c, d, a, x[k + 3] || 0, S14, 0xc1bdceee);
    a = FF(a, b, c, d, x[k + 4] || 0, S11, 0xf57c0faf);
    d = FF(d, a, b, c, x[k + 5] || 0, S12, 0x4787c62a);
    c = FF(c, d, a, b, x[k + 6] || 0, S13, 0xa8304613);
    b = FF(b, c, d, a, x[k + 7] || 0, S14, 0xfd469501);
    a = FF(a, b, c, d, x[k + 8] || 0, S11, 0x698098d8);
    d = FF(d, a, b, c, x[k + 9] || 0, S12, 0x8b44f7af);
    c = FF(c, d, a, b, x[k + 10] || 0, S13, 0xffff5bb1);
    b = FF(b, c, d, a, x[k + 11] || 0, S14, 0x895cd7be);
    a = FF(a, b, c, d, x[k + 12] || 0, S11, 0x6b901122);
    d = FF(d, a, b, c, x[k + 13] || 0, S12, 0xfd987193);
    c = FF(c, d, a, b, x[k + 14] || 0, S13, 0xa679438e);
    b = FF(b, c, d, a, x[k + 15] || 0, S14, 0x49b40821);

    a = GG(a, b, c, d, x[k + 1] || 0, S21, 0xf61e2562);
    d = GG(d, a, b, c, x[k + 6] || 0, S22, 0xc040b340);
    c = GG(c, d, a, b, x[k + 11] || 0, S23, 0x265e5a51);
    b = GG(b, c, d, a, x[k + 0] || 0, S24, 0xe9b6c7aa);
    a = GG(a, b, c, d, x[k + 5] || 0, S21, 0xd62f105d);
    d = GG(d, a, b, c, x[k + 10] || 0, S22, 0x2441453);
    c = GG(c, d, a, b, x[k + 15] || 0, S23, 0xd8a1e681);
    b = GG(b, c, d, a, x[k + 4] || 0, S24, 0xe7d3fbc8);
    a = GG(a, b, c, d, x[k + 9] || 0, S21, 0x21e1cde6);
    d = GG(d, a, b, c, x[k + 14] || 0, S22, 0xc33707d6);
    c = GG(c, d, a, b, x[k + 3] || 0, S23, 0xf4d50d87);
    b = GG(b, c, d, a, x[k + 8] || 0, S24, 0x455a14ed);
    a = GG(a, b, c, d, x[k + 13] || 0, S21, 0xa9e3e905);
    d = GG(d, a, b, c, x[k + 2] || 0, S22, 0xfcefa3f8);
    c = GG(c, d, a, b, x[k + 7] || 0, S23, 0x676f02d9);
    b = GG(b, c, d, a, x[k + 12] || 0, S24, 0x8d2a4c8a);

    a = HH(a, b, c, d, x[k + 5] || 0, S31, 0xfffa3942);
    d = HH(d, a, b, c, x[k + 8] || 0, S32, 0x8771f681);
    c = HH(c, d, a, b, x[k + 11] || 0, S33, 0x6d9d6122);
    b = HH(b, c, d, a, x[k + 14] || 0, S34, 0xfde5380c);
    a = HH(a, b, c, d, x[k + 1] || 0, S31, 0xa4beea44);
    d = HH(d, a, b, c, x[k + 4] || 0, S32, 0x4bdecfa9);
    c = HH(c, d, a, b, x[k + 7] || 0, S33, 0xf6bb4b60);
    b = HH(b, c, d, a, x[k + 10] || 0, S34, 0xbebfbc70);
    a = HH(a, b, c, d, x[k + 13] || 0, S31, 0x289b7ec6);
    d = HH(d, a, b, c, x[k + 0] || 0, S32, 0xeaa127fa);
    c = HH(c, d, a, b, x[k + 3] || 0, S33, 0xd4ef3085);
    b = HH(b, c, d, a, x[k + 6] || 0, S34, 0x4881d05);
    a = HH(a, b, c, d, x[k + 9] || 0, S31, 0xd9d4d039);
    d = HH(d, a, b, c, x[k + 12] || 0, S32, 0xe6db99e5);
    c = HH(c, d, a, b, x[k + 15] || 0, S33, 0x1fa27cf8);
    b = HH(b, c, d, a, x[k + 2] || 0, S34, 0xc4ac5665);

    a = II(a, b, c, d, x[k + 0] || 0, S41, 0xf4292244);
    d = II(d, a, b, c, x[k + 7] || 0, S42, 0x432aff97);
    c = II(c, d, a, b, x[k + 14] || 0, S43, 0xab9423a7);
    b = II(b, c, d, a, x[k + 5] || 0, S44, 0xfc93a039);
    a = II(a, b, c, d, x[k + 12] || 0, S41, 0x655b59c3);
    d = II(d, a, b, c, x[k + 3] || 0, S42, 0x8f0ccc92);
    c = II(c, d, a, b, x[k + 10] || 0, S43, 0xffeff47d);
    b = II(b, c, d, a, x[k + 1] || 0, S44, 0x85845dd1);
    a = II(a, b, c, d, x[k + 8] || 0, S41, 0x6fa87e4f);
    d = II(d, a, b, c, x[k + 15] || 0, S42, 0xfe2ce6e0);
    c = II(c, d, a, b, x[k + 6] || 0, S43, 0xa3014314);
    b = II(b, c, d, a, x[k + 13] || 0, S44, 0x4e0811a1);
    a = II(a, b, c, d, x[k + 4] || 0, S41, 0xf7537e82);
    d = II(d, a, b, c, x[k + 11] || 0, S42, 0xbd3af235);
    c = II(c, d, a, b, x[k + 2] || 0, S43, 0x2ad7d2bb);
    b = II(b, c, d, a, x[k + 9] || 0, S44, 0xeb86d391);

    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  const result = (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
  return result;
}