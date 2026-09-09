import { supabase } from './supabase';

export interface PayFastPaymentResponse {
  success: boolean;
  paymentUrl: string;
  paymentData: Record<string, string>;
}

export async function createPayFastPayment(
  orderId: string,
  amount: number
): Promise<PayFastPaymentResponse> {
  const {
    data,
    error,
  } = await supabase.functions.invoke(
    'create-payfast-payment',
    {
      body: {
        orderId,
        amount,
      },
    }
  );

  if (error) {
    throw error;
  }

  if (!data?.success) {
    throw new Error(
      data?.error ??
        'Unable to create PayFast payment'
    );
  }

  return data;
}