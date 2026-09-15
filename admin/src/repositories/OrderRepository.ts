import type{
 
  OrderStatus,
  OrderContext,
} from '../patterns/orderStateMachine';

import { OrderStateMachine } from '../patterns/orderStateMachine';

import { realtimeHub } from '../patterns/realtimeObserver';

import {
  supabase,
  supabaseService,
} from '../services/supabase';

import type{
  AddressModel,
  PaymentMethodModel,
} from './UserRepository';

import { userRepository } from './UserRepository';

import type {
  DriverModel,
} from './DriverRepository';

import type{
  FuelRateModel,
} from './FuelRateRepository';


// ============================================================================
// ORDER MODELS
// ============================================================================

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

  customerName?: string;
  phone?: string;
  driverName?: string;
  latitude?: number;
longitude?: number;
}

export interface KPISummary {
  todayOrders: number;
  ordersChange: number;
  todayRevenue: number;
  revenueChange: number;
  activeDrivers: number;
  driversChange: number;
  avgDeliveryMinutes: number;
  avgTimeChange: number;
}


// ============================================================================
// ORDER REPOSITORY
// ============================================================================

export class OrderRepository {
  private static instance: OrderRepository;

  private activeOrder: OrderModel | null = null;

  private orders: OrderModel[] = [];

  private constructor() {}

  public static getInstance(): OrderRepository {
    if (!OrderRepository.instance) {
      OrderRepository.instance =
        new OrderRepository();
    }

    return OrderRepository.instance;
  }


  // ==========================================================================
  // GET CURRENT CUSTOMER ID
  // ==========================================================================

  private async getCurrentUserId(): Promise<string> {
    const user =
      await userRepository.getUser();

    if (!user?.id) {
      throw new Error(
        'No authenticated customer found.'
      );
    }

    return user.id;
  }


// ==========================================================================
// MAP JOINED ORDER
// ==========================================================================
//
// Maps the result of get_customer_orders().
//
// IMPORTANT:
// This function performs NO Supabase requests.
// Everything it needs has already been returned by the RPC.
//
// ==========================================================================

private mapJoinedOrder(
  row: any
): OrderModel {

  // ------------------------------------------------------------------------
  // ADDRESS
  // ------------------------------------------------------------------------

  const address: AddressModel = {

    id:
      row.address_id ??
      '',

    label:
      this.mapAddressLabel(
        row.address_label
      ),

    unitNumber:
      row.unit_number ??
      undefined,

    streetNumber:
      row.street_number ??
      undefined,

    streetName:
      row.street_name ??
      undefined,

    street:
      [
        row.unit_number,
        row.street_number,
        row.street_name,
      ]
        .filter(Boolean)
        .join(' '),

    suburb:
      row.suburb ??
      '',

    city:
      row.city ??
      '',

    province:
      row.province ??
      '',

    postalCode:
      row.postal_code ??
      '',

    coordinates:
      row.latitude != null &&
      row.longitude != null
        ? {
            lat:
              Number(row.latitude),

            lng:
              Number(row.longitude),
          }
        : undefined,
  };


  // ------------------------------------------------------------------------
  // PAYMENT
  // ------------------------------------------------------------------------
  //
  // payments DOES NOT contain payment_method_id.
  //
  // So don't attempt to read it.
  //

  const paymentMethod: PaymentMethodModel = {

    id:
      row.payment_id ??
      'unknown',

    type:
      'card',

    label:
      row.payment_status ??
      'Payment',

    isDefault:
      false,
  };


  // ------------------------------------------------------------------------
  // DRIVER
  // ------------------------------------------------------------------------

  let driver:
    DriverModel |
    undefined;


  if (row.driver_id) {

    driver = {

      id:
        row.driver_id,

      name:
        row.driver_name ??
        'Driver',

      phone:
        row.driver_phone ??
        '',

      rating:
        Number(
          row.driver_rating ??
          5
        ),

      totalDeliveries:
        0,

      vehicleReg:
        '',

      vehicleModel:
        '',

      vehicleColor:
        '',

      stationName:
        '',

      isOnDuty:
        row.driver_status ===
        'Online',

      isApproved:
        true,

      coordinates: {
        lat: 0,
        lng: 0,
      },

      dailyTarget:
        0,

      todayEarnings:
        0,

      weekEarnings:
        0,

      monthEarnings:
        0,

      documents:
        [],
    };
  }


  // ------------------------------------------------------------------------
  // AMOUNTS
  // ------------------------------------------------------------------------

  const litres =
    Number(
      row.volume_litres ??
      0
    );


  const fuelSubtotal =
    Number(
      row.fuel_subtotal ??
      row.rand_amount ??
      0
    );


  const pricePerLitre =
    litres > 0
      ? +(
          fuelSubtotal /
          litres
        ).toFixed(2)
      : 0;


  const deliveryFee =
    Number(
      row.delivery_fee ??
      49
    );


  const vatAmount =
    Number(
      row.vat_amount ??
      0
    );


  const totalAmount =
    Number(
      row.total_amount ??
      (
        fuelSubtotal +
        deliveryFee
      )
    );


  // ------------------------------------------------------------------------
  // RETURN
  // ------------------------------------------------------------------------

  return {

    id:
      row.order_id,

    orderNumber:
      this.createOrderNumber(
        row.order_id
      ),

    status:
      this.mapOrderStatus(
        row.status
      ),

    item: {

      fuelType:
        (
          row.fuel_type_name ??
          'Unknown Fuel'
        ) as FuelRateModel['type'],

      litres,

      pricePerLitre,

      subtotal:
        fuelSubtotal,
    },

    deliveryAddress:
      address,

    scheduledAt:
      row.scheduled_date_time ??
      null,

    paymentMethod,

    deliveryFee,

    vatAmount,

    totalAmount,

    driver,

    pin:
      row.delivery_pin ??
      '',

    podPhotoUrl:
      undefined,

    createdAt:
      row.placed_at,

    deliveredAt:
      row.delivered_at ??
      undefined,

    estimatedArrivalMinutes:
      0,

    distanceKm:
      0,

    rating:
      row.review_rating ??
      undefined,

    ratingComment:
      row.review_comment ??
      undefined,
  };
}

  // ==========================================================================
// GET ALL ORDERS
// ==========================================================================
//
// ONE SUPABASE REQUEST.
//
// The RPC returns orders together with fuel type, address, payment,
// driver and review information.
//
// ==========================================================================

public async getOrders(): Promise<OrderModel[]> {

  const {
    data,
    error,
  } = await supabase.rpc(
    'get_customer_orders'
  );

  if (error) {

    console.error(
      'OrderRepository: failed to fetch customer orders:',
      error
    );

    throw error;
  }


  const orders =
    (data ?? []).map(
      (row: any) =>
        this.mapJoinedOrder(row)
    );


  this.orders =
    orders;


  return [
    ...orders,
  ];
}


  // ==========================================================================
  // GET RECENT ORDERS
  // ==========================================================================
  //
  // Returns orders placed within the specified number of days.
  //
  // HomeScreen will call:
  //
  //     getRecentOrders(30)
  //
  // ==========================================================================

public async getRecentOrders(days: number = 14): Promise<OrderModel[]> {
  const cutoffDate = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000,
  );

  console.log(
    `OrderRepository: fetching orders from the last ${days} days`,
  );

  const { data, error } = await supabase.rpc(
    'get_customer_orders',
  );

  if (error) {
    console.error(
      'OrderRepository: failed to fetch recent orders:',
      error,
    );
    throw error;
  }

  const recentRows = (data ?? []).filter((row: any) => {
    if (!row.placed_at) {
      return false;
    }

    return new Date(row.placed_at) >= cutoffDate;
  });

  const orders = recentRows.map((row: any) =>
    this.mapJoinedOrder(row),
  );

  this.orders = orders;

  console.log(
    `OrderRepository: ${orders.length} orders found in the last ${days} days`,
  );

  return [...orders];
}

public async getAllAdminOrders(): Promise<OrderModel[]> {
  const { data, error } = await supabase.rpc(
    'get_all_admin_orders'
  );

  if (error) {
    console.error(
      'Failed to fetch admin orders:',
      error
    );

    throw error;
  }

  const orders: OrderModel[] = (data || []).map(
    (row: any) => {
      const latitude =
        row.latitude !== null &&
        row.latitude !== undefined
          ? Number(row.latitude)
          : undefined;

      const longitude =
        row.longitude !== null &&
        row.longitude !== undefined
          ? Number(row.longitude)
          : undefined;

      const litres = Number(
        row.litres ??
        row.volume_litres ??
        0
      );

      const totalAmount = Number(
        row.totalZAR ??
        row.totalAmount ??
        row.total_amount ??
        row.rand_amount ??
        0
      );

      const deliveryFee = Number(
        row.deliveryFee ??
        row.delivery_fee ??
        0
      );

      const vatAmount = Number(
        row.vatAmount ??
        row.vat_amount ??
        0
      );

      const pricePerLitre =
        litres > 0
          ? Number(
              (
                Number(
                  row.pricePerLitre ??
                  row.price_per_litre ??
                  0
                )
              ).toFixed(2)
            )
          : 0;

      const deliveryAddress: AddressModel = {
        id:
          row.addressId ??
          row.address_id ??
          '',

        label:
          this.mapAddressLabel(
            row.addressLabel ??
            row.address_label
          ),

        unitNumber:
          row.unitNumber ??
          row.unit_number ??
          undefined,

        streetNumber:
          row.streetNumber ??
          row.street_number ??
          undefined,

        streetName:
          row.streetName ??
          row.street_name ??
          undefined,

        street:
          row.addressText ??
          row.address_text ??
          '',

        suburb:
          row.suburb ??
          '',

        city:
          row.city ??
          '',

        province:
          row.province ??
          '',

        postalCode:
          row.postalCode ??
          row.postal_code ??
          '',

        coordinates:
          latitude !== undefined &&
          longitude !== undefined
            ? {
                lat: latitude,
                lng: longitude,
              }
            : undefined,
      };

      const paymentMethod: PaymentMethodModel = {
        id:
          row.paymentId ??
          row.payment_id ??
          'unknown',

        type: 'card',

        label:
          row.paymentStatus ??
          row.payment_status ??
          'Payment',

        isDefault: false,
      };

      return {
        id:
          row.id ??
          row.order_id,

        orderNumber:
          row.orderNumber ??
          row.order_number ??
          row.id ??
          row.order_id,

        status:
          this.mapOrderStatus(
            row.status
          ),

        item: {
          fuelType:
            (
              row.fuelType ??
              row.fuel_type ??
              'Unknown Fuel'
            ) as FuelRateModel['type'],

          litres,

          pricePerLitre,

          subtotal:
            Number(
              row.totalZAR ??
              row.total_amount ??
              row.rand_amount ??
              0
            ),
        },

        // IMPORTANT:
        // Coordinates belong directly on OrderModel.
        latitude,
        longitude,

        deliveryAddress,

        scheduledAt:
          row.scheduledAt ??
          row.scheduled_at ??
          row.scheduled_date_time ??
          null,

        paymentMethod,

        deliveryFee,

        vatAmount,

        totalAmount,

        driverName:
          row.driverName ??
          row.driver_name ??
          undefined,

        customerName:
          row.customerName ??
          row.customer_name ??
          undefined,

        phone:
          row.phone ??
          row.phone_number ??
          undefined,

        pin:
          row.deliveryPin ??
          row.delivery_pin ??
          '',

        createdAt:
          row.createdAt ??
          row.created_at ??
          row.placedAt ??
          row.placed_at ??
          new Date().toISOString(),

        deliveredAt:
          row.deliveredAt ??
          row.delivered_at ??
          undefined,

        estimatedArrivalMinutes: 0,

        distanceKm: 0,

        rating:
          row.rating ??
          row.review_rating ??
          undefined,

        ratingComment:
          row.ratingComment ??
          row.rating_comment ??
          row.review_comment ??
          undefined,
      };
    }
  );

  return orders;
}

  public async getKPISummary(): Promise<KPISummary | null> {
    const { data, error } = await supabase.rpc('get_kpi_summary');
    if (error) {
      console.error('Failed to fetch KPI summary:', error);
      return null;
    }
    return data as KPISummary;
  }


  // ==========================================================================
  // GET ORDER BY ID
  // ==========================================================================

// ==========================================================================
// GET ORDER BY ID
// ==========================================================================
//
// Uses get_customer_orders() so the order is returned with:
//
// - Fuel type
// - Delivery address
// - Payment information
// - Driver information
// - Review information
//
// IMPORTANT:
// mapJoinedOrder() performs NO additional Supabase requests.
//
// This prevents Order Details from triggering separate requests for:
// addresses, payments, reviews, fuel types, drivers, etc.
//
// ==========================================================================

public async getOrderById(
  id: string
): Promise<OrderModel | null> {

  if (!id) {
    console.warn(
      'OrderRepository: getOrderById called without an order ID.'
    );

    return null;
  }

  // ------------------------------------------------------------------------
  // Check local cache first
  // ------------------------------------------------------------------------

  const cachedOrder =
    this.orders.find(
      order =>
        order.id === id
    );

  if (cachedOrder) {

    // Keep the active order reference up to date
    if (this.activeOrder?.id === id) {
      this.activeOrder = cachedOrder;
    }

    return cachedOrder;
  }


  // ------------------------------------------------------------------------
  // Fetch orders using the existing joined RPC
  // ------------------------------------------------------------------------

  const {
    data,
    error,
  } = await supabase.rpc(
    'get_customer_orders'
  );

  if (error) {

    console.error(
      'OrderRepository: failed to fetch order:',
      error
    );

    throw error;
  }


  // ------------------------------------------------------------------------
  // Find requested order
  // ------------------------------------------------------------------------

  const row =
    (data ?? []).find(
      (item: any) =>
        item.order_id === id
    );


  if (!row) {
    return null;
  }


  // ------------------------------------------------------------------------
  // Map joined result
  // ------------------------------------------------------------------------
  //
  // IMPORTANT:
  // mapJoinedOrder() does NOT call Supabase.
  //

  const order =
    this.mapJoinedOrder(
      row
    );


  // ------------------------------------------------------------------------
  // Update cache
  // ------------------------------------------------------------------------

  const existingIndex =
    this.orders.findIndex(
      existing =>
        existing.id === id
    );


  if (existingIndex >= 0) {

    this.orders[existingIndex] =
      order;

  } else {

    this.orders.push(
      order
    );
  }


  // ------------------------------------------------------------------------
  // Update active order
  // ------------------------------------------------------------------------

  if (
    this.activeOrder?.id === id
  ) {
    this.activeOrder =
      order;
  }


  return order;
}

  // ==========================================================================
  // GET ACTIVE ORDER
  // ==========================================================================

  public async getActiveOrder(): Promise<OrderModel | null> {

    const userId =
      await this.getCurrentUserId();

    const activeStatuses: OrderStatus[] = [
      'PENDING_PAYMENT',
      'PAID',
      'FINDING_DRIVER',
      'ACCEPTED',
      'NAVIGATING',
      'ARRIVED',
      'DISPENSING',
    ];

    const {
      data,
      error,
    } = await supabase
      .from('orders')
      .select('*')
      .eq(
        'customer_id',
        userId
      )
      .in(
        'status',
        activeStatuses
      )
      .order(
        'placed_at',
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        'OrderRepository: failed to fetch active order:',
        error
      );

      throw error;
    }

    if (!data) {
      this.activeOrder = null;

      return null;
    }

    const order =
      await this.mapOrder(
        data
      );

    this.activeOrder =
      order;

    return order;
  }


  // ==========================================================================
  // CREATE ORDER
  // ==========================================================================

  public async createOrder(data: {
    fuelType: FuelRateModel['type'];
    litres: number;
    pricePerLitre: number;
    deliveryAddress: AddressModel;
    scheduledAt: string | null;
    paymentMethod: PaymentMethodModel;
  }): Promise<OrderModel> {

    const userId =
      await this.getCurrentUserId();


    // ------------------------------------------------------------------------
    // Find fuel type
    // ------------------------------------------------------------------------

    const {
      data: fuelType,
      error: fuelTypeError,
    } = await supabase
      .from('fuel_types')
      .select(
        'fuel_type_id, name'
      )
      .eq(
        'name',
        data.fuelType
      )
      .maybeSingle();

    if (fuelTypeError) {
      throw fuelTypeError;
    }

    if (!fuelType) {
      throw new Error(
        `Fuel type "${data.fuelType}" was not found.`
      );
    }


    // ------------------------------------------------------------------------
    // Calculate payment
    // ------------------------------------------------------------------------

    const fuelSubtotal =
      +(
        data.pricePerLitre *
        data.litres
      ).toFixed(2);

    const deliveryFee =
      49.00;

    const serviceFee =
      0.00;

    const totalAmount =
      +(
        fuelSubtotal +
        deliveryFee +
        serviceFee
      ).toFixed(2);

    const vatAmount =
      +(
        totalAmount *
        0.15
      ).toFixed(2);


    // ------------------------------------------------------------------------
    // Generate delivery PIN
    // ------------------------------------------------------------------------

    const deliveryPin =
      String(
        Math.floor(
          1000 +
            Math.random() *
              9000
        )
      );


    // ------------------------------------------------------------------------
    // Create order
    // ------------------------------------------------------------------------

    const {
      data: createdOrder,
      error,
    } = await supabase.rpc(
      'create_order',
      {
        p_customer_id:
          userId,

        p_driver_id:
          null,

        p_address_id:
          data.deliveryAddress.id,

        p_fuel_type_id:
          fuelType.fuel_type_id,

        p_order_method:
          'APP',

        p_volume_litres:
          data.litres,

        p_rand_amount:
          fuelSubtotal,

        p_delivery_type:
          data.scheduledAt
            ? 'Scheduled'
            : 'Deliver Now',

        p_scheduled_date_time:
          data.scheduledAt,

        // State Pattern initial state
        p_status:
          'PENDING_PAYMENT',

        p_delivery_pin:
          deliveryPin,
      }
    );

    if (error) {
      console.error(
        'OrderRepository: create_order failed:',
        error
      );

      throw error;
    }

    const orderRow =
      Array.isArray(
        createdOrder
      )
        ? createdOrder[0]
        : createdOrder;

    if (!orderRow) {
      throw new Error(
        'Supabase did not return the created order.'
      );
    }


    // ------------------------------------------------------------------------
    // Create payment
    // ------------------------------------------------------------------------

    const {
      error: paymentError,
    } = await supabase.rpc('create_payment', {
    p_order_id: orderRow.order_id,
    p_fuel_subtotal: fuelSubtotal,
    p_delivery_fee: deliveryFee,
    p_service_fee: serviceFee,
    p_vat_amount: vatAmount,
    p_total_amount: totalAmount,
    p_status: 'PENDING',
  });

    if (paymentError) {
      console.error(
        'OrderRepository: create_payment failed:',
        paymentError
      );

      throw paymentError;
    }


    // ------------------------------------------------------------------------
    // Retrieve actual order from Supabase
    // ------------------------------------------------------------------------

    const newOrder =
      await this.getOrderById(
        orderRow.order_id
      );

    if (!newOrder) {
      throw new Error(
        'Order was created but could not be retrieved.'
      );
    }


    this.activeOrder =
      newOrder;


    // ------------------------------------------------------------------------
    // Notify observers
    // ------------------------------------------------------------------------

    realtimeHub
      .getOrderChannel(
        newOrder.id
      )
      .notify(newOrder);

    realtimeHub
      .getOrderChannel()
      .notify(newOrder);


    return newOrder;
  }


  // ==========================================================================
  // STATE PATTERN VALIDATION
  // ==========================================================================

  private validateOrderTransition(
    order: OrderModel,
    targetStatus: OrderStatus,
    extra?: {
      driver?: DriverModel;
      podPhotoUrl?: string;
    }
  ) {

    const context: OrderContext = {
      id:
        order.id,

      status:
        order.status,

      pin:
        order.pin,

      driverId:
        extra?.driver?.id ??
        order.driver?.id,

      podPhotoUrl:
        extra?.podPhotoUrl ??
        order.podPhotoUrl,
    };


    return OrderStateMachine.validateTransition(
      order.status,
      targetStatus,
      context
    );
  }


  // ==========================================================================
  // UPDATE ORDER STATUS
  // ==========================================================================
  //
  // IMPORTANT:
  // The State Pattern is checked BEFORE Supabase is updated.
  //
  // ==========================================================================

  public async updateOrderStatus(
    orderId: string,
    targetStatus: OrderStatus,
    extra?: {
      driver?: DriverModel;
      podPhotoUrl?: string;
    }
  ): Promise<{
    success: boolean;
    order?: OrderModel;
    error?: string;
  }> {

    const order =
      await this.getOrderById(
        orderId
      );

    if (!order) {
      return {
        success: false,
        error:
          'Order not found.',
      };
    }


    // ------------------------------------------------------------------------
    // STATE PATTERN VALIDATION
    // ------------------------------------------------------------------------

    const validation =
      this.validateOrderTransition(
        order,
        targetStatus,
        extra
      );

    if (!validation.allowed) {

      console.warn(
        'OrderRepository: state transition rejected:',
        {
          orderId,
          currentStatus:
            order.status,
          targetStatus,
          reason:
            validation.errorMessage,
        }
      );

      return {
        success: false,
        error:
          validation.errorMessage ??
          'Order status transition is not allowed.',
      };
    }


    // ------------------------------------------------------------------------
    // Determine delivered timestamp
    // ------------------------------------------------------------------------

    const deliveredAt =
      targetStatus === 'COMPLETED'
        ? new Date().toISOString()
        : order.deliveredAt ??
          null;


    // ------------------------------------------------------------------------
    // Get fuel type ID
    // ------------------------------------------------------------------------

    const fuelTypeId =
      await this.getFuelTypeId(
        order.item.fuelType
      );


    // ------------------------------------------------------------------------
    // Update Supabase
    // ------------------------------------------------------------------------

    const {
      data,
      error,
    } = await supabase.rpc(
      'update_order',
      {
        p_order_id:
          order.id,

        p_customer_id:
          await this.getCurrentUserId(),

        p_driver_id:
          extra?.driver?.id ??
          order.driver?.id ??
          null,

        p_address_id:
          order.deliveryAddress.id,

        p_fuel_type_id:
          fuelTypeId,

        p_order_method:
          'APP',

        p_volume_litres:
          order.item.litres,

        p_rand_amount:
          order.item.subtotal,

        p_delivery_type:
          order.scheduledAt
            ? 'Scheduled'
            : 'Deliver Now',

        p_scheduled_date_time:
          order.scheduledAt,

        p_status:
          targetStatus,

        p_delivery_pin:
          order.pin,

        p_delivered_at:
          deliveredAt,
      }
    );

    if (error) {
      console.error(
        'OrderRepository: update_order failed:',
        error
      );

      return {
        success: false,
        error:
          error.message,
      };
    }


    // ------------------------------------------------------------------------
    // Retrieve updated order
    // ------------------------------------------------------------------------

    const updatedOrder =
      await this.getOrderById(
        orderId
      );

    if (!updatedOrder) {
      return {
        success: false,
        error:
          'Order was updated but could not be retrieved.',
      };
    }


    // ------------------------------------------------------------------------
    // Update active order
    // ------------------------------------------------------------------------

    if (
      this.activeOrder?.id ===
      orderId
    ) {
      this.activeOrder =
        updatedOrder;
    }


    // ------------------------------------------------------------------------
    // Notify observers
    // ------------------------------------------------------------------------

    realtimeHub
      .getOrderChannel(
        orderId
      )
      .notify(updatedOrder);

    realtimeHub
      .getOrderChannel()
      .notify(updatedOrder);


    return {
      success: true,
      order:
        updatedOrder,
    };
  }


  // ==========================================================================
  // CONFIRM DELIVERY WITH PIN
  // ==========================================================================

  public async confirmDeliveryWithPin(
    orderId: string,
    pin: string,
    photoUrl?: string
  ): Promise<{
    success: boolean;
    order?: OrderModel;
    error?: string;
  }> {

    const order =
      await this.getOrderById(
        orderId
      );

    if (!order) {
      return {
        success: false,
        error:
          'Order not found.',
      };
    }


    // ------------------------------------------------------------------------
    // Validate PIN
    // ------------------------------------------------------------------------

    if (
      pin.trim() !==
      order.pin.trim()
    ) {
      return {
        success: false,
        error:
          'Security Warning: Incorrect 4-digit PIN provided by customer.',
      };
    }


    // ------------------------------------------------------------------------
    // Validate State Pattern
    // ------------------------------------------------------------------------

    const validation =
      this.validateOrderTransition(
        order,
        'COMPLETED',
        {
          podPhotoUrl:
            photoUrl ??
            order.podPhotoUrl,
        }
      );


    if (!validation.allowed) {
      return {
        success: false,
        error:
          validation.errorMessage ??
          'Order cannot be completed.',
      };
    }


    // ------------------------------------------------------------------------
    // Optional Edge Function validation
    // ------------------------------------------------------------------------

    try {

      const {
        data,
        error,
      } =
        await supabaseService.invokeFunction(
          'confirm-delivery',
          {
            order_id:
              orderId,

            delivery_pin:
              pin,

            photo_url:
              photoUrl,

            driver_id:
              order.driver?.id,
          }
        );


      if (
        error ||
        (
          data &&
          !data.success
        )
      ) {
        console.warn(
          'OrderRepository: delivery Edge Function returned an error.',
          error
        );
      }

    } catch (error) {

      console.warn(
        'OrderRepository: confirm-delivery Edge Function unavailable:',
        error
      );
    }


    // ------------------------------------------------------------------------
    // Update actual order
    // ------------------------------------------------------------------------

    const result =
      await this.updateOrderStatus(
        orderId,
        'COMPLETED',
        {
          podPhotoUrl:
            photoUrl,
        }
      );


    if (!result.success) {
      return result;
    }


    // ------------------------------------------------------------------------
    // Award FuelPoints
    // ------------------------------------------------------------------------

    try {

      await userRepository.addPoints(
        80
      );

    } catch (error) {

      console.error(
        'OrderRepository: failed to award FuelPoints:',
        error
      );

    }


    return result;
  }


  // ==========================================================================
  // RATE ORDER
  // ==========================================================================

  public async rateOrder(
    orderId: string,
    rating: number,
    comment?: string
  ): Promise<boolean> {

    if (
      rating < 1 ||
      rating > 5
    ) {
      return false;
    }


    const order =
      await this.getOrderById(
        orderId
      );

    if (!order) {
      return false;
    }


    // Only completed orders can be reviewed
    if (
      order.status !==
      'COMPLETED'
    ) {
      console.warn(
        'OrderRepository: cannot rate incomplete order.'
      );

      return false;
    }


    const userId =
      await this.getCurrentUserId();


    const driverId =
      order.driver?.id ??
      null;


    const {
      error,
    } = await supabase.rpc(
      'create_review',
      {
        p_order_id:
          orderId,

        p_customer_id:
          userId,

        p_driver_id:
          driverId,

        p_rating:
          rating,

        p_comment:
          comment ??
          null,

        p_status:
          'Published',
      }
    );


    if (error) {

      console.error(
        'OrderRepository: failed to create review:',
        error
      );

      return false;
    }


    order.rating =
      rating;

    order.ratingComment =
      comment;


    const index =
      this.orders.findIndex(
        o =>
          o.id ===
          orderId
      );


    if (index !== -1) {

      this.orders[index] = {
        ...order,
      };

    }


    realtimeHub
      .getOrderChannel(
        order.id
      )
      .notify(order);


    return true;
  }


  // ==========================================================================
  // DELETE ORDER
  // ==========================================================================

  public async deleteOrder(
    orderId: string
  ): Promise<boolean> {

    const {
      data,
      error,
    } = await supabase.rpc(
      'delete_order',
      {
        p_order_id:
          orderId,
      }
    );


    if (error) {

      console.error(
        'OrderRepository: failed to delete order:',
        error
      );

      return false;
    }


    return data === true;
  }


  // ==========================================================================
  // GET FUEL TYPE ID
  // ==========================================================================

  private async getFuelTypeId(
    fuelTypeName: string
  ): Promise<string> {

    const {
      data,
      error,
    } = await supabase
      .from('fuel_types')
      .select(
        'fuel_type_id'
      )
      .eq(
        'name',
        fuelTypeName
      )
      .maybeSingle();


    if (error) {
      throw error;
    }


    if (!data) {
      throw new Error(
        `Fuel type "${fuelTypeName}" was not found.`
      );
    }


    return data.fuel_type_id;
  }


  // ==========================================================================
  // MAP ORDERS
  // ==========================================================================

  // ==========================================================================
  // MAP ORDERS
  // ==========================================================================

  private async mapOrders(
    rows: any[]
  ): Promise<OrderModel[]> {  

    return rows.map((row) =>
      this.mapJoinedOrder(row)
    );
  }



  // ==========================================================================
  // MAP SINGLE ORDER
  // ==========================================================================

  private async mapOrder(
    row: any
  ): Promise<OrderModel> {


    // ------------------------------------------------------------------------
    // Fuel type
    // ------------------------------------------------------------------------

    let fuelTypeName =
      'Unknown Fuel';


    if (
      row.fuel_type_id
    ) {

      const {
        data,
        error,
      } =
        await supabase
          .from('fuel_types')
          .select(
            'name'
          )
          .eq(
            'fuel_type_id',
            row.fuel_type_id
          )
          .maybeSingle();


      if (
        !error &&
        data
      ) {

        fuelTypeName =
          data.name;

      }
    }


    // ------------------------------------------------------------------------
    // Address
    // ------------------------------------------------------------------------

    let address:
      AddressModel = {

      id:
        row.address_id ??
        '',

      label:
        'Other',

      street:
        'Address unavailable',

      suburb:
        '',

      city:
        '',

      province:
        '',

      postalCode:
        '',
    };


    if (
      row.address_id
    ) {

      const {
        data,
        error,
      } =
        await supabase
          .from('addresses')
          .select('*')
          .eq(
            'address_id',
            row.address_id
          )
          .maybeSingle();


      if (
        !error &&
        data
      ) {

        address = {

          id:
            data.address_id,

          label:
            this.mapAddressLabel(
              data.label
            ),

          street:
            [
              data.unit_number,
              data.street_number,
              data.street_name,
            ]
              .filter(Boolean)
              .join(' '),

          suburb:
            data.suburb ??
            '',

          city:
            data.city ??
            '',

          province:
            data.province ??
            '',

          postalCode:
            data.postal_code ??
            '',
        };
      }
    }


    // ------------------------------------------------------------------------
    // Payment
    // ------------------------------------------------------------------------

    let paymentMethod:
      PaymentMethodModel = {

      id:
        'unknown',

      type:
        'card',

      label:
        'Payment',

      isDefault:
        false,
    };


    let deliveryFee =
      49;

    let vatAmount =
      0;

    let totalAmount =
      Number(
        row.rand_amount ??
        0
      );


    const {
      data: payment,
    } =
      await supabase
        .from('payments')
        .select('*')
        .eq(
          'order_id',
          row.order_id
        )
        .maybeSingle();


    if (payment) {

      deliveryFee =
        Number(
          payment.delivery_fee ??
          49
        );

      vatAmount =
        Number(
          payment.vat_amount ??
          0
        );

      totalAmount =
        Number(
          payment.total_amount ??
          row.rand_amount ??
          0
        );


      paymentMethod = {

        id:
          payment.payment_method_id ??
          'unknown',

        type:
          this.mapPaymentType(
            payment.payment_method_id
          ),

        label:
          payment.payment_method_id ??
          'Payment',

        isDefault:
          false,
      };
    }


    // ------------------------------------------------------------------------
    // Driver
    // ------------------------------------------------------------------------

    let driver:
      DriverModel |
      undefined;


    if (
      row.driver_id
    ) {

      const {
        data:
          driverData,
      } =
        await supabase
          .from('drivers')
          .select('*')
          .eq(
            'driver_id',
            row.driver_id
          )
          .maybeSingle();


      if (driverData) {

        const {
          data:
            userData,
        } =
          await supabase
            .from('users')
            .select(
              'full_name, phone_number'
            )
            .eq(
              'user_id',
              row.driver_id
            )
            .maybeSingle();


        driver = {

          id:
            driverData.driver_id,

          name:
            userData?.full_name ??
            'Driver',

          phone:
            userData?.phone_number ??
            '',

          rating:
            Number(
              driverData.rating ??
              5
            ),

          totalDeliveries:
            0,

          vehicleReg:
            '',

          vehicleModel:
            '',

          vehicleColor:
            '',

          stationName:
            '',

          isOnDuty:
            driverData.status ===
            'Online',

          isApproved:
            true,

          coordinates: {
            lat: 0,
            lng: 0,
          },

          dailyTarget:
            0,

          todayEarnings:
            0,

          weekEarnings:
            0,

          monthEarnings:
            0,

          documents:
            [],
        };
      }
    }


    // ------------------------------------------------------------------------
    // Review
    // ------------------------------------------------------------------------

    let rating:
      number | undefined;

    let ratingComment:
      string | undefined;


    const {
      data:
        review,
    } =
      await supabase
        .from('reviews')
        .select(
          'rating, comment'
        )
        .eq(
          'order_id',
          row.order_id
        )
        .maybeSingle();


    if (review) {

      rating =
        review.rating ??
        undefined;

      ratingComment =
        review.comment ??
        undefined;
    }


    // ------------------------------------------------------------------------
    // Order amounts
    // ------------------------------------------------------------------------

    const litres =
      Number(
        row.volume_litres ??
        0
      );


    const fuelSubtotal =
      payment
        ? Number(
            payment.fuel_subtotal ??
            row.rand_amount ??
            0
          )
        : Number(
            row.rand_amount ??
            0
          );


    const pricePerLitre =
      litres > 0
        ? +(
            fuelSubtotal /
            litres
          ).toFixed(2)
        : 0;


    // ------------------------------------------------------------------------
    // Return OrderModel
    // ------------------------------------------------------------------------

    return {

      id:
        row.order_id,

      orderNumber:
        this.createOrderNumber(
          row.order_id
        ),

      status:
        this.mapOrderStatus(
          row.status
        ),

      item: {

        fuelType:
          fuelTypeName as
            FuelRateModel['type'],

        litres,

        pricePerLitre,

        subtotal:
          fuelSubtotal,
      },

      deliveryAddress:
        address,

      scheduledAt:
        row.scheduled_date_time ??
        null,

      paymentMethod,

      deliveryFee,

      vatAmount,

      totalAmount,

      driver,

      pin:
        row.delivery_pin ??
        '',

      createdAt:
        row.placed_at,

      deliveredAt:
        row.delivered_at ??
        undefined,

      estimatedArrivalMinutes:
        0,

      distanceKm:
        0,

      rating,

      ratingComment,
    };
  }


  // ==========================================================================
  // MAP DATABASE STATUS TO STATE MACHINE STATUS
  // ==========================================================================
private mapOrderStatus(status: string | null | undefined): OrderStatus {
  const normalized = String(status ?? "")
    .trim()
    .toUpperCase();

  switch (normalized) {
    case "PENDING_PAYMENT":
    case "PENDING":
      return "PENDING_PAYMENT";

    case "PAID":
      return "PAID";

    case "FINDING_DRIVER":
      return "FINDING_DRIVER";

    case "ACCEPTED":
      return "ACCEPTED";

    case "NAVIGATING":
    case "IN_TRANSIT":
      return "NAVIGATING";

    case "ARRIVED":
      return "ARRIVED";

    case "DISPENSING":
      return "DISPENSING";

    case "COMPLETED":
    case "DELIVERED":
      return "COMPLETED";

    case "CANCELLED":
    case "CANCELED":
      return "CANCELLED";

    default:
      console.warn(
        `OrderRepository: unknown order status "${status}". Falling back to PENDING_PAYMENT.`
      );

      return "PENDING_PAYMENT";
  }
}


  // ==========================================================================
  // ORDER NUMBER
  // ==========================================================================

  private createOrderNumber(
    orderId: string
  ): string {

    if (!orderId) {
      return 'FN-0000';
    }


    const cleaned =
      orderId.replace(
        /-/g,
        ''
      );


    return `FN-${cleaned
      .slice(-4)
      .toUpperCase()}`;
  }


  // ==========================================================================
  // ADDRESS LABEL
  // ==========================================================================

  private mapAddressLabel(
    label:
      | string
      | null
      | undefined
  ): AddressModel['label'] {

    switch (label) {

      case 'Home':
        return 'Home';

      case 'Work':
        return 'Work';

      case 'Site A':
        return 'Site A';

      case 'Depot':
        return 'Depot';

      default:
        return 'Other';
    }
  }


  // ==========================================================================
  // PAYMENT TYPE
  // ==========================================================================

  private mapPaymentType(
    paymentMethodId:
      | string
      | null
      | undefined
  ): PaymentMethodModel['type'] {

    const value =
      (
        paymentMethodId ??
        ''
      ).toLowerCase();


    if (
      value.includes('eft')
    ) {
      return 'eft';
    }


    if (
      value.includes('mobile')
    ) {
      return 'mobile_money';
    }


    return 'card';
  }
}


// ============================================================================
// SINGLETON
// ============================================================================

export const orderRepository =
  OrderRepository.getInstance();