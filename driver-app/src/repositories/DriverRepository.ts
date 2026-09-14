import { supabase } from '../services/supabase';
import { realtimeHub } from '../patterns/realtimeObserver';

export interface DriverDocumentModel {
  id: string;
  type: "Driver's Licence" | 'Professional Driver Permit' | 'Hazmat Certificate' | 'Vehicle Permit';
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
  coordinates: { lat: number; lng: number };
  dailyTarget: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  documents: DriverDocumentModel[];
}

// ── Earnings entry returned per completed delivery ──────────────────────────
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

  private mapDriver(row: any, documents: DriverDocumentModel[] = []): DriverModel {
    return {
      id: row.driver_id ?? row.id ?? '',
      name: row.full_name ?? row.users?.full_name ?? 'Driver',
      phone: row.phone_number ?? row.users?.phone_number ?? '',
      rating: Number(row.average_rating ?? 5),
      totalDeliveries: Number(row.total_deliveries ?? 0),
      vehicleReg: row.vehicle_registration ?? '',
      vehicleModel: row.vehicle_model ?? '',
      vehicleColor: row.vehicle_color ?? '',
      stationName: row.station_name ?? '',
      isOnDuty: row.is_on_duty ?? false,
      isApproved: row.is_approved ?? false,
      coordinates: {
        lat: Number(row.current_latitude ?? -29.8587),
        lng: Number(row.current_longitude ?? 31.0218),
      },
      dailyTarget: Number(row.daily_target ?? 1500),
      todayEarnings: 0,
      weekEarnings: 0,
      monthEarnings: 0,
      documents,
    };
  }

  private mapDocument(doc: any): DriverDocumentModel {
    const expiryDate = doc.expiry_date ?? '';
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    const isExpired = daysUntilExpiry < 0;
    const isExpiringSoon = !isExpired && daysUntilExpiry <= 30;

    return {
      id: doc.document_id ?? doc.id ?? '',
      type: doc.document_type as DriverDocumentModel['type'],
      number: doc.document_number ?? '',
      expiryDate,
      isExpired,
      isExpiringSoon,
    };
  }

  /**
   * Fetches the authenticated driver's own profile from Supabase.
   */
  public async getActiveDriver(): Promise<DriverModel> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('No authenticated driver found.');
    }

    const { data, error } = await supabase
      .from('drivers')
      .select('*, users(full_name, phone_number)')
      .eq('driver_id', user.id)
      .single();

    if (error || !data) {
      throw error ?? new Error('Driver profile not found.');
    }

    const { data: docs } = await supabase
      .from('driver_documents')
      .select('*')
      .eq('driver_id', user.id);

    const documents = (docs ?? []).map((d: any) => this.mapDocument(d));
    return this.mapDriver(data, documents);
  }

  /**
   * Fetches all drivers (for admin or listing purposes).
   */
  public async getAllDrivers(): Promise<DriverModel[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*, users(full_name, phone_number)');

    if (error) {
      console.error('DriverRepository: failed to fetch drivers', error);
      return [];
    }

    return (data ?? []).map((row: any) => this.mapDriver(row));
  }

  /**
   * Fetches driver earnings and delivery history.
   */
  public async getEarnings(): Promise<DriverEarnings> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, payments(delivery_fee, fuel_subtotal, total_amount), fuel_types(name), addresses(street_name, suburb)')
      .eq('driver_id', user.id)
      .eq('status', 'DELIVERED');

    if (error) {
      console.error('DriverRepository: failed to fetch earnings', error);
    }

    const delivered = orders ?? [];
    const todayEarnings = delivered
      .filter((o: any) => o.delivered_at >= startOfToday)
      .reduce((acc: number, o: any) => acc + Number(o.payments?.[0]?.delivery_fee ?? 0), 0);

    const weekEarnings = delivered
      .filter((o: any) => o.delivered_at >= startOfWeek)
      .reduce((acc: number, o: any) => acc + Number(o.payments?.[0]?.delivery_fee ?? 0), 0);

    const monthEarnings = delivered
      .filter((o: any) => o.delivered_at >= startOfMonth)
      .reduce((acc: number, o: any) => acc + Number(o.payments?.[0]?.delivery_fee ?? 0), 0);

    const deliveryHistory: DriverEarningsEntry[] = delivered.slice(0, 20).map((o: any) => ({
      id: o.order_id,
      address: `${o.addresses?.street_name ?? ''}, ${o.addresses?.suburb ?? ''}`,
      date: o.delivered_at ?? o.placed_at ?? new Date().toISOString(),
      litres: Number(o.volume_litres ?? 0),
      fuelType: o.fuel_types?.name ?? 'Fuel',
      amount: Number(o.payments?.[0]?.delivery_fee ?? 0),
    }));

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
   * Fetches documents for the authenticated driver.
   */
  public async getDriverDocuments(): Promise<DriverDocumentModel[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('driver_documents')
      .select('*')
      .eq('driver_id', user.id);

    if (error) {
      console.error('DriverRepository: failed to fetch documents', error);
      return [];
    }

    return (data ?? []).map((d: any) => this.mapDocument(d));
  }

  /**
   * Toggles the driver's on-duty status in Supabase.
   */
  public async toggleOnDutyStatus(isOnDuty: boolean): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('drivers')
      .update({ is_on_duty: isOnDuty })
      .eq('driver_id', user.id);

    if (error) {
      throw error;
    }

    return isOnDuty;
  }

  /**
   * Updates the driver's GPS coordinates in Supabase and notifies realtime hub.
   */
  public async updateGpsCoordinates(lat: number, lng: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('drivers')
      .update({ current_latitude: lat, current_longitude: lng })
      .eq('driver_id', user.id);

    realtimeHub.getDriverGpsChannel(user.id).notify({
      driverId: user.id,
      coordinates: { lat, lng },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Accepts an order as the current driver.
   */
  public async acceptOrder(orderId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('orders')
      .update({ driver_id: user.id, status: 'ACCEPTED' })
      .eq('order_id', orderId);

    if (error) throw error;
  }

  /**
   * Updates order status (e.g., NAVIGATING, ARRIVED, DISPENSING, DELIVERED).
   */
  public async updateOrderStatus(orderId: string, status: string, deliveredAt?: string): Promise<void> {
    const update: any = { status };
    if (deliveredAt) update.delivered_at = deliveredAt;

    const { error } = await supabase
      .from('orders')
      .update(update)
      .eq('order_id', orderId);

    if (error) throw error;
  }
}

export const driverRepository = DriverRepository.getInstance();
