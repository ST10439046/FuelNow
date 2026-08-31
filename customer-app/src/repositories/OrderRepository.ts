import { OrderStateMachine, OrderStatus } from '../patterns/orderStateMachine';
import { realtimeHub } from '../patterns/realtimeObserver';
import { supabaseService } from '../services/supabase';
import { AddressModel, PaymentMethodModel, userRepository } from './UserRepository';
import { DriverModel, driverRepository } from './DriverRepository';
import { FuelRateModel } from './FuelRateRepository';

export interface OrderItemModel {
  fuelType: FuelRateModel['type'];
  litres: number;
  pricePerLitre: number;
  subtotal: number;
}

export interface OrderModel {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  item: OrderItemModel;
  deliveryAddress: AddressModel;
  scheduledAt: string | null;
  paymentMethod: PaymentMethodModel;
  deliveryFee: number;
  vatAmount: number;
  totalAmount: number;
  driver?: DriverModel;
  pin: string;
  podPhotoUrl?: string;
  createdAt: string;
  deliveredAt?: string;
  estimatedArrivalMinutes: number;
  distanceKm: number;
  rating?: number;
  ratingComment?: string;
}

export class OrderRepository {
  private static instance: OrderRepository;

  private activeOrder: OrderModel | null = null;
  private orders: OrderModel[] = [];

  private constructor() {
    this.orders = [
      {
        id: 'ord_7821',
        orderNumber: 'FN-7821',
        status: 'COMPLETED',
        item: {
          fuelType: 'Petrol 95',
          litres: 40,
          pricePerLitre: 23.45,
          subtotal: 938.0,
        },
        deliveryAddress: {
          id: 'addr_001',
          label: 'Home',
          street: '18 Kenneth Kaunda Road',
          suburb: 'Durban North',
          city: 'Durban',
          province: 'KwaZulu-Natal',
          postalCode: '4051',
          coordinates: { lat: -29.8000, lng: 31.0333 },
        },
        scheduledAt: null,
        paymentMethod: {
          id: 'pm_001',
          type: 'card',
          label: 'FNB Corporate Cheque ••• 4821',
          last4: '4821',
          brand: 'visa',
          isDefault: true,
        },
        deliveryFee: 49.0,
        vatAmount: 148.05,
        totalAmount: 987.0,
        driver: {
          id: 'drv_001',
          name: 'France Sizwe',
          phone: '060 123 4567',
          rating: 4.9,
          totalDeliveries: 1248,
          vehicleReg: 'ND 456-789',
          vehicleModel: 'Toyota Hilux 2.8 GD-6',
          vehicleColor: 'Super White',
          stationName: 'Engen Durban North',
          isOnDuty: true,
          isApproved: true,
          coordinates: { lat: -29.7990, lng: 31.0340 },
          dailyTarget: 1500,
          todayEarnings: 892.50,
          weekEarnings: 4310.00,
          monthEarnings: 16840.00,
          documents: [],
        },
        pin: '5821',
        podPhotoUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(),
        estimatedArrivalMinutes: 25,
        distanceKm: 3.2,
        rating: 5,
        ratingComment: 'Super fast, France was professional and on time!',
      },
      {
        id: 'ord_7756',
        orderNumber: 'FN-7756',
        status: 'COMPLETED',
        item: {
          fuelType: 'Diesel 50ppm',
          litres: 60,
          pricePerLitre: 21.63,
          subtotal: 1297.8,
        },
        deliveryAddress: {
          id: 'addr_002',
          label: 'Work',
          street: '45 Jan Hofmeyr Road',
          suburb: 'Westville',
          city: 'Durban',
          province: 'KwaZulu-Natal',
          postalCode: '3629',
          coordinates: { lat: -29.8256, lng: 30.9312 },
        },
        scheduledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: {
          id: 'pm_002',
          type: 'card',
          label: 'Nedbank Business ••• 9934',
          last4: '9934',
          brand: 'mastercard',
          isDefault: false,
        },
        deliveryFee: 49.0,
        vatAmount: 202.02,
        totalAmount: 1346.8,
        driver: {
          id: 'drv_002',
          name: 'Ruan van der Merwe',
          phone: '072 987 6543',
          rating: 4.7,
          totalDeliveries: 834,
          vehicleReg: 'ND 882-104',
          vehicleModel: 'Isuzu D-Max 3.0 Ddi',
          vehicleColor: 'Silver',
          stationName: 'Total Westville',
          isOnDuty: true,
          isApproved: true,
          coordinates: { lat: -29.8256, lng: 30.9312 },
          dailyTarget: 1500,
          todayEarnings: 680.00,
          weekEarnings: 3450.00,
          monthEarnings: 13900.00,
          documents: [],
        },
        pin: '3394',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 18 * 60 * 1000).toISOString(),
        estimatedArrivalMinutes: 18,
        distanceKm: 2.1,
        rating: 4,
        ratingComment: 'Great service on site.',
      },
    ];
  }

  public static getInstance(): OrderRepository {
    if (!OrderRepository.instance) {
      OrderRepository.instance = new OrderRepository();
    }
    return OrderRepository.instance;
  }

  public async getOrders(): Promise<OrderModel[]> {
    return [...this.orders];
  }

  public async getOrderById(id: string): Promise<OrderModel | null> {
    if (this.activeOrder && this.activeOrder.id === id) return this.activeOrder;
    const found = this.orders.find((o) => o.id === id);
    return found || null;
  }

  public async getActiveOrder(): Promise<OrderModel | null> {
    return this.activeOrder;
  }

  public async createOrder(data: {
    fuelType: FuelRateModel['type'];
    litres: number;
    pricePerLitre: number;
    deliveryAddress: AddressModel;
    scheduledAt: string | null;
    paymentMethod: PaymentMethodModel;
  }): Promise<OrderModel> {
    const subtotal = +(data.pricePerLitre * data.litres).toFixed(2);
    const deliveryFee = 49.0;
    const totalAmount = +(subtotal + deliveryFee).toFixed(2);
    const vatAmount = +(totalAmount * 0.15).toFixed(2);
    const orderPin = String(Math.floor(1000 + Math.random() * 9000));
    const orderNum = `FN-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: OrderModel = {
      id: `ord_${Date.now().toString().slice(-4)}`,
      orderNumber: orderNum,
      status: 'FINDING_DRIVER',
      item: {
        fuelType: data.fuelType,
        litres: data.litres,
        pricePerLitre: data.pricePerLitre,
        subtotal,
      },
      deliveryAddress: data.deliveryAddress,
      scheduledAt: data.scheduledAt,
      paymentMethod: data.paymentMethod,
      deliveryFee,
      vatAmount,
      totalAmount,
      pin: orderPin,
      createdAt: new Date().toISOString(),
      estimatedArrivalMinutes: 24,
      distanceKm: +(Math.random() * 3 + 1.8).toFixed(1),
    };

    this.activeOrder = newOrder;
    this.orders.unshift(newOrder);

    // Notify observers
    realtimeHub.getOrderChannel(newOrder.id).notify(newOrder);
    realtimeHub.getOrderChannel().notify(newOrder);

    return newOrder;
  }

  public async updateOrderStatus(
    orderId: string,
    targetStatus: OrderStatus,
    extra?: { driver?: DriverModel; podPhotoUrl?: string }
  ): Promise<{ success: boolean; order?: OrderModel; error?: string }> {
    const order = await this.getOrderById(orderId);
    if (!order) return { success: false, error: 'Order not found' };

    // Validate using State Pattern
    const validation = OrderStateMachine.validateTransition(order.status, targetStatus, {
      id: order.id,
      status: order.status,
      pin: order.pin,
      driverId: extra?.driver?.id || order.driver?.id,
      podPhotoUrl: extra?.podPhotoUrl || order.podPhotoUrl,
    });

    if (!validation.allowed) {
      return { success: false, error: validation.errorMessage };
    }

    order.status = targetStatus;
    if (extra?.driver) order.driver = extra.driver;
    if (extra?.podPhotoUrl) order.podPhotoUrl = extra.podPhotoUrl;
    if (targetStatus === 'COMPLETED') order.deliveredAt = new Date().toISOString();

    if (this.activeOrder && this.activeOrder.id === orderId) {
      this.activeOrder = { ...order };
    }

    // Broadcast to real-time observers
    realtimeHub.getOrderChannel(order.id).notify(order);
    realtimeHub.getOrderChannel().notify(order);

    return { success: true, order: { ...order } };
  }

  /**
   * Confirms delivery through Supabase Edge Function validation
   */
  public async confirmDeliveryWithPin(
    orderId: string,
    pin: string,
    photoUrl?: string
  ): Promise<{ success: boolean; order?: OrderModel; error?: string }> {
    const order = await this.getOrderById(orderId);
    if (!order) return { success: false, error: 'Order not found' };

    // Invoke Supabase Edge Function
    try {
      const { data, error } = await supabaseService.invokeFunction('confirm-delivery', {
        order_id: orderId,
        delivery_pin: pin,
        photo_url: photoUrl,
        driver_id: order.driver?.id,
      });

      if (error || (data && !data.success)) {
        // Local PIN check fallback for offline/demo reliability
        if (pin.trim() !== order.pin.trim()) {
          return { success: false, error: 'Security Warning: Incorrect 4-digit PIN provided by customer.' };
        }
      }
    } catch {
      if (pin.trim() !== order.pin.trim()) {
        return { success: false, error: 'Security Warning: Incorrect 4-digit PIN provided by customer.' };
      }
    }

    // Mark completed
    order.status = 'COMPLETED';
    order.deliveredAt = new Date().toISOString();
    if (photoUrl) order.podPhotoUrl = photoUrl;

    if (this.activeOrder && this.activeOrder.id === orderId) {
      this.activeOrder = { ...order };
    }

    // Award +80 FuelPoints
    await userRepository.addPoints(80);

    realtimeHub.getOrderChannel(order.id).notify(order);
    realtimeHub.getOrderChannel().notify(order);

    return { success: true, order: { ...order } };
  }

  public async rateOrder(orderId: string, rating: number, comment?: string): Promise<boolean> {
    const order = await this.getOrderById(orderId);
    if (order) {
      order.rating = rating;
      order.ratingComment = comment;
      realtimeHub.getOrderChannel(order.id).notify(order);
      return true;
    }
    return false;
  }
}

export const orderRepository = OrderRepository.getInstance();
