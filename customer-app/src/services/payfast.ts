import CryptoJS from "crypto-js";

export const PAYFAST_URL =
  "https://sandbox.payfast.co.za/eng/process";

const MERCHANT_ID =
  process.env.EXPO_PUBLIC_PAYFAST_MERCHANT_ID ?? "";

const MERCHANT_KEY =
  process.env.EXPO_PUBLIC_PAYFAST_MERCHANT_KEY ?? "";

const PASSPHRASE =
  process.env.EXPO_PUBLIC_PAYFAST_PASSPHRASE ?? "";

function payFastUrlEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A")
    .replace(/~/g, "%7E");
}

function generateSignature(
  data: Record<string, string>
): string {
  const parameterString = Object.keys(data)
    .filter((key) => {
      const value = data[key];

      return (
        value !== undefined &&
        value !== null &&
        value.trim() !== ""
      );
    })
    .map((key) => {
      const value = data[key].trim();

      return `${key}=${payFastUrlEncode(value)}`;
    })
    .join("&");

  const signatureString =
    `${parameterString}&passphrase=${payFastUrlEncode(
      PASSPHRASE.trim()
    )}`;

  console.log(
    "PayFast signature string:",
    signatureString
  );

  const signature =
    CryptoJS.MD5(signatureString)
      .toString()
      .toLowerCase();

  console.log(
    "PayFast generated signature:",
    signature
  );

  return signature;
}

export function createPayFastPaymentData(params: {
  orderId: string;
  amount: number;
  email: string;
}): Record<string, string> {
  if (!MERCHANT_ID.trim()) {
    throw new Error(
      "PayFast merchant ID is missing."
    );
  }

  if (!MERCHANT_KEY.trim()) {
    throw new Error(
      "PayFast merchant key is missing."
    );
  }

  if (!PASSPHRASE.trim()) {
    throw new Error(
      "PayFast passphrase is missing."
    );
  }

  if (
    !Number.isFinite(params.amount) ||
    params.amount <= 0
  ) {
    throw new Error(
      `Invalid PayFast amount: ${params.amount}`
    );
  }

  if (!params.orderId?.trim()) {
    throw new Error(
      "PayFast order ID is missing."
    );
  }

  if (!params.email?.trim()) {
    throw new Error(
      "PayFast customer email is missing."
    );
  }

  const data: Record<string, string> = {
    merchant_id: MERCHANT_ID.trim(),
    merchant_key: MERCHANT_KEY.trim(),

    return_url:
      `https://zahrmlcqwashdiudmfvk.supabase.co/functions/v1/payfast-return`,

    cancel_url:
      `https://zahrmlcqwashdiudmfvk.supabase.co/functions/v1/payfast-cancel`,

    notify_url:
      "https://zahrmlcqwashdiudmfvk.supabase.co/functions/v1/payfast-itn",

    name_first: "FuelNow",
    name_last: "Customer",

    email_address: params.email.trim(),

    m_payment_id: params.orderId,

    amount: params.amount.toFixed(2),

    item_name: "FuelNow Fuel Delivery",
    item_description: "Fuel delivery order",
  };

  data.signature = generateSignature(data);

  return data;
}