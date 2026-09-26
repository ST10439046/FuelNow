import {
    describe,
    expect,
    test,
  } from 'vitest';
  
  import {
    OrderStateMachine,
    type OrderContext,
    type OrderStatus,
  } from '../src/patterns/orderStateMachine';
  
  function createContext(
    overrides: Partial<OrderContext> = {}
  ): OrderContext {
    return {
      id: 'test-order-123',
      status: 'PAID',
      pin: '1234',
      ...overrides,
    };
  }
  
  describe('Driver Order State Machine', () => {
    test('PAID can transition to FINDING_DRIVER', () => {
      const result = OrderStateMachine.validateTransition(
        'PAID',
        'FINDING_DRIVER',
        createContext({
          status: 'PAID',
        })
      );
  
      expect(result.allowed).toBe(true);
      expect(result.nextStatus).toBe('FINDING_DRIVER');
    });
  
    test('PAID can transition directly to ACCEPTED when appropriate', () => {
      const result = OrderStateMachine.validateTransition(
        'PAID',
        'ACCEPTED',
        createContext({
          status: 'PAID',
          driverId: 'driver-123',
        })
      );
  
      expect(result.allowed).toBe(true);
      expect(result.nextStatus).toBe('ACCEPTED');
    });
  
    test('PAID cannot jump directly to NAVIGATING', () => {
      const result = OrderStateMachine.validateTransition(
        'PAID',
        'NAVIGATING',
        createContext({
          status: 'PAID',
        })
      );
  
      expect(result.allowed).toBe(false);
      expect(result.errorMessage).toContain(
        'Paid order must match with a driver'
      );
    });
  
    test('FINDING_DRIVER requires a driver before ACCEPTED', () => {
      const result = OrderStateMachine.validateTransition(
        'FINDING_DRIVER',
        'ACCEPTED',
        createContext({
          status: 'FINDING_DRIVER',
        })
      );
  
      expect(result.allowed).toBe(false);
      expect(result.errorMessage).toContain(
        'A driver must be assigned'
      );
    });
  
    test('FINDING_DRIVER can transition to ACCEPTED with a driver', () => {
      const result = OrderStateMachine.validateTransition(
        'FINDING_DRIVER',
        'ACCEPTED',
        createContext({
          status: 'FINDING_DRIVER',
          driverId: 'driver-123',
        })
      );
  
      expect(result.allowed).toBe(true);
      expect(result.nextStatus).toBe('ACCEPTED');
    });
  
    test('ACCEPTED can transition to NAVIGATING', () => {
      const result = OrderStateMachine.validateTransition(
        'ACCEPTED',
        'NAVIGATING',
        createContext({
          status: 'ACCEPTED',
          driverId: 'driver-123',
        })
      );
  
      expect(result.allowed).toBe(true);
      expect(result.nextStatus).toBe('NAVIGATING');
    });
  
    test('NAVIGATING can transition to ARRIVED', () => {
      const result = OrderStateMachine.validateTransition(
        'NAVIGATING',
        'ARRIVED',
        createContext({
          status: 'NAVIGATING',
          driverId: 'driver-123',
        })
      );
  
      expect(result.allowed).toBe(true);
      expect(result.nextStatus).toBe('ARRIVED');
    });
  
    test('ARRIVED can transition to DISPENSING', () => {
      const result = OrderStateMachine.validateTransition(
        'ARRIVED',
        'DISPENSING',
        createContext({
          status: 'ARRIVED',
          driverId: 'driver-123',
        })
      );
  
      expect(result.allowed).toBe(true);
      expect(result.nextStatus).toBe('DISPENSING');
    });
  
    test('DISPENSING requires a POD photo before COMPLETED', () => {
      const result = OrderStateMachine.validateTransition(
        'DISPENSING',
        'COMPLETED',
        createContext({
          status: 'DISPENSING',
        })
      );
  
      expect(result.allowed).toBe(false);
      expect(result.errorMessage).toContain(
        'Proof of Delivery (POD) photo is strictly required'
      );
    });
  
    test('DISPENSING can transition to COMPLETED with a POD photo', () => {
      const result = OrderStateMachine.validateTransition(
        'DISPENSING',
        'COMPLETED',
        createContext({
          status: 'DISPENSING',
          podPhotoUrl: 'https://example.com/pod.jpg',
        })
      );
  
      expect(result.allowed).toBe(true);
      expect(result.nextStatus).toBe('COMPLETED');
    });
  
    test('COMPLETED cannot transition to another status', () => {
      const statuses: OrderStatus[] = [
        'PENDING_PAYMENT',
        'PAID',
        'FINDING_DRIVER',
        'ACCEPTED',
        'NAVIGATING',
        'ARRIVED',
        'DISPENSING',
        'COMPLETED',
        'CANCELLED',
      ];
  
      for (const targetStatus of statuses) {
        const result = OrderStateMachine.validateTransition(
          'COMPLETED',
          targetStatus,
          createContext({
            status: 'COMPLETED',
            podPhotoUrl: 'https://example.com/pod.jpg',
          })
        );
  
        expect(result.allowed).toBe(false);
      }
    });
  
    test('CANCELLED cannot transition to another status', () => {
      const result = OrderStateMachine.validateTransition(
        'CANCELLED',
        'PAID',
        createContext({
          status: 'CANCELLED',
        })
      );
  
      expect(result.allowed).toBe(false);
      expect(result.errorMessage).toContain(
        'Order is CANCELLED'
      );
    });
  
    test('PENDING_PAYMENT can transition to PAID', () => {
      const result = OrderStateMachine.validateTransition(
        'PENDING_PAYMENT',
        'PAID',
        createContext({
          status: 'PENDING_PAYMENT',
        })
      );
  
      expect(result.allowed).toBe(true);
      expect(result.nextStatus).toBe('PAID');
    });
  
    test('PENDING_PAYMENT can be cancelled', () => {
      const result = OrderStateMachine.validateTransition(
        'PENDING_PAYMENT',
        'CANCELLED',
        createContext({
          status: 'PENDING_PAYMENT',
        })
      );
  
      expect(result.allowed).toBe(true);
      expect(result.nextStatus).toBe('CANCELLED');
    });
  
    test('active delivery states can be cancelled where supported', () => {
      const cancellableStates: OrderStatus[] = [
        'PAID',
        'FINDING_DRIVER',
        'ACCEPTED',
        'NAVIGATING',
        'ARRIVED',
      ];
  
      for (const currentStatus of cancellableStates) {
        const result = OrderStateMachine.validateTransition(
          currentStatus,
          'CANCELLED',
          createContext({
            status: currentStatus,
            driverId: 'driver-123',
          })
        );
  
        expect(result.allowed).toBe(true);
        expect(result.nextStatus).toBe('CANCELLED');
      }
    });
  
    test('each state returns its correct status', () => {
      const statuses: OrderStatus[] = [
        'PENDING_PAYMENT',
        'PAID',
        'FINDING_DRIVER',
        'ACCEPTED',
        'NAVIGATING',
        'ARRIVED',
        'DISPENSING',
        'COMPLETED',
        'CANCELLED',
      ];
  
      for (const status of statuses) {
        const state = OrderStateMachine.getState(status);
  
        expect(state.getStatus()).toBe(status);
      }
    });
  
    test('each state provides a description and display badge', () => {
      const statuses: OrderStatus[] = [
        'PENDING_PAYMENT',
        'PAID',
        'FINDING_DRIVER',
        'ACCEPTED',
        'NAVIGATING',
        'ARRIVED',
        'DISPENSING',
        'COMPLETED',
        'CANCELLED',
      ];
  
      for (const status of statuses) {
        const state = OrderStateMachine.getState(status);
  
        expect(state.getDescription()).toBeTruthy();
  
        const badge = state.getDisplayBadge();
  
        expect(badge).toHaveProperty('label');
        expect(badge).toHaveProperty('color');
        expect(badge.label).toBeTruthy();
        expect(badge.color).toBeTruthy();
      }
    });
  });