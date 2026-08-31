/// <reference path="../deno.d.ts" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://zahrmlcqwashdiudmfvk.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_KEY') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch existing fuel types
    const { data: fuelTypes, error: ftError } = await supabase
      .from('fuel_types')
      .select('*');

    if (ftError || !fuelTypes || fuelTypes.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Fuel types not found in database.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const priceMap: Record<string, number> = {
      'Petrol 95': 23.45,
      'Petrol 93': 22.87,
      'Diesel 50ppm': 21.63,
      'Diesel 500ppm': 21.38,
    };

    const now = new Date().toISOString();
    const rateInserts = fuelTypes.map((ft: any) => ({
      fuel_type_id: ft.fuel_type_id,
      price_per_litre: priceMap[ft.name] || 23.45,
      source: 'Automated API Sync',
      last_updated: now,
    }));

    const { data: insertedRates, error: insertError } = await supabase
      .from('fuel_rates')
      .insert(rateInserts)
      .select('*, fuel_types(*)');

    if (insertError) {
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'South African SAPIA retail fuel rates synced successfully.',
        synced_at: now,
        rates: insertedRates,
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
