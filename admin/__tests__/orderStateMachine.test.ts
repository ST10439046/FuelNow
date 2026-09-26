import {
    describe,
    expect,
    test,
  } from 'vitest';
  
  import {
    OrderStateMachine,
  } from '../src/patterns/orderStateMachine';
  
  const baseContext = {
    id: 'admin-test-order',
    status: 'PENDING_PAYMENT' as const,
    pin: '1234',
  };
  
  describe('Admin Order State Machine', () => {
    test('PENDING_PAYMENT can transition to PAID', () => {
      const result =
        OrderStateMachine.validateTransition(
          'PENDING_PAYMENT',
          'PAID',
          baseContext
        );
  
      expect(result.allowed).toBe(true);
      expect(result.nextStatus).toBe('PAID');
    });
  
    test('PENDING_PAYMENT cannot skip payment', () => {
      const result =
        OrderStateMachine.validateTransition(
          'PENDING_PAYMENT',
          'ACCEPTED',
          baseContext
        );
  
      expect(result.allowed).toBe(false);
      expect(result.errorMessage).toContain(
        'Cannot skip payment'
      );
    });
  
    test('PAID can begin driver matching', () => {
      const result =
        OrderStateMachine.validateTransition(
          'PAID',
          'FINDING_DRIVER',
          {
            ...baseContext,
            status: 'PAID',
          }
        );
  
      expect(result.allowed).toBe(true);
    });
  
    test('FINDING_DRIVER requires a driver', () => {
      const result =
        OrderStateMachine.validateTransition(
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
  
    test('FINDING_DRIVER can become ACCEPTED with driver', () => {
      const result =
        OrderStateMachine.validateTransition(
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
  
    test('ACCEPTED can become NAVIGATING', () => {
      const result =
        OrderStateMachine.validateTransition(
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
  
    test('NAVIGATING can become ARRIVED', () => {
      const result =
        OrderStateMachine.validateTransition(
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
  
    test('ARRIVED can become DISPENSING', () => {
      const result =
        OrderStateMachine.validateTransition(
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
  
    test('DISPENSING requires POD before COMPLETED', () => {
      const result =
        OrderStateMachine.validateTransition(
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
  
    test('DISPENSING can become COMPLETED with POD', () => {
      const result =
        OrderStateMachine.validateTransition(
          'DISPENSING',
          'COMPLETED',
          {
            ...baseContext,
            status: 'DISPENSING',
            driverId: 'driver-001',
            podPhotoUrl:
              'https://example.com/pod.jpg',
          }
        );
  
      expect(result.allowed).toBe(true);
      expect(result.nextStatus).toBe('COMPLETED');
    });
  
    test('COMPLETED is terminal', () => {
      const result =
        OrderStateMachine.validateTransition(
          'COMPLETED',
          'PAID',
          {
            ...baseContext,
            status: 'COMPLETED',
          }
        );
  
      expect(result.allowed).toBe(false);
    });
  
    test('CANCELLED is terminal', () => {
      const result =
        OrderStateMachine.validateTransition(
          'CANCELLED',
          'PAID',
          {
            ...baseContext,
            status: 'CANCELLED',
          }
        );
  
      expect(result.allowed).toBe(false);
    });
  });