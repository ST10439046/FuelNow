import {
    describe,
    expect,
    test,
    vi,
  } from 'vitest';
  
  import {
    CardPaymentStrategy,
    EftPaymentStrategy,
    SnapScanPaymentStrategy,
    ZapperPaymentStrategy,
    PaymentProcessor,
  } from '../src/patterns/paymentStrategies';
  
  const baseRequest = {
    orderId: 'order-001',
    amountZar: 652.85,
    itemDescription: '20L Petrol 95',
    customerName: 'Test Customer',
    customerEmail: 'customer@example.com',
    customerPhone: '0821234567',
  };
  
  describe('Admin Payment Strategies', () => {
    describe('CardPaymentStrategy', () => {
      const strategy =
        new CardPaymentStrategy();
  
      test('accepts a valid card request', () => {
        const result =
          strategy.validateRequest({
            ...baseRequest,
            cardDetails: {
              cardNumber:
                '4111 1111 1111 1111',
              expiryDate: '12/29',
              cvv: '123',
              cardHolder: 'Test Customer',
            },
          });
  
        expect(result.valid).toBe(true);
      });
  
      test('rejects a zero amount', () => {
        const result =
          strategy.validateRequest({
            ...baseRequest,
            amountZar: 0,
          });
  
        expect(result.valid).toBe(false);
        expect(result.error).toContain(
          'greater than R0.00'
        );
      });
  
      test('rejects an invalid card number', () => {
        const result =
          strategy.validateRequest({
            ...baseRequest,
            cardDetails: {
              cardNumber: '1234',
              expiryDate: '12/29',
              cvv: '123',
              cardHolder: 'Test Customer',
            },
          });
  
        expect(result.valid).toBe(false);
        expect(result.error).toContain(
          'Invalid card number'
        );
      });
  
      test('rejects an invalid CVV', () => {
        const result =
          strategy.validateRequest({
            ...baseRequest,
            cardDetails: {
              cardNumber:
                '4111111111111111',
              expiryDate: '12/29',
              cvv: '12',
              cardHolder: 'Test Customer',
            },
          });
  
        expect(result.valid).toBe(false);
        expect(result.error).toContain(
          'Invalid CVV'
        );
      });
    });
  
    describe('EftPaymentStrategy', () => {
      const strategy =
        new EftPaymentStrategy();
  
      test('accepts a positive amount', () => {
        const result =
          strategy.validateRequest(
            baseRequest
          );
  
        expect(result.valid).toBe(true);
      });
  
      test('rejects zero amount', () => {
        const result =
          strategy.validateRequest({
            ...baseRequest,
            amountZar: 0,
          });
  
        expect(result.valid).toBe(false);
      });
    });
  
    describe('SnapScanPaymentStrategy', () => {
      const strategy =
        new SnapScanPaymentStrategy();
  
      test('rejects negative amounts', () => {
        const result =
          strategy.validateRequest({
            ...baseRequest,
            amountZar: -10,
          });
  
        expect(result.valid).toBe(false);
      });
  
      test('accepts valid amounts', () => {
        const result =
          strategy.validateRequest(
            baseRequest
          );
  
        expect(result.valid).toBe(true);
      });
    });
  
    describe('ZapperPaymentStrategy', () => {
      const strategy =
        new ZapperPaymentStrategy();
  
      test('accepts valid amounts', () => {
        const result =
          strategy.validateRequest(
            baseRequest
          );
  
        expect(result.valid).toBe(true);
      });
  
      test('rejects zero amount', () => {
        const result =
          strategy.validateRequest({
            ...baseRequest,
            amountZar: 0,
          });
  
        expect(result.valid).toBe(false);
      });
    });
  
    describe('PaymentProcessor', () => {
      test('uses card strategy by default', () => {
        const processor =
          new PaymentProcessor();
  
        expect(
          processor.getStrategyName()
        ).toBe(
          'Credit / Debit Card (Visa / Mastercard)'
        );
      });
  
      test('can switch payment strategies', () => {
        const processor =
          new PaymentProcessor();
  
        processor.setStrategy(
          new EftPaymentStrategy()
        );
  
        expect(
          processor.getStrategyName()
        ).toBe(
          'Instant EFT (FNB, Standard Bank, Absa, Nedbank, Capitec, Investec)'
        );
      });
  
      test('executes the selected payment strategy', async () => {
        const processor =
          new PaymentProcessor(
            new SnapScanPaymentStrategy()
          );
  
        vi.useFakeTimers();
  
        const paymentPromise =
          processor.executePayment(
            baseRequest
          );
  
        await vi.runAllTimersAsync();
  
        const result =
          await paymentPromise;
  
        vi.useRealTimers();
  
        expect(result.success).toBe(true);
        expect(result.paymentMethod).toBe(
          'snapscan'
        );
        expect(
          result.amountChargedZar
        ).toBe(652.85);
        expect(
          result.qrCodeUrl
        ).toContain(
          'amount=65285'
        );
      });
    });
  });