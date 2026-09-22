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
      DriverRepository.instance = new DriverRepository();
    }

    return DriverRepository.instance;
  }

  /**
   * Gets the public.users.user_id belonging to the currently
   * authenticated Supabase Auth user.
   *
   * FuelFlow uses:
   *
   * auth.users.id
   *      ↓
   * users.auth_id
   *      ↓
   * users.user_id
   *      ↓
   * drivers.driver_id
   *      ↓
   * orders.driver_id
   */
  private async getAuthenticatedDriverId(): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('No authenticated driver found.');
    }

    const { data, error } = await supabase
      .from('users')
      .select('user_id')
      .eq('auth_id', user.id)
      .single();

    if (error || !data?.user_id) {
      console.error(
        'DriverRepository: failed to resolve authenticated driver',
        error
      );

      throw new Error('Driver account could not be resolved.');
    }

    return data.user_id;
  }

  private mapDriver(
    row: any,
    user: any,
    vehicle: any,
    documents: DriverDocumentModel[] = [],
    earnings?: DriverEarnings
  ): DriverModel {
    const driverStatus = String(row.status ?? '');

    return {
      id: row.driver_id ?? '',
      name: user?.full_name ?? 'Driver',
      phone: user?.phone_number ?? '',
      rating: Number(row.rating ?? 0),
      totalDeliveries: earnings?.totalDeliveries ?? 0,
      vehicleReg: vehicle?.registration_number ?? '',
      vehicleModel: vehicle
        ? `${vehicle.make ?? ''} ${vehicle.model ?? ''}`.trim()
        : '',
      vehicleColor: '',
      stationName: row.zone ?? '',
      isOnDuty:
        driverStatus.toLowerCase() === 'available' ||
        driverStatus.toLowerCase() === 'on duty' ||
        driverStatus.toLowerCase() === 'on_duty',
      isApproved:
        driverStatus.toLowerCase() !== 'inactive' &&
        driverStatus.toLowerCase() !== 'suspended',
      coordinates: {
        lat: Number(row.latitude ?? -29.8587),
        lng: Number(row.longitude ?? 31.0218),
      },
      dailyTarget: earnings?.dailyTarget ?? 1500,
      todayEarnings: earnings?.todayEarnings ?? 0,
      weekEarnings: earnings?.weekEarnings ?? 0,
      monthEarnings: earnings?.monthEarnings ?? 0,
      documents,
    };
  }

  private mapDocument(doc: any): DriverDocumentModel {
    const expiryDate = doc.expiry_date ?? '';

    const now = new Date();
    const expiry = new Date(expiryDate);

    const daysUntilExpiry =
      (expiry.getTime() - now.getTime()) /
      (1000 * 60 * 60 * 24);

    const isExpired =
      Boolean(expiryDate) && daysUntilExpiry < 0;

    const isExpiringSoon =
      Boolean(expiryDate) &&
      !isExpired &&
      daysUntilExpiry <= 30;

    return {
      id: doc.document_id ?? '',
      type: doc.document_type as DriverDocumentModel['type'],
      number: doc.document_number ?? '',
      expiryDate,
      isExpired,
      isExpiringSoon,
    };
  }

  /**
   * Fetches the currently authenticated driver's profile.
   */
  public async getActiveDriver(): Promise<DriverModel> {
    const driverId = await this.getAuthenticatedDriverId();

    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('*')
      .eq('driver_id', driverId)
      .single();

    if (driverError || !driver) {
      console.error(
        'DriverRepository: failed to fetch driver',
        driverError
      );

      throw driverError ?? new Error('Driver profile not found.');
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id, full_name, email, phone_number, status')
      .eq('user_id', driverId)
      .single();

    if (userError || !user) {
      console.error(
        'DriverRepository: failed to fetch driver user',
        userError
      );

      throw userError ?? new Error('Driver user profile not found.');
    }

    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select(
        'vehicle_id, driver_id, registration_number, make, model, capacity_litres'
      )
      .eq('driver_id', driverId)
      .maybeSingle();

    if (vehicleError) {
      console.error(
        'DriverRepository: failed to fetch vehicle',
        vehicleError
      );
    }

    const { data: docs, error: docsError } = await supabase
      .from('compliance_documents')
      .select(
        'document_id, driver_id, document_type, document_number, issue_date, expiry_date, status'
      )
      .eq('driver_id', driverId)
      .order('expiry_date', { ascending: true });

    if (docsError) {
      console.error(
        'DriverRepository: failed to fetch compliance documents',
        docsError
      );
    }

    const documents = (docs ?? []).map((doc: any) =>
      this.mapDocument(doc)
    );

    const earnings = await this.getEarnings();

    return this.mapDriver(
      driver,
      user,
      vehicle,
      documents,
      earnings
    );
  }

  /**
   * Fetches all drivers.
   */
  public async getAllDrivers(): Promise<DriverModel[]> {
    const { data: drivers, error } = await supabase
      .from('drivers')
      .select('*');

    if (error) {
      console.error(
        'DriverRepository: failed to fetch drivers',
        error
      );

      return [];
    }

    if (!drivers?.length) {
      return [];
    }

    const driverIds = drivers.map((driver: any) => driver.driver_id);

    const { data: users } = await supabase
      .from('users')
      .select('user_id, full_name, email, phone_number')
      .in('user_id', driverIds);

    const { data: vehicles } = await supabase
      .from('vehicles')
      .select(
        'vehicle_id, driver_id, registration_number, make, model, capacity_litres'
      )
      .in('driver_id', driverIds);

    return drivers.map((driver: any) => {
      const user = (users ?? []).find(
        (item: any) => item.user_id === driver.driver_id
      );

      const vehicle = (vehicles ?? []).find(
        (item: any) => item.driver_id === driver.driver_id
      );

      return this.mapDriver(driver, user, vehicle);
    });
  }

  /**
   * Fetches real earnings from completed FuelFlow deliveries.
   *
   * Driver earnings are based on the delivery_fee recorded
   * against each completed order.
   */
  public async getEarnings(): Promise<DriverEarnings> {
    const driverId = await this.getAuthenticatedDriverId();

    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay()
    );

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        order_id,
        driver_id,
        volume_litres,
        status,
        placed_at,
        delivered_at,
        fuel_types (
          name
        ),
        addresses (
          street_name,
          suburb,
          city
        ),
        payments (
          delivery_fee
        )
      `)
      .eq('driver_id', driverId)
      .eq('status', 'DELIVERED')
      .order('delivered_at', {
        ascending: false,
      });

    if (error) {
      console.error(
        'DriverRepository: failed to fetch earnings',
        error
      );

      throw error;
    }

    const delivered = orders ?? [];

    const getDeliveryFee = (order: any): number => {
      const payment = Array.isArray(order.payments)
        ? order.payments[0]
        : order.payments;

      return Number(payment?.delivery_fee ?? 0);
    };

    const todayEarnings = delivered
      .filter((order: any) => {
        if (!order.delivered_at) {
          return false;
        }

        return new Date(order.delivered_at) >= startOfToday;
      })
      .reduce(
        (total: number, order: any) =>
          total + getDeliveryFee(order),
        0
      );

    const weekEarnings = delivered
      .filter((order: any) => {
        if (!order.delivered_at) {
          return false;
        }

        return new Date(order.delivered_at) >= startOfWeek;
      })
      .reduce(
        (total: number, order: any) =>
          total + getDeliveryFee(order),
        0
      );

    const monthEarnings = delivered
      .filter((order: any) => {
        if (!order.delivered_at) {
          return false;
        }

        return new Date(order.delivered_at) >= startOfMonth;
      })
      .reduce(
        (total: number, order: any) =>
          total + getDeliveryFee(order),
        0
      );

    const deliveryHistory: DriverEarningsEntry[] =
      delivered.slice(0, 20).map((order: any) => {
        const address = order.addresses;

        const addressParts = [
          address?.street_name,
          address?.suburb,
          address?.city,
        ].filter(Boolean);

        return {
          id: order.order_id,
          address:
            addressParts.length > 0
              ? addressParts.join(', ')
              : 'Delivery address unavailable',
          date:
            order.delivered_at ??
            order.placed_at ??
            new Date().toISOString(),
          litres: Number(order.volume_litres ?? 0),
          fuelType:
            order.fuel_types?.name ?? 'Fuel',
          amount: getDeliveryFee(order),
        };
      });

    return {
      todayEarnings,
      weekEarnings,
      monthEarnings,
      dailyTarget: 1500,
      totalDeliveries: delivered.length,
      deliveryHistory,
    };
  }

  /**
   * Fetches compliance documents for the authenticated driver.
   */
  public async getDriverDocuments(): Promise<DriverDocumentModel[]> {
    try {
      const driverId =
        await this.getAuthenticatedDriverId();

      const { data, error } = await supabase
        .from('compliance_documents')
        .select(
          'document_id, driver_id, document_type, document_number, issue_date, expiry_date, status'
        )
        .eq('driver_id', driverId)
        .order('expiry_date', {
          ascending: true,
        });

      if (error) {
        console.error(
          'DriverRepository: failed to fetch compliance documents',
          error
        );

        return [];
      }

      return (data ?? []).map((document: any) =>
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
   * Toggles the driver's availability.
   *
   * FuelFlow stores driver availability using the drivers.status field.
   */
  public async toggleOnDutyStatus(
    isOnDuty: boolean
  ): Promise<boolean> {
    const driverId =
      await this.getAuthenticatedDriverId();

    const status = isOnDuty
      ? 'Available'
      : 'Inactive';

    const { error } = await supabase
      .from('drivers')
      .update({
        status,
      })
      .eq('driver_id', driverId);

    if (error) {
      throw error;
    }

    return isOnDuty;
  }

  /**
   * Updates the driver's GPS coordinates.
   */
  public async updateGpsCoordinates(
    lat: number,
    lng: number
  ): Promise<void> {
    const driverId =
      await this.getAuthenticatedDriverId();

    const { error } = await supabase
      .from('drivers')
      .update({
        latitude: lat,
        longitude: lng,
      })
      .eq('driver_id', driverId);

    if (error) {
      throw error;
    }

    realtimeHub
      .getDriverGpsChannel(driverId)
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
   * Assigns the current driver to an order.
   */
  public async acceptOrder(
    orderId: string
  ): Promise<void> {
    const driverId =
      await this.getAuthenticatedDriverId();

    const { error } = await supabase
      .from('orders')
      .update({
        driver_id: driverId,
        status: 'ACCEPTED',
      })
      .eq('order_id', orderId);

    if (error) {
      throw error;
    }
  }

  /**
   * Updates an order's delivery status.
   */
  public async updateOrderStatus(
    orderId: string,
    status: string,
    deliveredAt?: string
  ): Promise<void> {
    const update: Record<string, any> = {
      status,
    };

    if (deliveredAt) {
      update.delivered_at = deliveredAt;
    }

    const { error } = await supabase
      .from('orders')
      .update(update)
      .eq('order_id', orderId);

    if (error) {
      throw error;
    }
  }
}

export const driverRepository =
  DriverRepository.getInstance();