import { supabase } from './supabase';

export interface PayFastPayment {
  paymentUrl: string;
  paymentData: Record<string, string>;
  orderId: string;
}

export async function createPayFastPayment(
  orderId: string,
  amount?: number
): Promise<PayFastPayment> {
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
    let errorDetail = error.message;
    if ((error as any).context) {
      try {
        const responseJson = await (error as any).context.json();
        if (responseJson?.error) {
          errorDetail = responseJson.error;
        }
      } catch (_) {
        try {
          const responseText = await (error as any).context.text();
          if (responseText) errorDetail = responseText;
        } catch (_) {}
      }
    }
    console.error('createPayFastPayment Edge Function error:', errorDetail, error);
    throw new Error(errorDetail || 'Unable to create PayFast payment.');
  }

  if (!data?.success) {
    throw new Error(
      data?.error ??
        'Unable to create PayFast payment.'
    );
  }

  return data;
}