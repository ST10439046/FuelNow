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
      return [];
    }
    
    // Map JSON response to DriverModel
    return (data || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      rating: d.rating || 5,
      totalDeliveries: 0,
      vehicleReg: d.licence_number || '', // Mapping licence to reg for now
      vehicleModel: '',
      vehicleColor: '',
      stationName: '',
      isOnDuty: d.status === 'active',
      isApproved: true,
      coordinates: { lat: 0, lng: 0 },
      dailyTarget: 0,
      todayEarnings: 0,
      weekEarnings: 0,
      monthEarnings: 0,
      documents: [],
      zone: d.zone,
      province: d.province,
      status: d.status,
      licence_number: d.licence_number,
      avatar: d.name ? d.name.substring(0, 2).toUpperCase() : 'DR',
      truck: 'N/A'
    }));
  }

  public async toggleOnDutyStatus(isOnDuty: boolean): Promise<boolean> {
    this.activeDriver.isOnDuty = isOnDuty;
    return this.activeDriver.isOnDuty;
  }

  public async updateGpsCoordinates(lat: number, lng: number): Promise<void> {
    this.activeDriver.coordinates = { lat, lng };
    realtimeHub.getDriverGpsChannel(this.activeDriver.id).notify({
      driverId: this.activeDriver.id,
      coordinates: { lat, lng },
      timestamp: new Date().toISOString(),
    });
  }

  public async addDriver(driver: Omit<DriverModel, 'id' | 'todayEarnings' | 'weekEarnings' | 'monthEarnings' | 'documents'>): Promise<DriverModel> {
    // Ideally this uses a supabase insert or RPC. For now we just return a fake object 
    // to satisfy the UI until the user runs a SQL script to add full driver insert support.
    const newDriver: DriverModel = {
      ...driver,
      id: `drv_${Date.now().toString().slice(-4)}`,
      todayEarnings: 0,
      weekEarnings: 0,
      monthEarnings: 0,
      documents: [],
    };
    return newDriver;
  }
  
  public async updateDriver(id: string, updates: Partial<DriverModel>): Promise<void> {
    const { error } = await supabase.rpc('update_driver_details', {
      p_driver_id: id,
      p_name: updates.name || null,
      p_phone: updates.phone || null,
      p_zone: updates.zone || null,
      p_province: updates.province || null
    });
    
    if (error) {
      console.error('Error updating driver:', error);
      throw error;
    }
  }

  public async deleteDriver(id: string): Promise<void> {
    // Implement standard delete if possible. Note: deleting users via client is restricted in Supabase,
    // usually requires a secure Edge Function. We will just attempt to delete the driver profile.
    const { error } = await supabase.from('drivers').delete().eq('id', id);
    if (error) {
      console.error('Error deleting driver:', error);
      throw error;
    }
  }
}

export const driverRepository = DriverRepository.getInstance();
