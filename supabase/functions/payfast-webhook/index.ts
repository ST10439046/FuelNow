/// <reference path="../deno.d.ts" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';
import { corsHeaders } from '../_shared/cors.ts';

async function generateMd5(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPayFastSignature(
  data: Record<string, string>,
  passphrase?: string
): Promise<boolean> {
  const signatureReceived = data['signature'];
  if (!signatureReceived) return false;

  const keys = Object.keys(data).filter((k) => k !== 'signature' && data[k] !== '');
  let pfParamString = '';

  for (const key of keys) {
    const val = data[key];
    pfParamString += `${key}=${encodeURIComponent(val.trim()).replace(/%20/g, '+')}&`;
  }

  pfParamString = pfParamString.slice(0, -1);

  if (passphrase) {
    pfParamString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
  }

  const calculatedSignature = await generateMd5(pfParamString);
  return calculatedSignature.toLowerCase() === signatureReceived.toLowerCase();
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://zahrmlcqwashdiudmfvk.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_KEY') || '';
    const payfastPassphrase = Deno.env.get('PAYFAST_PASSPHRASE') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let itnData: Record<string, string> = {};
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      formData.forEach((val, key) => {
        itnData[key] = String(val);
      });
    } else {
      itnData = await req.json().catch(() => ({}));
    }

    const orderId = itnData['m_payment_id'] || itnData['order_id'];
    const paymentStatus = itnData['payment_status']; // 'COMPLETE'
    const pfPaymentId = itnData['pf_payment_id'];

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing m_payment_id (order identifier)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (itnData['signature'] && payfastPassphrase) {
      const isValid = await verifyPayFastSignature(itnData, payfastPassphrase);
      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid PayFast security signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (paymentStatus === 'COMPLETE' || paymentStatus === 'SUCCESS') {
      const now = new Date().toISOString();

      // 1. Update Payment Record
      await supabase
        .from('payments')
        .update({
          status: 'COMPLETED',
          payment_method_id: pfPaymentId || `PF-${Date.now()}`,
          charged_at: now,
        })
        .eq('order_id', orderId);

      // 2. Transition Order to FINDING_DRIVER
      await supabase
        .from('orders')
        .update({
          status: 'FINDING_DRIVER',
        })
        .eq('order_id', orderId);

      // 3. Find active driver in Durban zone and assign
      const { data: drivers } = await supabase
        .from('drivers')
        .select('*')
        .eq('status', 'Active')
        .limit(1);

      if (drivers && drivers.length > 0) {
        const assignedDriver = drivers[0];
        await supabase
          .from('orders')
          .update({
            driver_id: assignedDriver.driver_id,
            status: 'ACCEPTED',
          })
          .eq('order_id', orderId);

        await supabase
          .from('drivers')
          .update({ status: 'On Delivery' })
          .eq('driver_id', assignedDriver.driver_id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'PayFast ITN processed successfully.',
        order_id: orderId,
        payment_status: paymentStatus,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
