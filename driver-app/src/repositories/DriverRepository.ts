import { supabase } from '../services/supabase';
import { realtimeHub } from '../patterns/realtimeObserver';

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
      id: row.driver_id ?? row.id ?? '',
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

      totalDeliveries: Number(
        row.total_deliveries ?? 0
      ),

      vehicleReg:
        row.vehicle_registration ?? '',

      vehicleModel:
        row.vehicle_model ?? '',

      vehicleColor:
        row.vehicle_color ?? '',

      stationName:
        row.station_name ?? '',

      isOnDuty:
        row.is_on_duty ?? false,

      isApproved:
        row.is_approved ?? false,

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

      dailyTarget: Number(
        row.daily_target ?? 1500
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
        doc.document_number ?? '',

      expiryDate,

      isExpired,

      isExpiringSoon,
    };
  }

  /**
   * Resolves the application-level users.user_id
   * belonging to the currently authenticated
   * Supabase auth user.
   */
  private async getCurrentUserId(): Promise<string> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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
      .eq('auth_id', user.id)
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

  /**
   * Fetches the authenticated driver's own profile.
   */
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
        (document: any) =>
          this.mapDocument(document)
      );

    return this.mapDriver(
      data,
      documents
    );
  }

  /**
   * Fetches all drivers.
   */
  public async getAllDrivers(): Promise<DriverModel[]> {
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

    return (data ?? []).map(
      (row: any) =>
        this.mapDriver(row)
    );
  }

  /**
   * Fetches driver earnings and delivery history.
   */
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

    const todayEarnings =
      delivered
        .filter(
          (order: any) =>
            order.delivered_at >=
            startOfToday
        )
        .reduce(
          (
            total: number,
            order: any
          ) =>
            total +
            Number(
              order.payments?.[0]
                ?.delivery_fee ?? 0
            ),
          0
        );

    const weekEarnings =
      delivered
        .filter(
          (order: any) =>
            order.delivered_at >=
            startOfWeek
        )
        .reduce(
          (
            total: number,
            order: any
          ) =>
            total +
            Number(
              order.payments?.[0]
                ?.delivery_fee ?? 0
            ),
          0
        );

    const monthEarnings =
      delivered
        .filter(
          (order: any) =>
            order.delivered_at >=
            startOfMonth
        )
        .reduce(
          (
            total: number,
            order: any
          ) =>
            total +
            Number(
              order.payments?.[0]
                ?.delivery_fee ?? 0
            ),
          0
        );

    const deliveryHistory:
      DriverEarningsEntry[] =
      delivered
        .slice(0, 20)
        .map((order: any) => ({
          id: order.order_id,

          address:
            `${order.addresses?.street_name ?? ''}, ` +
            `${order.addresses?.suburb ?? ''}`,

          date:
            order.delivered_at ??
            order.placed_at ??
            new Date().toISOString(),

          litres:
            Number(
              order.volume_litres ?? 0
            ),

          fuelType:
            order.fuel_types?.name ??
            'Fuel',

          amount:
            Number(
              order.payments?.[0]
                ?.delivery_fee ?? 0
            ),
        }));

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

  /**
   * Fetches documents for the authenticated driver.
   */
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
        .from('compliance_documents')
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

      return (data ?? []).map(
        (document: any) =>
          this.mapDocument(document)
      );
    } catch (error) {
      console.error(
        'DriverRepository: failed to resolve driver documents',
        error
      );

      return [];
    }
  }

  /**
   * Toggles the driver's on-duty status.
   *
   * This method only updates columns that exist in the
   * current production schema.
   */
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

  /**
   * Updates the driver's GPS coordinates.
   *
   * The current database schema does not expose
   * current_latitude/current_longitude columns,
   * so this method only publishes the location
   * through the realtime hub until those columns
   * are added to the database.
   */
  public async updateGpsCoordinates(
    lat: number,
    lng: number
  ): Promise<void> {
    const driverId =
      await this.getCurrentUserId();

    realtimeHub
      .getDriverGpsChannel(
        driverId
      )
      .notify({
        driverId,
        coordinates: {
          lat,
          lng,
        },
        timestamp:
          new Date().toISOString(),
      });
  }

  /**
   * Accepts an available order as the
   * authenticated driver.
   */
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
      String(order.status)
        .toUpperCase() !==
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
        driver_id: driverId,
        status: 'ACCEPTED',
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

  /**
   * Updates an order status.
   */
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
}

export const driverRepository =
  DriverRepository.getInstance();