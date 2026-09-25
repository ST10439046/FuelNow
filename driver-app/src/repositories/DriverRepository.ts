import { supabase } from '../services/supabase';

export interface DriverDocumentModel {
  id: string;
  type:
    | "Driver's Licence"
    | 'Professional Driver Permit'
    | 'Hazmat Certificate'
    | 'Vehicle Permit';
  number: string;
  expiryDate: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

export interface DriverModel {
  id: string;
  name: string;
  phone: string;
  rating: number;
  totalDeliveries: number;
  vehicleReg: string;
  vehicleModel: string;
  vehicleColor: string;
  stationName: string;
  isOnDuty: boolean;
  isApproved: boolean;
  coordinates: {
    lat: number;
    lng: number;
  };
  dailyTarget: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  documents: DriverDocumentModel[];
}

export interface DriverEarningsEntry {
  id: string;
  address: string;
  date: string;
  litres: number;
  fuelType: string;
  amount: number;
}

export interface DriverEarnings {
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  dailyTarget: number;
  totalDeliveries: number;
  deliveryHistory: DriverEarningsEntry[];
}

export interface DriverActiveOrder {
  orderId: string;
  customerId: string;
  customerName: string;
  customerInitials?: string;

  fuelType: string;

  litres: number;
  volumeLitres?: number;

  deliveryType: string;

  scheduledDateTime?: string | null;
  placedAt?: string;

  suburb: string;
  fullAddress: string;
  address?: string;

  latitude?: number | null;
  longitude?: number | null;

  distanceKm?: number | null;
  estimatedMinutes?: number | null;

  status: string;

  fuelSubtotal: number;
  deliveryFee: number;
  serviceFee: number;
  vatAmount: number;

  totalZar: number;
  totalZAR?: number;
}

export interface DeliveryPinResult {
  orderId: string;
  deliveryPin: string;
  status: string;
}

export interface CompleteDriverOrderResult {
  orderId: string;
  status: string;
  deliveryPin: string;
  completedAt: string;
}

export class DriverRepository {
  private static instance: DriverRepository;

  private constructor() {}

  public static getInstance(): DriverRepository {
    if (!DriverRepository.instance) {
      DriverRepository.instance =
        new DriverRepository();
    }

    return DriverRepository.instance;
  }

  private mapDriver(
    row: any,
    documents: DriverDocumentModel[] = []
  ): DriverModel {
    return {
      id:
        row.driver_id ??
        row.id ??
        '',

      name:
        row.full_name ??
        row.users?.full_name ??
        'Driver',

      phone:
        row.phone_number ??
        row.users?.phone_number ??
        '',

      rating: Number(
        row.average_rating ?? 5
      ),

      totalDeliveries:
        Number(
          row.total_deliveries ?? 0
        ),

      vehicleReg:
        row.vehicle_registration ??
        '',

      vehicleModel:
        row.vehicle_model ??
        '',

      vehicleColor:
        row.vehicle_color ??
        '',

      stationName:
        row.station_name ??
        '',

      isOnDuty:
        row.is_on_duty ??
        false,

      isApproved:
        row.is_approved ??
        false,

      coordinates: {
        lat: Number(
          row.current_latitude ??
          -29.8587
        ),

        lng: Number(
          row.current_longitude ??
          31.0218
        ),
      },

      dailyTarget:
        Number(
          row.daily_target ??
          1500
        ),

      todayEarnings: 0,
      weekEarnings: 0,
      monthEarnings: 0,

      documents,
    };
  }

  private mapDocument(
    doc: any
  ): DriverDocumentModel {
    const expiryDate =
      doc.expiry_date ?? '';

    const now = new Date();

    const expiry =
      new Date(expiryDate);

    const daysUntilExpiry =
      (
        expiry.getTime() -
        now.getTime()
      ) /
      (1000 * 60 * 60 * 24);

    const isExpired =
      daysUntilExpiry < 0;

    const isExpiringSoon =
      !isExpired &&
      daysUntilExpiry <= 30;

    return {
      id:
        doc.document_id ??
        doc.id ??
        '',

      type:
        doc.document_type as
          DriverDocumentModel['type'],

      number:
        doc.document_number ??
        '',

      expiryDate,

      isExpired,

      isExpiringSoon,
    };
  }

  private async getCurrentUserId(): Promise<string> {
    const {
      data: { user },
      error: authError,
    } =
      await supabase.auth.getUser();

    if (authError) {
      throw authError;
    }

    if (!user) {
      throw new Error(
        'No authenticated driver found.'
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from('users')
      .select('user_id')
      .eq(
        'auth_id',
        user.id
      )
      .single();

    if (error || !data) {
      throw (
        error ??
        new Error(
          'Application user profile not found.'
        )
      );
    }

    return data.user_id;
  }

  public async getActiveDriver(): Promise<DriverModel> {
    const userId =
      await this.getCurrentUserId();

    const {
      data,
      error,
    } = await supabase
      .from('drivers')
      .select(`
        *,
        users (
          full_name,
          phone_number
        )
      `)
      .eq(
        'driver_id',
        userId
      )
      .single();

    if (error || !data) {
      throw (
        error ??
        new Error(
          'Driver profile not found.'
        )
      );
    }

    const {
      data: docs,
      error: docsError,
    } = await supabase
      .from('compliance_documents')
      .select('*')
      .eq(
        'driver_id',
        userId
      );

    if (docsError) {
      console.error(
        'DriverRepository: failed to fetch driver documents',
        docsError
      );
    }

    const documents =
      (docs ?? []).map(
        document =>
          this.mapDocument(
            document
          )
      );

    return this.mapDriver(
      data,
      documents
    );
  }

  public async getAllDrivers(): Promise<
    DriverModel[]
  > {
    const {
      data,
      error,
    } = await supabase
      .from('drivers')
      .select(`
        *,
        users (
          full_name,
          phone_number
        )
      `);

    if (error) {
      console.error(
        'DriverRepository: failed to fetch drivers',
        error
      );

      return [];
    }

    return (
      data ?? []
    ).map(
      row =>
        this.mapDriver(row)
    );
  }

  public async getEarnings(): Promise<DriverEarnings> {
    const driverId =
      await this.getCurrentUserId();

    const now = new Date();

    const startOfToday =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).toISOString();

    const startOfWeek =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() -
          now.getDay()
      ).toISOString();

    const startOfMonth =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).toISOString();

    const {
      data: orders,
      error,
    } = await supabase
      .from('orders')
      .select(`
        *,
        payments (
          delivery_fee,
          fuel_subtotal,
          total_amount
        ),
        fuel_types (
          name
        ),
        addresses (
          street_name,
          suburb
        )
      `)
      .eq(
        'driver_id',
        driverId
      )
      .eq(
        'status',
        'DELIVERED'
      );

    if (error) {
      console.error(
        'DriverRepository: failed to fetch earnings',
        error
      );
    }

    const delivered =
      orders ?? [];

    const calculateEarnings =
      (
        startDate: string
      ): number =>
        delivered
          .filter(
            (order: any) =>
              order.delivered_at >=
              startDate
          )
          .reduce(
            (
              total: number,
              order: any
            ) =>
              total +
              Number(
                order.payments?.[0]
                  ?.delivery_fee ??
                  0
              ),
            0
          );

    const todayEarnings =
      calculateEarnings(
        startOfToday
      );

    const weekEarnings =
      calculateEarnings(
        startOfWeek
      );

    const monthEarnings =
      calculateEarnings(
        startOfMonth
      );

    const deliveryHistory:
      DriverEarningsEntry[] =
      delivered
        .slice(0, 20)
        .map(
          (order: any) => ({
            id:
              order.order_id,

            address:
              `${order.addresses?.street_name ?? ''}, ` +
              `${order.addresses?.suburb ?? ''}`,

            date:
              order.delivered_at ??
              order.placed_at ??
              new Date().toISOString(),

            litres:
              Number(
                order.volume_litres ??
                  0
              ),

            fuelType:
              order.fuel_types?.name ??
              'Fuel',

            amount:
              Number(
                order.payments?.[0]
                  ?.delivery_fee ??
                  0
              ),
          })
        );

    return {
      todayEarnings,
      weekEarnings,
      monthEarnings,
      dailyTarget: 1500,
      totalDeliveries:
        delivered.length,
      deliveryHistory,
    };
  }

  public async getDriverDocuments(): Promise<
    DriverDocumentModel[]
  > {
    try {
      const driverId =
        await this.getCurrentUserId();

      const {
        data,
        error,
      } = await supabase
        .from(
          'compliance_documents'
        )
        .select('*')
        .eq(
          'driver_id',
          driverId
        );

      if (error) {
        console.error(
          'DriverRepository: failed to fetch documents',
          error
        );

        return [];
      }

      return (
        data ?? []
      ).map(
        document =>
          this.mapDocument(
            document
          )
      );
    } catch (error) {
      console.error(
        'DriverRepository: failed to resolve driver documents',
        error
      );

      return [];
    }
  }

  public async toggleOnDutyStatus(
    isOnDuty: boolean
  ): Promise<boolean> {
    const driverId =
      await this.getCurrentUserId();

    const {
      error,
    } = await supabase
      .from('drivers')
      .update({
        status: isOnDuty
          ? 'Active'
          : 'Offline',
      })
      .eq(
        'driver_id',
        driverId
      );

    if (error) {
      throw error;
    }

    return isOnDuty;
  }

  public async updateGpsCoordinates(
    lat: number,
    lng: number
  ): Promise<void> {
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      throw new Error(
        'Invalid GPS coordinates.'
      );
    }

    const driverId =
      await this.getCurrentUserId();

    const {
      error,
    } = await supabase
      .from('drivers')
      .update({
        latitude: lat,
        longitude: lng,
      })
      .eq(
        'driver_id',
        driverId
      );

    if (error) {
      console.error(
        'DriverRepository: failed to update GPS coordinates:',
        error
      );

      throw error;
    }
  }

  public async acceptOrder(
    orderId: string
  ): Promise<void> {
    const driverId =
      await this.getCurrentUserId();

    const {
      data: order,
      error: orderLookupError,
    } = await supabase
      .from('orders')
      .select(
        'order_id, driver_id, status'
      )
      .eq(
        'order_id',
        orderId
      )
      .maybeSingle();

    if (orderLookupError) {
      throw orderLookupError;
    }

    if (!order) {
      throw new Error(
        'Order could not be found.'
      );
    }

    if (order.driver_id) {
      throw new Error(
        'This order has already been assigned to another driver.'
      );
    }

    if (
      String(
        order.status
      ).toUpperCase() !==
      'PAID'
    ) {
      throw new Error(
        'This order is no longer available.'
      );
    }

    const {
      data: updatedOrder,
      error,
    } = await supabase
      .from('orders')
      .update({
        driver_id:
          driverId,
        status:
          'ACCEPTED',
      })
      .eq(
        'order_id',
        orderId
      )
      .is(
        'driver_id',
        null
      )
      .eq(
        'status',
        'PAID'
      )
      .select(
        'order_id, driver_id, status'
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!updatedOrder) {
      throw new Error(
        'The order could not be accepted. It may have been assigned to another driver.'
      );
    }
  }

  public async updateDriverOrderStatus(
    orderId: string,
    status:
      | 'IN_TRANSIT'
      | 'ARRIVED'
      | 'DISPENSING'
  ): Promise<DriverActiveOrder> {
    const driverId =
      await this.getCurrentUserId();

    const {
      data,
      error,
    } = await supabase
      .from('orders')
      .update({
        status,
      })
      .eq(
        'order_id',
        orderId
      )
      .eq(
        'driver_id',
        driverId
      )
      .select(`
        order_id,
        customer_id,
        volume_litres,
        delivery_type,
        scheduled_date_time,
        placed_at,
        status,
        rand_amount,
        address_id,
        fuel_type_id
      `)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(
        'The order status could not be updated.'
      );
    }

    const {
      data: fullOrder,
      error: fullOrderError,
    } =
      await supabase
        .rpc(
          'get_driver_order_by_id',
          {
            p_order_id:
              orderId,
          }
        );

    if (!fullOrderError) {
      const row =
        Array.isArray(
          fullOrder
        )
          ? fullOrder[0]
          : fullOrder;

      if (row) {
        return this.mapActiveOrder(
          row
        );
      }
    }

    return {
      orderId:
        data.order_id,

      customerId:
        data.customer_id,

      customerName:
        'Customer',

      fuelType:
        'Fuel',

      litres:
        Number(
          data.volume_litres ??
            0
        ),

      deliveryType:
        data.delivery_type ??
        'Deliver Now',

      scheduledDateTime:
        data.scheduled_date_time,

      placedAt:
        data.placed_at,

      suburb:
        '',

      fullAddress:
        'Address unavailable',

      latitude:
        null,

      longitude:
        null,

      status:
        data.status ??
        status,

      fuelSubtotal:
        Math.max(
          Number(
            data.rand_amount ??
              0
          ) - 49,
          0
        ),

      deliveryFee:
        49,

      serviceFee:
        0,

      vatAmount:
        0,

      totalZar:
        Number(
          data.rand_amount ??
            0
        ),
    };
  }

  public async completeDriverOrder(
    orderId: string
  ): Promise<CompleteDriverOrderResult> {
    if (!orderId) {
      throw new Error(
        'A valid order ID is required.'
      );
    }

    console.log(
      'DriverRepository: completing order',
      orderId
    );

    const {
      data,
      error,
    } = await supabase.rpc(
      'complete_driver_order',
      {
        p_order_id:
          orderId,
      }
    );

    if (error) {
      console.error(
        'DriverRepository: complete_driver_order failed',
        {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        }
      );

      throw error;
    }

    const result =
      Array.isArray(data)
        ? data[0]
        : data;

    if (!result) {
      throw new Error(
        'The completion request returned no result.'
      );
    }

    if (
      String(
        result.status ?? ''
      ).toUpperCase() !==
      'DELIVERED'
    ) {
      throw new Error(
        `The order was not marked as delivered. Current result: ${result.status ?? 'unknown'}`
      );
    }

    if (!result.delivery_pin) {
      throw new Error(
        'The order was delivered, but no delivery PIN was returned.'
      );
    }

    if (!result.completed_at) {
      throw new Error(
        'The order was delivered, but no completion timestamp was returned.'
      );
    }

    return {
      orderId:
        result.order_id ??
        orderId,

      status:
        String(
          result.status
        ),

      deliveryPin:
        String(
          result.delivery_pin
        ),

      completedAt:
        String(
          result.completed_at
        ),
    };
  }

  public async revealDeliveryPin(
    orderId: string
  ): Promise<DeliveryPinResult> {
    const {
      data,
      error,
    } = await supabase.rpc(
      'reveal_delivery_pin',
      {
        p_order_id:
          orderId,
      }
    );

    if (error) {
      throw error;
    }

    const result =
      Array.isArray(data)
        ? data[0]
        : data;

    if (
      !result ||
      !result.delivery_pin
    ) {
      throw new Error(
        'The delivery PIN could not be retrieved.'
      );
    }

    return {
      orderId:
        result.order_id ??
        orderId,

      deliveryPin:
        String(
          result.delivery_pin
        ),

      status:
        result.status ??
        'COMPLETION_PENDING',
    };
  }

  public async confirmDelivery(
    orderId: string
  ): Promise<void> {
    const {
      data,
      error,
    } = await supabase.rpc(
      'confirm_delivery',
      {
        p_order_id:
          orderId,
      }
    );

    if (error) {
      throw error;
    }

    const result =
      Array.isArray(data)
        ? data[0]
        : data;

    if (
      !result ||
      result.status !==
        'DELIVERED'
    ) {
      throw new Error(
        'The delivery could not be confirmed.'
      );
    }
  }

  public async updateOrderStatus(
    orderId: string,
    status: string,
    deliveredAt?: string
  ): Promise<void> {
    const driverId =
      await this.getCurrentUserId();

    const update: any = {
      status,
    };

    if (deliveredAt) {
      update.delivered_at =
        deliveredAt;
    }

    const {
      error,
    } = await supabase
      .from('orders')
      .update(update)
      .eq(
        'order_id',
        orderId
      )
      .eq(
        'driver_id',
        driverId
      );

    if (error) {
      throw error;
    }
  }

  private mapActiveOrder(
    row: any
  ): DriverActiveOrder {
    const litres =
      Number(
        row.litres ??
          row.volume_litres ??
          0
      );

    const total =
      Number(
        row.total_zar ??
          row.totalZar ??
          row.rand_amount ??
          0
      );

    return {
      orderId:
        row.order_id ??
        row.orderId,

      customerId:
        row.customer_id ??
        row.customerId,

      customerName:
        row.customer_name ??
        row.customerName ??
        'Customer',

      customerInitials:
        row.customer_initials ??
        'CU',

      fuelType:
        row.fuel_type ??
        row.fuelType ??
        'Fuel',

      litres,

      volumeLitres:
        litres,

      deliveryType:
        row.delivery_type ??
        row.deliveryType ??
        'Deliver Now',

      scheduledDateTime:
        row.scheduled_date_time ??
        row.scheduledDateTime ??
        null,

      placedAt:
        row.placed_at ??
        row.placedAt,

      suburb:
        row.suburb ??
        '',

      fullAddress:
        row.full_address ??
        row.fullAddress ??
        'Address unavailable',

      address:
        row.full_address ??
        row.fullAddress ??
        'Address unavailable',

      latitude:
        row.latitude ??
        null,

      longitude:
        row.longitude ??
        null,

      distanceKm:
        row.distance_km ??
        null,

      estimatedMinutes:
        row.estimated_minutes ??
        null,

      status:
        row.status ??
        'ACCEPTED',

      fuelSubtotal:
        Number(
          row.fuel_subtotal ??
            0
        ),

      deliveryFee:
        Number(
          row.delivery_fee ??
            0
        ),

      serviceFee:
        Number(
          row.service_fee ??
            0
        ),

      vatAmount:
        Number(
          row.vat_amount ??
            0
        ),

      totalZar:
        total,

      totalZAR:
        total,
    };
  }
}

export const driverRepository =
  DriverRepository.getInstance();