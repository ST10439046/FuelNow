// ============================================================================
// OBSERVER PATTERN: Realtime Broadcast & Channel Subscriptions
// Emits and listens to live GPS updates, order status changes, and SOS alerts
// ============================================================================

export type ObserverCallback<T = any> = (data: T) => void;

export interface ISubject<T = any> {
  subscribe(observer: ObserverCallback<T>): () => void;
  unsubscribe(observer: ObserverCallback<T>): void;
  notify(data: T): void;
}

export class RealtimeChannelSubject<T = any> implements ISubject<T> {
  private observers: Set<ObserverCallback<T>> = new Set();
  private channelName: string;

  constructor(channelName: string) {
    this.channelName = channelName;
  }

  public getChannelName(): string {
    return this.channelName;
  }

  public subscribe(observer: ObserverCallback<T>): () => void {
    this.observers.add(observer);
    return () => this.unsubscribe(observer);
  }

  public unsubscribe(observer: ObserverCallback<T>): void {
    this.observers.delete(observer);
  }

  public notify(data: T): void {
    this.observers.forEach((observer) => {
      try {
        observer(data);
      } catch (err) {
        console.error(`[RealtimeChannelSubject:${this.channelName}] Error notifying observer:`, err);
      }
    });
  }

  public getObserverCount(): number {
    return this.observers.size;
  }
}

// Global Hub for Realtime Topics
export class RealtimeObserverHub {
  private static instance: RealtimeObserverHub;
  private channels: Map<string, RealtimeChannelSubject> = new Map();

  private constructor() {}

  public static getInstance(): RealtimeObserverHub {
    if (!RealtimeObserverHub.instance) {
      RealtimeObserverHub.instance = new RealtimeObserverHub();
    }
    return RealtimeObserverHub.instance;
  }

  public getChannel<T = any>(channelName: string): RealtimeChannelSubject<T> {
    if (!this.channels.has(channelName)) {
      this.channels.set(channelName, new RealtimeChannelSubject<T>(channelName));
    }
    return this.channels.get(channelName)!;
  }

  // Pre-configured standard topics
  public getOrderChannel(orderId?: string): RealtimeChannelSubject {
    return this.getChannel(orderId ? `orders:${orderId}` : 'orders:all');
  }

  public getDriverGpsChannel(driverId: string): RealtimeChannelSubject {
    return this.getChannel(`driver_gps:${driverId}`);
  }

  public getSOSAlertChannel(): RealtimeChannelSubject {
    return this.getChannel('sos_alerts:emergency');
  }

  public getFuelRatesChannel(): RealtimeChannelSubject {
    return this.getChannel('fuel_rates:live');
  }
}

export const realtimeHub = RealtimeObserverHub.getInstance();
