// ============================================================================
// STATE PATTERN: FuelNow Order Lifecycle State Machine
// ============================================================================

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'FINDING_DRIVER'
  | 'ACCEPTED'
  | 'NAVIGATING'
  | 'ARRIVED'
  | 'DISPENSING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface OrderStateTransitionResult {
  allowed: boolean;
  nextStatus?: OrderStatus;
  errorMessage?: string;
}

export interface OrderContext {
  id: string;
  status: OrderStatus;
  pin: string;
  driverId?: string;
  podPhotoUrl?: string;
  fuelTypeConfirmed?: boolean;
}

// State Pattern Interface
export interface IOrderState {
  getStatus(): OrderStatus;
  canTransitionTo(nextStatus: OrderStatus, context: OrderContext): OrderStateTransitionResult;
  getDescription(): string;
  getDisplayBadge(): { label: string; color: string };
}

// Concrete State: Pending Payment
export class PendingPaymentState implements IOrderState {
  getStatus(): OrderStatus {
    return 'PENDING_PAYMENT';
  }
  canTransitionTo(nextStatus: OrderStatus): OrderStateTransitionResult {
    if (nextStatus === 'PAID') return { allowed: true, nextStatus };
    if (nextStatus === 'CANCELLED') return { allowed: true, nextStatus };
    return {
      allowed: false,
      errorMessage: `Cannot skip payment. Order must be marked PAID before moving to ${nextStatus}.`,
    };
  }
  getDescription() {
    return 'Awaiting payment confirmation via PayFast / Instant EFT / SnapScan.';
  }
  getDisplayBadge() {
    return { label: 'Pending Payment', color: '#F59E0B' };
  }
}

// Concrete State: Paid
export class PaidState implements IOrderState {
  getStatus(): OrderStatus {
    return 'PAID';
  }
  canTransitionTo(nextStatus: OrderStatus): OrderStateTransitionResult {
    if (nextStatus === 'FINDING_DRIVER' || nextStatus === 'ACCEPTED') {
      return { allowed: true, nextStatus };
    }
    if (nextStatus === 'CANCELLED') return { allowed: true, nextStatus };
    return {
      allowed: false,
      errorMessage: `Paid order must match with a driver before moving to ${nextStatus}.`,
    };
  }
  getDescription() {
    return 'Payment received. Initializing driver search across Durban Metro.';
  }
  getDisplayBadge() {
    return { label: 'Paid', color: '#10B981' };
  }
}

// Concrete State: Finding Driver
export class FindingDriverState implements IOrderState {
  getStatus(): OrderStatus {
    return 'FINDING_DRIVER';
  }
  canTransitionTo(nextStatus: OrderStatus, context: OrderContext): OrderStateTransitionResult {
    if (nextStatus === 'ACCEPTED') {
      if (!context.driverId) {
        return { allowed: false, errorMessage: 'A driver must be assigned before accepting the order.' };
      }
      return { allowed: true, nextStatus };
    }
    if (nextStatus === 'CANCELLED') return { allowed: true, nextStatus };
    return { allowed: false, errorMessage: `Finding driver order cannot jump directly to ${nextStatus}.` };
  }
  getDescription() {
    return 'Searching for nearest available on-duty fuel delivery vehicle.';
  }
  getDisplayBadge() {
    return { label: 'Finding Driver', color: '#6366F1' };
  }
}

// Concrete State: Accepted
export class AcceptedState implements IOrderState {
  getStatus(): OrderStatus {
    return 'ACCEPTED';
  }
  canTransitionTo(nextStatus: OrderStatus): OrderStateTransitionResult {
    if (nextStatus === 'NAVIGATING') return { allowed: true, nextStatus };
    if (nextStatus === 'CANCELLED') return { allowed: true, nextStatus };
    return { allowed: false, errorMessage: `Driver must start navigation before moving to ${nextStatus}.` };
  }
  getDescription() {
    return 'Driver has accepted the delivery assignment.';
  }
  getDisplayBadge() {
    return { label: 'Driver Assigned', color: '#3B82F6' };
  }
}

// Concrete State: Navigating
export class NavigatingState implements IOrderState {
  getStatus(): OrderStatus {
    return 'NAVIGATING';
  }
  canTransitionTo(nextStatus: OrderStatus): OrderStateTransitionResult {
    if (nextStatus === 'ARRIVED') return { allowed: true, nextStatus };
    if (nextStatus === 'CANCELLED') return { allowed: true, nextStatus };
    return { allowed: false, errorMessage: `Driver must arrive at delivery coordinates before moving to ${nextStatus}.` };
  }
  getDescription() {
    return 'Driver is currently en route to the destination.';
  }
  getDisplayBadge() {
    return { label: 'En Route', color: '#0EA5E9' };
  }
}

// Concrete State: Arrived
export class ArrivedState implements IOrderState {
  getStatus(): OrderStatus {
    return 'ARRIVED';
  }
  canTransitionTo(nextStatus: OrderStatus): OrderStateTransitionResult {
    if (nextStatus === 'DISPENSING') return { allowed: true, nextStatus };
    if (nextStatus === 'CANCELLED') return { allowed: true, nextStatus };
    return { allowed: false, errorMessage: `Driver must initiate fuel dispensing before completing order.` };
  }
  getDescription() {
    return 'Driver has arrived at the customer location.';
  }
  getDisplayBadge() {
    return { label: 'Arrived', color: '#14B8A6' };
  }
}

// Concrete State: Dispensing
export class DispensingState implements IOrderState {
  getStatus(): OrderStatus {
    return 'DISPENSING';
  }
  canTransitionTo(nextStatus: OrderStatus, context: OrderContext): OrderStateTransitionResult {
    if (nextStatus === 'COMPLETED') {
      if (!context.podPhotoUrl) {
        return {
          allowed: false,
          errorMessage: 'Proof of Delivery (POD) photo is strictly required before marking order completed.',
        };
      }
      return { allowed: true, nextStatus };
    }
    return { allowed: false, errorMessage: `Dispensing order can only transition to COMPLETED once confirmed.` };
  }
  getDescription() {
    return 'Fuel dispensing in progress. Awaiting safe delivery PIN confirmation.';
  }
  getDisplayBadge() {
    return { label: 'Dispensing Fuel', color: '#F97316' };
  }
}

// Concrete State: Completed
export class CompletedState implements IOrderState {
  getStatus(): OrderStatus {
    return 'COMPLETED';
  }
  canTransitionTo(): OrderStateTransitionResult {
    return {
      allowed: false,
      errorMessage: 'Order is finalized and COMPLETED. No further status changes are permitted.',
    };
  }
  getDescription() {
    return 'Fuel delivered and verified with 4-digit PIN.';
  }
  getDisplayBadge() {
    return { label: 'Completed', color: '#10B981' };
  }
}

// Concrete State: Cancelled
export class CancelledState implements IOrderState {
  getStatus(): OrderStatus {
    return 'CANCELLED';
  }
  canTransitionTo(): OrderStateTransitionResult {
    return {
      allowed: false,
      errorMessage: 'Order is CANCELLED. No further transitions allowed.',
    };
  }
  getDescription() {
    return 'This order has been cancelled.';
  }
  getDisplayBadge() {
    return { label: 'Cancelled', color: '#EF4444' };
  }
}

// State Factory
export class OrderStateMachine {
  private static stateMap: Record<OrderStatus, IOrderState> = {
    PENDING_PAYMENT: new PendingPaymentState(),
    PAID: new PaidState(),
    FINDING_DRIVER: new FindingDriverState(),
    ACCEPTED: new AcceptedState(),
    NAVIGATING: new NavigatingState(),
    ARRIVED: new ArrivedState(),
    DISPENSING: new DispensingState(),
    COMPLETED: new CompletedState(),
    CANCELLED: new CancelledState(),
  };

  public static getState(status: OrderStatus): IOrderState {
    return this.stateMap[status] || new PendingPaymentState();
  }

  public static validateTransition(
    currentStatus: OrderStatus,
    targetStatus: OrderStatus,
    context: OrderContext
  ): OrderStateTransitionResult {
    const state = this.getState(currentStatus);
    return state.canTransitionTo(targetStatus, context);
  }
}
