import { supabase } from '../services/supabase';
import { realtimeHub } from '../patterns/realtimeObserver';

export interface SOSAlertModel {
  id: string;
  referenceNumber: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  vehicleReg: string;
  lat: number;
  lng: number;
  locationAddress: string;
  orderId?: string;
  status: 'active' | 'dispatched' | 'resolved';
  notes?: string;
  createdAt: string;
  resolvedAt?: string;
  severity: string;
  suburb: string;
}

export class SOSRepository {
  private static instance: SOSRepository;

  private constructor() {}

  public static getInstance(): SOSRepository {
    if (!SOSRepository.instance) {
      SOSRepository.instance = new SOSRepository();
    }
    return SOSRepository.instance;
  }

  public async getAlerts(): Promise<SOSAlertModel[]> {
    const { data, error } = await supabase
      .from('sos_alerts')
      .select('*, users(full_name, phone_number)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch SOS alerts:', error);
      return [];
    }

    return (data || []).map((a: any) => ({
      id: a.id,
      referenceNumber: `SOS-${a.id.substring(0,6).toUpperCase()}`,
      driverId: a.driver_id,
      driverName: a.users?.full_name || 'Unknown Driver',
      driverPhone: a.users?.phone_number || '',
      vehicleReg: 'N/A', // You'd join vehicles table
      lat: a.latitude || 0,
      lng: a.longitude || 0,
      locationAddress: 'Unknown Location',
      orderId: a.order_id,
      status: a.status as any,
      notes: a.note || '',
      createdAt: a.created_at,
      resolvedAt: a.resolved_at,
      severity: a.severity || 'high',
      suburb: 'Unknown Suburb',
    }));
  }

  public async triggerSOS(payload: {
    driverId: string;
    driverName: string;
    driverPhone: string;
    vehicleReg: string;
    lat: number;
    lng: number;
    locationAddress: string;
    orderId?: string;
    notes?: string;
  }): Promise<SOSAlertModel> {
    const { data, error } = await supabase
      .from('sos_alerts')
      .insert({
        driver_id: payload.driverId,
        order_id: payload.orderId || null,
        latitude: payload.lat,
        longitude: payload.lng,
        note: payload.notes || 'Emergency assistance requested via Driver App SOS trigger.',
        severity: 'high',
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to trigger SOS:', error);
      throw error;
    }

    const newAlert: SOSAlertModel = {
      id: data.id,
      referenceNumber: `SOS-${data.id.substring(0,6).toUpperCase()}`,
      driverId: data.driver_id,
      driverName: payload.driverName,
      driverPhone: payload.driverPhone,
      vehicleReg: payload.vehicleReg,
      lat: data.latitude || 0,
      lng: data.longitude || 0,
      locationAddress: payload.locationAddress,
      orderId: data.order_id,
      status: data.status as any,
      notes: data.note,
      createdAt: data.created_at,
      severity: data.severity,
      suburb: 'Unknown',
    };

    realtimeHub.getSOSAlertChannel().notify(newAlert);
    return newAlert;
  }

  public async markAsResolved(id: string): Promise<void> {
    const { error } = await supabase
      .from('sos_alerts')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Failed to resolve SOS alert:', error);
      throw error;
    }
  }

  public async dispatchSupport(id: string, notes: string): Promise<void> {
    const { error } = await supabase
      .from('sos_alerts')
      .update({ status: 'dispatched', note: notes })
      .eq('id', id);

    if (error) {
      console.error('Failed to dispatch support for SOS alert:', error);
      throw error;
    }
  }
}

export const sosRepository = SOSRepository.getInstance();
