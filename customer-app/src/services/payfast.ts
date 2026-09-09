import { supabase } from './supabase';

export interface PayFastPayment {
  paymentUrl: string;
  paymentData: Record<string, string>;
  orderId: string;
}

export async function createPayFastPayment(
  orderId: string
): Promise<PayFastPayment> {
  const {
    data,
    error,
  } = await supabase.functions.invoke(
    'create-payfast-payment',
    {
      body: {
        orderId,
      },
    }
  );

  if (error) {
    throw error;
  }

  if (!data?.success) {
    throw new Error(
      data?.error ??
        'Unable to create PayFast payment.'
    );
  }

  return data;
}