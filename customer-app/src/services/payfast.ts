import { supabase } from "./supabase";

export const PAYFAST_URL =
  "https://sandbox.payfast.co.za/eng/process";

export interface PayFastPaymentResponse {
  success: boolean;
  paymentUrl: string;
  paymentData: Record<string, string>;
}

export async function createPayFastPaymentData(params: {
  orderId: string;
}): Promise<PayFastPaymentResponse> {
  if (!params.orderId?.trim()) {
    throw new Error("PayFast order ID is missing.");
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session?.access_token) {
    throw new Error(
      "Your session has expired. Please log in again."
    );
  }

  const { data, error } =
    await supabase.functions.invoke(
      "create-payfast-payment",
      {
        body: {
          orderId: params.orderId,
        },
      }
    );

  if (error) {
    console.error(
      "create-payfast-payment error:",
      error
    );

    throw new Error(
      error.message ||
        "Unable to create PayFast payment."
    );
  }

  if (!data?.success || !data?.paymentData) {
    console.error(
      "Unexpected PayFast response:",
      data
    );

    throw new Error(
      data?.error ||
        "PayFast payment data could not be created."
    );
  }

  return {
    success: true,
    paymentUrl:
      data.paymentUrl || PAYFAST_URL,
    paymentData: data.paymentData,
  };
}