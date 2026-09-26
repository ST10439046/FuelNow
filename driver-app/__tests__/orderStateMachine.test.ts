import {
    OrderStateMachine,
  } from '../src/patterns/orderStateMachine';
  
  const context = {
    id: 'driver-test-order',
    status: 'PAID' as const,
    pin: '4821',
    driverId: 'driver-001',
  };
  
  describe('Driver Order State Machine', () => {
    test('PAID can transition to FINDING_DRIVER', () => {
      const result = OrderStateMachine.validateTransition(
        'PAID',
        'FINDING_DRIVER',
        context
      );
  
      expect(result.allowed).toBe(true);
      expect(result.nextStatus).toBe('FINDING_DRIVER');
    });
  
    test('FINDING_DRIVER requires a driver before ACCEPTED', () => {
      const result = OrderStateMachine.validateTransition(
        'FINDING_DRIVER',
        'ACCEPTED',
        {
          ...context,
          status: 'FINDING_DRIVER',
          driverId: undefined,
        }
      );
  
      expect(result.allowed).toBe(false);
      expect(result.errorMessage).toContain(
        'driver must be assigned'
      );
    });
  
    test('FINDING_DRIVER can transition to ACCEPTED with driver', () => {
      const result = OrderStateMachine.validateTransition(
        'FINDING_DRIVER',
        'ACCEPTED',
        {
          ...context,
          status: 'FINDING_DRIVER',
          driverId: 'driver-001',
        }
      );
  
      expect(result.allowed).toBe(true);
      expect(result.nextStatus).toBe('ACCEPTED');
    });
  
    test('ACCEPTED can transition to NAVIGATING', () => {
      const result = OrderStateMachine.validateTransition(
        'ACCEPTED',
        'NAVIGATING',
        {
          ...context,
          status: 'ACCEPTED',
        }
      );
  
      expect(result.allowed).toBe(true);
    });
  
    test('NAVIGATING can transition to ARRIVED', () => {
      const result = OrderStateMachine.validateTransition(
        'NAVIGATING',
        'ARRIVED',
        {
          ...context,
          status: 'NAVIGATING',
        }
      );
  
      expect(result.allowed).toBe(true);
    });
  
    test('ARRIVED can transition to DISPENSING', () => {
      const result = OrderStateMachine.validateTransition(
        'ARRIVED',
        'DISPENSING',
        {
          ...context,
          status: 'ARRIVED',
        }
      );
  
      expect(result.allowed).toBe(true);
    });
  
    test('DISPENSING requires POD before COMPLETED', () => {
      const result = OrderStateMachine.validateTransition(
        'DISPENSING',
        'COMPLETED',
        {
          ...context,
          status: 'DISPENSING',
        }
      );
  
      expect(result.allowed).toBe(false);
      expect(result.errorMessage).toContain(
        'Proof of Delivery'
      );
    });
  
    test('DISPENSING can become COMPLETED with POD', () => {
      const result = OrderStateMachine.validateTransition(
        'DISPENSING',
        'COMPLETED',
        {
          ...context,
          status: 'DISPENSING',
          podPhotoUrl: 'file:///pod/photo.jpg',
        }
      );
  
      expect(result.allowed).toBe(true);
      expect(result.nextStatus).toBe('COMPLETED');
    });
  
    test('COMPLETED is terminal', () => {
      const result = OrderStateMachine.validateTransition(
        'COMPLETED',
        'PAID',
        {
          ...context,
          status: 'COMPLETED',
        }
      );
  
      expect(result.allowed).toBe(false);
    });
  
    test('any normal delivery state can be cancelled', () => {
      const statuses = [
        'PENDING_PAYMENT',
        'PAID',
        'FINDING_DRIVER',
        'ACCEPTED',
        'NAVIGATING',
        'ARRIVED',
      ] as const;
  
      for (const status of statuses) {
        const result =
          OrderStateMachine.validateTransition(
            status,
            'CANCELLED',
            {
              ...context,
              status,
            }
          );
  
        expect(result.allowed).toBe(true);
        expect(result.nextStatus).toBe('CANCELLED');
      }
    });
  });