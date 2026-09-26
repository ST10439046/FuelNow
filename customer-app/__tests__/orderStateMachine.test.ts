import {
    OrderStateMachine,
    PendingPaymentState,
    PaidState,
    FindingDriverState,
    AcceptedState,
    NavigatingState,
    ArrivedState,
    DispensingState,
    CompletedState,
    CancelledState,
  } from '../src/patterns/orderStateMachine';
  
  const baseContext = {
    id: 'order-test-001',
    status: 'PENDING_PAYMENT' as const,
    pin: '1234',
  };
  
  describe('Customer Order State Machine', () => {
    describe('state factory', () => {
      test('returns the correct state for every order status', () => {
        expect(OrderStateMachine.getState('PENDING_PAYMENT'))
          .toBeInstanceOf(PendingPaymentState);
  
        expect(OrderStateMachine.getState('PAID'))
          .toBeInstanceOf(PaidState);
  
        expect(OrderStateMachine.getState('FINDING_DRIVER'))
          .toBeInstanceOf(FindingDriverState);
  
        expect(OrderStateMachine.getState('ACCEPTED'))
          .toBeInstanceOf(AcceptedState);
  
        expect(OrderStateMachine.getState('NAVIGATING'))
          .toBeInstanceOf(NavigatingState);
  
        expect(OrderStateMachine.getState('ARRIVED'))
          .toBeInstanceOf(ArrivedState);
  
        expect(OrderStateMachine.getState('DISPENSING'))
          .toBeInstanceOf(DispensingState);
  
        expect(OrderStateMachine.getState('COMPLETED'))
          .toBeInstanceOf(CompletedState);
  
        expect(OrderStateMachine.getState('CANCELLED'))
          .toBeInstanceOf(CancelledState);
      });
    });
  
    describe('payment flow', () => {
      test('pending payment can become paid', () => {
        const result = OrderStateMachine.validateTransition(
          'PENDING_PAYMENT',
          'PAID',
          baseContext
        );
  
        expect(result.allowed).toBe(true);
        expect(result.nextStatus).toBe('PAID');
      });
  
      test('pending payment cannot skip directly to driver assignment', () => {
        const result = OrderStateMachine.validateTransition(
          'PENDING_PAYMENT',
          'ACCEPTED',
          baseContext
        );
  
        expect(result.allowed).toBe(false);
        expect(result.errorMessage).toContain('Cannot skip payment');
      });
    });
  
    describe('driver assignment', () => {
      test('paid order can begin finding a driver', () => {
        const result = OrderStateMachine.validateTransition(
          'PAID',
          'FINDING_DRIVER',
          {
            ...baseContext,
            status: 'PAID',
          }
        );
  
        expect(result.allowed).toBe(true);
        expect(result.nextStatus).toBe('FINDING_DRIVER');
      });
  
      test('finding driver cannot be accepted without a driver ID', () => {
        const result = OrderStateMachine.validateTransition(
          'FINDING_DRIVER',
          'ACCEPTED',
          {
            ...baseContext,
            status: 'FINDING_DRIVER',
          }
        );
  
        expect(result.allowed).toBe(false);
        expect(result.errorMessage).toContain(
          'driver must be assigned'
        );
      });
  
      test('finding driver can be accepted when a driver is assigned', () => {
        const result = OrderStateMachine.validateTransition(
          'FINDING_DRIVER',
          'ACCEPTED',
          {
            ...baseContext,
            status: 'FINDING_DRIVER',
            driverId: 'driver-001',
          }
        );
  
        expect(result.allowed).toBe(true);
        expect(result.nextStatus).toBe('ACCEPTED');
      });
    });
  
    describe('delivery lifecycle', () => {
      test('accepted order can become navigating', () => {
        const result = OrderStateMachine.validateTransition(
          'ACCEPTED',
          'NAVIGATING',
          {
            ...baseContext,
            status: 'ACCEPTED',
            driverId: 'driver-001',
          }
        );
  
        expect(result.allowed).toBe(true);
      });
  
      test('navigating order can become arrived', () => {
        const result = OrderStateMachine.validateTransition(
          'NAVIGATING',
          'ARRIVED',
          {
            ...baseContext,
            status: 'NAVIGATING',
            driverId: 'driver-001',
          }
        );
  
        expect(result.allowed).toBe(true);
      });
  
      test('arrived order can become dispensing', () => {
        const result = OrderStateMachine.validateTransition(
          'ARRIVED',
          'DISPENSING',
          {
            ...baseContext,
            status: 'ARRIVED',
            driverId: 'driver-001',
          }
        );
  
        expect(result.allowed).toBe(true);
      });
  
      test('dispensing requires proof of delivery before completion', () => {
        const result = OrderStateMachine.validateTransition(
          'DISPENSING',
          'COMPLETED',
          {
            ...baseContext,
            status: 'DISPENSING',
            driverId: 'driver-001',
          }
        );
  
        expect(result.allowed).toBe(false);
        expect(result.errorMessage).toContain(
          'Proof of Delivery'
        );
      });
  
      test('dispensing can become completed with POD photo', () => {
        const result = OrderStateMachine.validateTransition(
          'DISPENSING',
          'COMPLETED',
          {
            ...baseContext,
            status: 'DISPENSING',
            driverId: 'driver-001',
            podPhotoUrl: 'https://example.com/pod.jpg',
          }
        );
  
        expect(result.allowed).toBe(true);
        expect(result.nextStatus).toBe('COMPLETED');
      });
    });
  
    describe('terminal states', () => {
      test('completed orders cannot transition again', () => {
        const result = OrderStateMachine.validateTransition(
          'COMPLETED',
          'PAID',
          {
            ...baseContext,
            status: 'COMPLETED',
          }
        );
  
        expect(result.allowed).toBe(false);
        expect(result.errorMessage).toContain(
          'finalized'
        );
      });
  
      test('cancelled orders cannot transition again', () => {
        const result = OrderStateMachine.validateTransition(
          'CANCELLED',
          'PAID',
          {
            ...baseContext,
            status: 'CANCELLED',
          }
        );
  
        expect(result.allowed).toBe(false);
        expect(result.errorMessage).toContain(
          'CANCELLED'
        );
      });
  
      test('pending payment can be cancelled', () => {
        const result = OrderStateMachine.validateTransition(
          'PENDING_PAYMENT',
          'CANCELLED',
          baseContext
        );
  
        expect(result.allowed).toBe(true);
        expect(result.nextStatus).toBe('CANCELLED');
      });
    });
  });