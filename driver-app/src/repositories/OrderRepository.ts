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
// DRIVER AVAILABLE ORDER MODEL
// ============================================================================

export interface AvailableOrderModel {
  id: string;
  fuelType: string;
  litres: number;
  address: string;
  suburb: string;
  customerInitials: string;
  distanceKm: number;
  estimatedMinutes: number;
  totalZAR: number;
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
  // GET CURRENT AUTHENTICATED USER ID
  // ==========================================================================
  //
  // Used by driver-side operations where the authenticated Supabase user
  // identity is required directly.
  //
  // ==========================================================================

  private async getAuthenticatedUserId(): Promise<string> {
    const {
      data: {
        user,
      },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    if (!user) {
      throw new Error(
        'No authenticated user found.'
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
  // GET AVAILABLE ORDERS
  // ==========================================================================
  //
  // Driver-side order discovery.
  //
  // Available orders are orders that:
  //
  // - Have not yet been assigned to a driver
  // - Are PAID or FINDING_DRIVER
  //
  // The returned shape matches AvailableOrdersScreen.
  //
  // ==========================================================================

  public async getAvailableOrders(): Promise<AvailableOrderModel[]> {

    const {
      data,
      error,
    } = await supabase
      .from('orders')
      .select(
        `
          order_id,
          customer_id,
          driver_id,
          volume_litres,
          rand_amount,
          status,
          address_id,
          fuel_type_id,
          fuel_types (
            name
          ),
          addresses (
            unit_number,
            street_number,
            street_name,
            suburb,
            city,
            latitude,
            longitude
          )
        `
      )
      .is(
        'driver_id',
        null
      )
      .in(
        'status',
        [
          'PAID',
          'FINDING_DRIVER',
        ]
      )
      .order(
        'placed_at',
        {
          ascending: false,
        }
      );

    if (error) {
      console.error(
        'OrderRepository: failed to fetch available orders:',
        error
      );

      throw error;
    }

    const availableOrders: AvailableOrderModel[] =
      (data ?? []).map(
        (row: any) => {

          const address =
            Array.isArray(row.addresses)
              ? row.addresses[0]
              : row.addresses;

          const fuelType =
            Array.isArray(row.fuel_types)
              ? row.fuel_types[0]
              : row.fuel_types;

              const litres =
              Number(
                row.volume_litres ??
                0
              );
            
            const totalZAR =
              Number(
                row.rand_amount ??
                0
              );
            
            const customerInitials =
              'C.';
            
            const addressParts = [
              address?.unit_number,
              address?.street_number,
              address?.street_name,
            ].filter(Boolean);
            
            return {
              id:
                row.order_id,
            
              fuelType:
                fuelType?.name ??
                'Unknown Fuel',
            
              litres,
            
              address:
                addressParts.join(' ') ||
                'Address unavailable',
            
              suburb:
                address?.suburb ??
                '',
            
              customerInitials,
            
              distanceKm:
                0,
            
              estimatedMinutes:
                0,
            
              totalZAR,
            };
        }
      );

    return availableOrders;
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

    console.log(
      `OrderRepository: fetching orders from the last ${days} days`,
    );

    const {
      data,
      error,
    } =
      await supabase.rpc(
        'get_customer_orders'
      );

    if (error) {

      console.error(
        'OrderRepository: failed to fetch recent orders:',
        error,
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
          this.mapJoinedOrder(row),
      );

    this.orders =
      orders;

    console.log(
      `OrderRepository: ${orders.length} orders found in the last ${days} days`,
    );

    return [
      ...orders
    ];
  }


  // ==========================================================================
  // GET ORDER BY ID
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


    const cachedOrder =
      this.orders.find(
        order =>
          order.id === id
      );

    if (cachedOrder) {

      if (
        this.activeOrder?.id === id
      ) {
        this.activeOrder =
          cachedOrder;
      }

      return cachedOrder;
    }


    const {
      data,
      error,
    } =
      await supabase.rpc(
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
    } =
      await supabase
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

      this.activeOrder =
        null;

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


    const deliveryPin =
      String(
        Math.floor(
          1000 +
          Math.random() *
          9000
        )
      );


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


    const deliveredAt =
      targetStatus === 'COMPLETED'
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
  // CONFIRM DELIVERY COMPATIBILITY METHOD
  // ==========================================================================
  //
  // DeliveryPinScreen currently calls confirmDelivery().
  //
  // Keep the existing PIN-based implementation as the single source of
  // truth and expose this method as the screen-facing API.
  //
  // ==========================================================================

  public async confirmDelivery(
    orderId: string,
    pin: string,
    photoUrl?: string
  ): Promise<{
    success: boolean;
    order?: OrderModel;
    error?: string;
  }> {

    return this.confirmDeliveryWithPin(
      orderId,
      pin,
      photoUrl
    );
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
    } =
      await supabase.rpc(
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
    // Return
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
  //
  // DELIVERED is intentionally NOT included.
  //
  // The current State Pattern defines:
  //
  // DISPENSING -> COMPLETED
  //
  // There is no DELIVERED state in orderStateMachine.ts.
  //
  // ==========================================================================

  private mapOrderStatus(
    status:
      | string
      | null
      | undefined
  ): OrderStatus {

    const validStatuses: OrderStatus[] = [

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