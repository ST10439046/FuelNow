/// <reference path="../deno.d.ts" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';

interface ConfirmDeliveryPayload {
  order_id: string;
  delivery_pin: string;
  photo_url?: string;
  driver_id?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://zahrmlcqwashdiudmfvk.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Server configuration error: Supabase environment variables missing.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ConfirmDeliveryPayload = await req.json().catch(() => ({}) as any);
    const { order_id, delivery_pin, photo_url, driver_id } = body;

    if (!order_id || !delivery_pin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request: order_id and delivery_pin are strictly required.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Query orders table
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, customers(*)')
      .eq('order_id', order_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Order with ID "${order_id}" not found.`,
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.status === 'COMPLETED') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'This order has already been completed and confirmed.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify 4-digit PIN
    if (String(delivery_pin).trim() !== String(order.delivery_pin).trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Security Error: The 4-digit delivery PIN entered is incorrect.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date().toISOString();

    // 1. Update order status to COMPLETED
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'COMPLETED',
        pod_photo_url: photo_url || null,
        delivered_at: now,
      })
      .eq('order_id', order_id)
      .select()
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to update order status: ${updateError.message}`,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Award +80 FuelPoints in customers and reward_accounts
    const POINTS_AWARDED = 80;
    if (order.customer_id) {
      // Increment customer fuel points balance
      const { data: cust } = await supabase
        .from('customers')
        .select('fuel_points_balance')
        .eq('customer_id', order.customer_id)
        .single();

      const newBalance = ((cust && cust.fuel_points_balance) || 0) + POINTS_AWARDED;
      await supabase
        .from('customers')
        .update({ fuel_points_balance: newBalance })
        .eq('customer_id', order.customer_id);

      // Increment reward_accounts if exists
      const { data: rewardAcc } = await supabase
        .from('reward_accounts')
        .select('points_balance')
        .eq('customer_id', order.customer_id)
        .single();

      if (rewardAcc) {
        await supabase
          .from('reward_accounts')
          .update({ points_balance: (rewardAcc.points_balance || 0) + POINTS_AWARDED })
          .eq('customer_id', order.customer_id);
      }
    }

    // 3. Mark driver status to Active (ready for next order)
    if (driver_id || order.driver_id) {
      await supabase
        .from('drivers')
        .update({ status: 'Active' })
        .eq('driver_id', driver_id || order.driver_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Delivery successfully verified and completed.',
        order: updatedOrder,
        points_awarded: POINTS_AWARDED,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'An unexpected error occurred processing delivery confirmation.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
