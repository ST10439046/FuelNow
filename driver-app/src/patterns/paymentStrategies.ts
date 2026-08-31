// ============================================================================
// STRATEGY PATTERN: South African Payment Rails Integration
// Supports Visa/Mastercard (PayFast), Instant EFT, SnapScan, and Zapper
// ============================================================================

export interface PaymentRequest {
  orderId: string;
  amountZar: number;
  itemDescription: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  cardDetails?: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardHolder: string;
  };
}

export interface PaymentResult {
  success: boolean;
  transactionReference: string;
  paymentMethod: 'card' | 'eft' | 'snapscan' | 'zapper';
  amountChargedZar: number;
  qrCodeUrl?: string;
  deepLinkUrl?: string;
  errorMessage?: string;
}

// Payment Strategy Interface
export interface IPaymentStrategy {
  getMethodName(): string;
  processPayment(request: PaymentRequest): Promise<PaymentResult>;
  validateRequest(request: PaymentRequest): { valid: boolean; error?: string };
}

// Strategy 1: Credit / Debit Card (PayFast Card Tokenisation)
export class CardPaymentStrategy implements IPaymentStrategy {
  getMethodName(): string {
    return 'Credit / Debit Card (Visa / Mastercard)';
  }

  validateRequest(request: PaymentRequest): { valid: boolean; error?: string } {
    if (request.amountZar <= 0) return { valid: false, error: 'Amount must be greater than R0.00' };
    if (request.cardDetails) {
      const sanitizedNumber = request.cardDetails.cardNumber.replace(/\s+/g, '');
      if (sanitizedNumber.length < 13 || sanitizedNumber.length > 19) {
        return { valid: false, error: 'Invalid card number format.' };
      }
      if (!request.cardDetails.cvv || request.cardDetails.cvv.length < 3) {
        return { valid: false, error: 'Invalid CVV.' };
      }
    }
    return { valid: true };
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    const validation = this.validateRequest(request);
    if (!validation.valid) {
      return {
        success: false,
        transactionReference: '',
        paymentMethod: 'card',
        amountChargedZar: 0,
        errorMessage: validation.error,
      };
    }

    // Simulate PayFast 3DSecure / Card Vault Tokenization
    await new Promise((res) => setTimeout(res, 900));

    const ref = `PF-CARD-${Date.now().toString().slice(-8)}`;
    return {
      success: true,
      transactionReference: ref,
      paymentMethod: 'card',
      amountChargedZar: request.amountZar,
    };
  }
}

// Strategy 2: Instant EFT (PayFast / Ozow)
export class EftPaymentStrategy implements IPaymentStrategy {
  getMethodName(): string {
    return 'Instant EFT (FNB, Standard Bank, Absa, Nedbank, Capitec, Investec)';
  }

  validateRequest(request: PaymentRequest): { valid: boolean; error?: string } {
    if (request.amountZar <= 0) return { valid: false, error: 'Amount must be greater than R0.00' };
    return { valid: true };
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    await new Promise((res) => setTimeout(res, 800));
    const ref = `PF-EFT-${Date.now().toString().slice(-8)}`;

    return {
      success: true,
      transactionReference: ref,
      paymentMethod: 'eft',
      amountChargedZar: request.amountZar,
      deepLinkUrl: `https://payment.payfast.co.za/eng/process?order_id=${request.orderId}`,
    };
  }
}

// Strategy 3: SnapScan Mobile QR
export class SnapScanPaymentStrategy implements IPaymentStrategy {
  getMethodName(): string {
    return 'SnapScan';
  }

  validateRequest(request: PaymentRequest): { valid: boolean; error?: string } {
    if (request.amountZar <= 0) return { valid: false, error: 'Amount must be greater than R0.00' };
    return { valid: true };
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    await new Promise((res) => setTimeout(res, 700));
    const snapCode = `fuelnow_southgate_${request.orderId}`;
    const amountInCents = Math.round(request.amountZar * 100);
    const snapUrl = `https://pos.snapscan.io/qr/${snapCode}?amount=${amountInCents}&strict=true`;

    return {
      success: true,
      transactionReference: `SNAP-${Date.now().toString().slice(-8)}`,
      paymentMethod: 'snapscan',
      amountChargedZar: request.amountZar,
      qrCodeUrl: snapUrl,
      deepLinkUrl: snapUrl,
    };
  }
}

// Strategy 4: Zapper Mobile QR
export class ZapperPaymentStrategy implements IPaymentStrategy {
  getMethodName(): string {
    return 'Zapper';
  }

  validateRequest(request: PaymentRequest): { valid: boolean; error?: string } {
    if (request.amountZar <= 0) return { valid: false, error: 'Amount must be greater than R0.00' };
    return { valid: true };
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    await new Promise((res) => setTimeout(res, 700));
    const zapperRef = `ZAP-${Date.now().toString().slice(-8)}`;

    return {
      success: true,
      transactionReference: zapperRef,
      paymentMethod: 'zapper',
      amountChargedZar: request.amountZar,
      deepLinkUrl: `https://zapper.com/pay?ref=${zapperRef}&amount=${request.amountZar}`,
    };
  }
}

// Context: Payment Processor
export class PaymentProcessor {
  private strategy: IPaymentStrategy;

  constructor(strategy?: IPaymentStrategy) {
    this.strategy = strategy || new CardPaymentStrategy();
  }

  public setStrategy(strategy: IPaymentStrategy): void {
    this.strategy = strategy;
  }

  public getStrategyName(): string {
    return this.strategy.getMethodName();
  }

  public async executePayment(request: PaymentRequest): Promise<PaymentResult> {
    return this.strategy.processPayment(request);
  }
}
