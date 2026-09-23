import {
  OrderStateMachine,
  OrderStatus,
  OrderContext,
} from '../patterns/orderStateMachine';

import { realtimeHub } from '../patterns/realtimeObserver';

import {
  supabase,
  supabaseService,
} from '../services/supabase';

import {
  AddressModel,
  PaymentMethodModel,
  userRepository,
} from './UserRepository';

import {
  DriverModel,
} from './DriverRepository';

import {
  FuelRateModel,
} from './FuelRateRepository';


// ============================================================================
// CONSTANTS
// ============================================================================

const DELIVERY_FEE = 49;


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
  // Maps the result returned by get_customer_orders().
  //
  // The RPC already returns:
  //
  // - Order information
  // - Fuel information
  // - Address information
  // - Payment information
  // - Driver information
  // - Review information
  //
  // No additional Supabase requests are made here.
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
    // PAYMENT METHOD
    // ------------------------------------------------------------------------
    //
    // The current get_customer_orders() RPC does not return a payment method
    // identifier, so we use the payment status as the display label.
    //
    // ------------------------------------------------------------------------

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
          lat:
            Number(row.latitude ?? 0),

          lng:
            Number(row.longitude ?? 0),
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
    // ORDER AMOUNTS
    // ------------------------------------------------------------------------

    const litres =
      Number(
        row.volume_litres ??
        0
      );


    /*
     * Payment totals are authoritative when a payment row exists.
     *
     * When no payment row exists, rand_amount is treated as the ACTUAL
     * order total, including the R49 delivery fee.
     *
     * This is important for older/live orders where rand_amount is already
     * something like R1000.00. We must NOT display:
     *
     *     R1000 + R49
     *
     * Instead:
     *
     *     Fuel = R951
     *     Delivery = R49
     *     Total = R1000
     */

    const hasPayment =
      row.payment_id != null ||
      row.total_amount != null;


    let fuelSubtotal: number;

    let deliveryFee: number;

    let vatAmount: number;

    let totalAmount: number;


    if (hasPayment) {

      totalAmount =
        Number(
          row.total_amount ??
          row.rand_amount ??
          0
        );


      deliveryFee =
        DELIVERY_FEE;


      fuelSubtotal =
        Number(
          row.fuel_subtotal ??
          Math.max(
            totalAmount -
              deliveryFee,
            0
          )
        );


      vatAmount =
        Number(
          row.vat_amount ??
          0
        );

    } else {

      totalAmount =
        Number(
          row.rand_amount ??
          0
        );


      deliveryFee =
        DELIVERY_FEE;


      fuelSubtotal =
        Math.max(
          totalAmount -
            deliveryFee,
          0
        );


      vatAmount =
        Number(
          row.vat_amount ??
          0
        );
    }


    const pricePerLitre =
      litres > 0
        ? +(
            fuelSubtotal /
            litres
          ).toFixed(2)
        : 0;


    // ------------------------------------------------------------------------
    // RETURN MODEL
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
        row.pod_photo_url ??
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

  public async getRecentOrders(
    days: number = 14
  ): Promise<OrderModel[]> {

    const cutoffDate =
      new Date(
        Date.now() -
          days *
            24 *
            60 *
            60 *
            1000
      );


    const {
      data,
      error,
    } = await supabase.rpc(
      'get_customer_orders'
    );


    if (error) {

      console.error(
        'OrderRepository: failed to fetch recent orders:',
        error
      );

      throw error;
    }


    const recentRows =
      (data ?? []).filter(
        (row: any) => {

          if (!row.placed_at) {
            return false;
          }

          return (
            new Date(
              row.placed_at
            ) >= cutoffDate
          );
        }
      );


    const orders =
      recentRows.map(
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
  // GET ORDER BY ID
  // ==========================================================================
  //
  // IMPORTANT:
  // This method intentionally refreshes from Supabase every time.
  //
  // The customer app needs to see:
  //
  //     DISPENSING -> DELIVERED -> COMPLETED
  //
  // immediately after the driver/customer actions happen.
  //
  // Returning a cached OrderModel here caused Order Details to continue
  // displaying an older status.
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


    const row =
      (data ?? []).find(
        (item: any) =>
          item.order_id === id
      );


    if (!row) {

      return null;
    }


    const order =
      this.mapJoinedOrder(
        row
      );


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


    if (
      this.activeOrder?.id ===
      id
    ) {

      this.activeOrder =
        order;
    }


    return order;
  }


  // ==========================================================================
  // GET ACTIVE ORDER
  // ==========================================================================
  //
  // Uses get_customer_orders() so the returned model has the same mapping
  // and amount calculations as Order History and Order Details.
  //
  // ==========================================================================

  public async getActiveOrder(): Promise<OrderModel | null> {

    const activeStatuses:
      OrderStatus[] = [
        'PENDING_PAYMENT',
        'PAID',
        'FINDING_DRIVER',
        'ACCEPTED',
        'NAVIGATING',
        'ARRIVED',
        'DISPENSING',
        'DELIVERED',
      ];


    const {
      data,
      error,
    } = await supabase.rpc(
      'get_customer_orders'
    );


    if (error) {

      console.error(
        'OrderRepository: failed to fetch active order:',
        error
      );

      throw error;
    }


    const activeRows =
      (data ?? [])
        .filter(
          (row: any) =>
            activeStatuses.includes(
              this.mapOrderStatus(
                row.status
              )
            )
        )
        .sort(
          (
            a: any,
            b: any
          ) =>
            new Date(
              b.placed_at
            ).getTime() -
            new Date(
              a.placed_at
            ).getTime()
        );


    if (
      activeRows.length === 0
    ) {

      this.activeOrder =
        null;

      return null;
    }


    const order =
      this.mapJoinedOrder(
        activeRows[0]
      );


    this.activeOrder =
      order;


    const existingIndex =
      this.orders.findIndex(
        existing =>
          existing.id ===
          order.id
      );


    if (existingIndex >= 0) {

      this.orders[existingIndex] =
        order;

    } else {

      this.orders.push(
        order
      );
    }


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
    // FIND FUEL TYPE
    // ------------------------------------------------------------------------

    const {
      data: fuelType,
      error: fuelTypeError,
    } =
      await supabase
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
    // CALCULATE PAYMENT
    // ------------------------------------------------------------------------

    const fuelSubtotal =
      +(
        data.pricePerLitre *
        data.litres
      ).toFixed(2);


    const deliveryFee =
      DELIVERY_FEE;


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
    // GENERATE DELIVERY PIN
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
    // CREATE ORDER
    // ------------------------------------------------------------------------

    const {
      data: createdOrder,
      error,
    } =
      await supabase.rpc(
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

          /*
           * The payment row stores the authoritative total.
           *
           * Existing database structure expects rand_amount to contain the
           * fuel subtotal at order creation, so that behaviour is retained.
           */

          p_rand_amount:
            fuelSubtotal,

          p_delivery_type:
            data.scheduledAt
              ? 'Scheduled'
              : 'Deliver Now',

          p_scheduled_date_time:
            data.scheduledAt,

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
    // CREATE PAYMENT
    // ------------------------------------------------------------------------

    const {
      error: paymentError,
    } =
      await supabase.rpc(
        'create_payment',
        {
          p_order_id:
            orderRow.order_id,

          p_fuel_subtotal:
            fuelSubtotal,

          p_delivery_fee:
            deliveryFee,

          p_service_fee:
            serviceFee,

          p_vat_amount:
            vatAmount,

          p_total_amount:
            totalAmount,

          p_status:
            'PENDING',
        }
      );


    if (paymentError) {

      console.error(
        'OrderRepository: create_payment failed:',
        paymentError
      );

      throw paymentError;
    }


    // ------------------------------------------------------------------------
    // RETRIEVE ACTUAL ORDER
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
    // NOTIFY OBSERVERS
    // ------------------------------------------------------------------------

    realtimeHub
      .getOrderChannel(
        newOrder.id
      )
      .notify(
        newOrder
      );

    realtimeHub
      .getOrderChannel()
      .notify(
        newOrder
      );


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
  // Used for normal customer-side order state updates.
  //
  // Delivery PIN confirmation does NOT use this method anymore.
  // That flow is handled by the confirm-delivery Edge Function because the
  // Edge Function performs the final delivery confirmation.
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


    const validation =
      this.validateOrderTransition(
        order,
        targetStatus,
        extra
      );


    if (!validation.allowed) {

      return {
        success: false,

        error:
          validation.errorMessage ??
          'Invalid order status transition.',
      };
    }


    const deliveredAt =
      targetStatus === 'COMPLETED' ||
      targetStatus === 'DELIVERED'
        ? new Date().toISOString()
        : order.deliveredAt ??
          null;


    const fuelTypeId =
      await this.getFuelTypeId(
        order.item.fuelType
      );


    const {
      error,
    } =
      await supabase.rpc(
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

          /*
           * Keep rand_amount as the fuel subtotal for orders created by the
           * customer app. The payment row remains the source of truth for
           * the total amount.
           */

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


    if (
      this.activeOrder?.id ===
      orderId
    ) {

      this.activeOrder =
        updatedOrder;
    }


    realtimeHub
      .getOrderChannel(
        orderId
      )
      .notify(
        updatedOrder
      );

    realtimeHub
      .getOrderChannel()
      .notify(
        updatedOrder
      );


    return {
      success: true,

      order:
        updatedOrder,
    };
  }


  // ==========================================================================
  // CONFIRM DELIVERY WITH PIN
  // ==========================================================================
  //
  // Customer flow:
  //
  //     Driver completes delivery
  //              ↓
  //          DELIVERED
  //              ↓
  //     Customer enters PIN
  //              ↓
  //       confirm-delivery
  //              ↓
  //         COMPLETED
  //
  // The Edge Function:
  //
  // - validates the PIN
  // - updates the order to COMPLETED
  // - records delivered_at
  // - awards FuelPoints
  //
  // We therefore DO NOT call updateOrderStatus() afterwards.
  // Doing both caused duplicate/competing status updates and duplicate
  // FuelPoints.
  //
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
    // Order must be waiting for customer PIN confirmation
    // ------------------------------------------------------------------------
  
    if (
      order.status !==
      'DELIVERED'
    ) {
      return {
        success: false,
        error:
          `Delivery PIN cannot be confirmed while the order is ${order.status}.`,
      };
    }
  
  
    // ------------------------------------------------------------------------
    // Validate PIN
    // ------------------------------------------------------------------------
  
    const enteredPin =
      pin.trim();
  
    const deliveryPin =
      order.pin.trim();
  
    if (
      !enteredPin ||
      enteredPin.length !== 4
    ) {
      return {
        success: false,
        error:
          'Please enter the full 4-digit delivery PIN.',
      };
    }
  
    if (
      !deliveryPin ||
      enteredPin !== deliveryPin
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
    // Mark order as COMPLETED
    // ------------------------------------------------------------------------
  
    const result =
      await this.updateOrderStatus(
        orderId,
        'COMPLETED',
        {
          podPhotoUrl:
            photoUrl ??
            order.podPhotoUrl,
        }
      );
  
  
    if (!result.success) {
      return result;
    }
  
  
    // ------------------------------------------------------------------------
    // Award FuelPoints
    // ------------------------------------------------------------------------
  
  
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

  const normalizedRating =
    Math.round(Number(rating));

  if (
    !Number.isFinite(normalizedRating) ||
    normalizedRating < 1 ||
    normalizedRating > 5
  ) {
    console.warn(
      'OrderRepository: rating must be between 1 and 5.'
    );

    return false;
  }

  const order =
    await this.getOrderById(
      orderId
    );

  if (!order) {
    console.warn(
      'OrderRepository: order not found.'
    );

    return false;
  }

  if (
    order.status !==
    'COMPLETED'
  ) {
    console.warn(
      'OrderRepository: only completed orders can be reviewed.'
    );

    return false;
  }

  if (!order.driver?.id) {
    console.warn(
      'OrderRepository: completed order has no assigned driver.'
    );

    return false;
  }

  if (
    order.rating !== undefined &&
    order.rating !== null
  ) {
    console.warn(
      'OrderRepository: order has already been reviewed.'
    );

    return false;
  }

  const userId =
    await this.getCurrentUserId();

  const normalizedComment =
    comment?.trim() || null;

  const {
    data,
    error,
  } = await supabase.rpc(
    'create_review',
    {
      p_order_id:
        orderId,

      p_customer_id:
        userId,

      p_driver_id:
        order.driver.id,

      p_rating:
        normalizedRating,

      p_comment:
        normalizedComment,

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

  if (!data) {
    console.error(
      'OrderRepository: review RPC returned no review.'
    );

    return false;
  }

  order.rating =
    normalizedRating;

  order.ratingComment =
    normalizedComment ??
    undefined;

  const index =
    this.orders.findIndex(
      existingOrder =>
        existingOrder.id ===
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
    .notify(
      order
    );

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
    } =
      await supabase.rpc(
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


    this.orders =
      this.orders.filter(
        order =>
          order.id !==
          orderId
      );


    if (
      this.activeOrder?.id ===
      orderId
    ) {

      this.activeOrder =
        null;
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
    } =
      await supabase
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

  private async mapOrders(
    rows: any[]
  ): Promise<OrderModel[]> {

    return rows.map(
      (row) =>
        this.mapJoinedOrder(
          row
        )
    );
  }


  // ==========================================================================
  // MAP SINGLE ORDER
  // ==========================================================================
  //
  // Retained for compatibility with any existing code that may use this
  // internal mapper.
  //
  // The normal customer screens now use get_customer_orders() instead.
  //
  // ==========================================================================

  private async mapOrder(
    row: any
  ): Promise<OrderModel> {

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

          unitNumber:
            data.unit_number ??
            undefined,

          streetNumber:
            data.street_number ??
            undefined,

          streetName:
            data.street_name ??
            undefined,

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

          coordinates:
            data.latitude != null &&
            data.longitude != null
              ? {
                  lat:
                    Number(
                      data.latitude
                    ),

                  lng:
                    Number(
                      data.longitude
                    ),
                }
              : undefined,
        };
      }
    }


    // ------------------------------------------------------------------------
    // PAYMENT
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
      DELIVERY_FEE;


    let vatAmount =
      0;


    let totalAmount =
      Number(
        row.rand_amount ??
        0
      );


    let fuelSubtotal =
      Math.max(
        totalAmount -
          DELIVERY_FEE,
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
        .order(
          'charged_at',
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle();


    if (payment) {

      deliveryFee =
        DELIVERY_FEE;


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


      fuelSubtotal =
        Number(
          payment.fuel_subtotal ??
          Math.max(
            totalAmount -
              deliveryFee,
            0
          )
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
    // DRIVER
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
            lat:
              Number(
                driverData.latitude ??
                0
              ),

            lng:
              Number(
                driverData.longitude ??
                0
              ),
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
    // REVIEW
    // ------------------------------------------------------------------------

    let rating:
      number |
      undefined;


    let ratingComment:
      string |
      undefined;


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
    // RETURN
    // ------------------------------------------------------------------------

    const litres =
      Number(
        row.volume_litres ??
        0
      );


    const pricePerLitre =
      litres > 0
        ? +(
            fuelSubtotal /
            litres
          ).toFixed(2)
        : 0;


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

      podPhotoUrl:
        row.pod_photo_url ??
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

      rating,

      ratingComment,
    };
  }


  // ==========================================================================
  // MAP DATABASE STATUS TO STATE MACHINE STATUS
  // ==========================================================================

  private mapOrderStatus(
    status:
      | string
      | null
      | undefined
  ): OrderStatus {

    const validStatuses:
      OrderStatus[] = [
        'PENDING_PAYMENT',
        'PAID',
        'FINDING_DRIVER',
        'ACCEPTED',
        'NAVIGATING',
        'ARRIVED',
        'DISPENSING',
        'DELIVERED',
        'COMPLETED',
        'CANCELLED',
      ];


    if (
      status &&
      validStatuses.includes(
        status as OrderStatus
      )
    ) {

      return status as OrderStatus;
    }


    console.warn(
      `OrderRepository: unknown order status "${status}". Falling back to PENDING_PAYMENT.`
    );


    return 'PENDING_PAYMENT';
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