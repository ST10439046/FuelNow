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
  zone?: string;
  province?: string;
  status?: string;
  licence_number?: string;
  avatar?: string;
  truck?: string;
  email?: string;
  truck_type?: string;
  truck_color?: string;
}

export class DriverRepository {
  private static instance: DriverRepository;
  
  // Minimal active driver for dashboard testing purposes until full auth logic is linked.
  private activeDriver: DriverModel = {
    id: 'drv_001',
    name: 'Admin Driver',
    phone: '',
    rating: 5,
    totalDeliveries: 0,
    vehicleReg: '',
    vehicleModel: '',
    vehicleColor: '',
    stationName: '',
    isOnDuty: true,
    isApproved: true,
    coordinates: { lat: -29.7990, lng: 31.0340 },
    dailyTarget: 1500.0,
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    documents: [],
  };

  private constructor() {}

  public static getInstance(): DriverRepository {
    if (!DriverRepository.instance) {
      DriverRepository.instance = new DriverRepository();
    }
    return DriverRepository.instance;
  }

  public async getActiveDriver(): Promise<DriverModel> {
    return { ...this.activeDriver };
  }

public async getAllDrivers(): Promise<DriverModel[]> {
  const { data, error } = await supabase.rpc('get_all_drivers');

  if (error) {
    console.error('Failed to fetch drivers:', error);
    throw error;
  }

  return (data || []).map((d: any) => ({
    id: d.id,
    name: d.name || 'Unknown Driver',
    phone: d.phone || '',
    rating: Number(d.rating ?? 0),
    totalDeliveries: 0,
    vehicleReg: d.licence_number || '',
    vehicleModel: '',
    vehicleColor: '',
    stationName: '',
    isOnDuty: ['active', 'online'].includes(
      String(d.status ?? '').toLowerCase()
    ),
    isApproved: true,
    coordinates: {
      lat: 0,
      lng: 0,
    },
    dailyTarget: 0,
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    documents: [],
    zone: d.zone || '',
    province: d.province || '',
    status: d.status || '',
    licence_number: d.licence_number || '',
    avatar: d.name
      ? d.name.substring(0, 2).toUpperCase()
      : 'DR',
    truck: 'N/A',
  }));
}

public async toggleOnDutyStatus(isOnDuty: boolean): Promise<boolean> {
  const driverId = this.activeDriver.id;

  const { data, error } = await supabase.rpc(
    'update_driver_status',
    {
      p_driver_id: driverId,
      p_status: isOnDuty ? 'active' : 'inactive',
    }
  );

  if (error) {
    console.error('Failed to update driver duty status:', error);
    throw error;
  }

  this.activeDriver.isOnDuty = isOnDuty;

  return Boolean(data);
}

public async updateGpsCoordinates(
  lat: number,
  lng: number
): Promise<void> {
  const driverId = this.activeDriver.id;

  const { data, error } = await supabase.rpc(
    'update_driver_gps',
    {
      p_driver_id: driverId,
      p_latitude: lat,
      p_longitude: lng,
    }
  );

  if (error) {
    console.error('Failed to update driver GPS:', error);
    throw error;
  }

  this.activeDriver.coordinates = {
    lat,
    lng,
  };

  realtimeHub
    .getDriverGpsChannel(driverId)
    .notify({
      driverId,
      coordinates: {
        lat,
        lng,
      },
      timestamp:
        data?.timestamp ??
        new Date().toISOString(),
    });
}

public async getUserIdByEmail(email: string): Promise<string> {
  const { data, error } = await supabase
    .from('users')
    .select('user_id')
    .eq('email', email.trim().toLowerCase())
    .single();

  if (error || !data) {
    throw new Error('No FuelNow user was found with this email address.');
  }

  return data.user_id;
}

public async addDriver(
  driverId: string,
  driver: Omit<
    DriverModel,
    'id' |
    'todayEarnings' |
    'weekEarnings' |
    'monthEarnings' |
    'documents'
  >
): Promise<DriverModel> {
  const { data, error } = await supabase.rpc(
    'create_driver',
    {
      p_driver_id: driverId,
      p_name: driver.name,
      p_phone: driver.phone,
      p_licence_number:
        driver.licence_number ||
        driver.vehicleReg ||
        null,
      p_zone: driver.zone || null,
      p_province: driver.province || null,
      p_status:
        driver.status ||
        (driver.isOnDuty ? 'active' : 'inactive'),
      p_rating: driver.rating || 0,
    }
  );

  if (error) {
    console.error('Failed to create driver:', error);
    throw error;
  }

  return {
    ...driver,
    id: data,
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    documents: [],
  };
}
  
public async updateDriver(
  id: string,
  updates: Partial<DriverModel>
): Promise<void> {
  const { error } = await supabase.rpc(
    'update_driver_details',
    {
      p_driver_id: id,
      p_name: updates.name ?? null,
      p_phone: updates.phone ?? null,
      p_zone: updates.zone ?? null,
      p_province: updates.province ?? null,
      p_licence_number:
        updates.licence_number ??
        updates.vehicleReg ??
        null,
      p_status: updates.status ?? null,
      p_rating:
        updates.rating !== undefined
          ? updates.rating
          : null,
    }
  );

  if (error) {
    console.error('Error updating driver:', error);
    throw error;
  }
}

public async deleteDriver(id: string): Promise<void> {
  const { data, error } = await supabase.rpc(
    'delete_driver',
    {
      p_driver_id: id,
    }
  );

  if (error) {
    console.error('Error deleting driver:', error);
    throw error;
  }

  if (!data) {
    throw new Error('Driver was not found.');
  }
}
}

export const driverRepository = DriverRepository.getInstance();
