
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
      .select(`
        *,
        drivers (
          driver_id,
          users (
            user_id,
            full_name,
            phone_number
          )
        )
      `)
      .order('reported_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch SOS alerts:', error);
      return [];
    }

    return (data || []).map((a: any) => {
      const driver = a.drivers;
      const user = driver?.users;

      return {
        id: a.alert_id,

        referenceNumber: `SOS-${String(a.alert_id)
          .substring(0, 6)
          .toUpperCase()}`,

        driverId: a.driver_id,

        driverName: user?.full_name || 'Unknown Driver',

        driverPhone: user?.phone_number || '',

        vehicleReg: 'N/A',

        lat: Number(a.latitude ?? 0),

        lng: Number(a.longitude ?? 0),

        locationAddress: 'Unknown Location',

        orderId: a.order_id || undefined,

        status: a.status as SOSAlertModel['status'],

        notes: a.note || '',

        createdAt: a.reported_at,

        resolvedAt: a.resolved_at || undefined,

        severity: a.severity || 'high',

        suburb: 'Unknown',
      };
    });
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
        note:
          payload.notes ||
          'Emergency assistance requested via Driver App SOS trigger.',
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
      id: data.alert_id,

      referenceNumber: `SOS-${String(data.alert_id)
        .substring(0, 6)
        .toUpperCase()}`,

      driverId: data.driver_id,

      driverName: payload.driverName,

      driverPhone: payload.driverPhone,

      vehicleReg: payload.vehicleReg,

      lat: Number(data.latitude ?? 0),

      lng: Number(data.longitude ?? 0),

      locationAddress: payload.locationAddress,

      orderId: data.order_id || undefined,

      status: data.status as SOSAlertModel['status'],

      notes: data.note || '',

      createdAt: data.reported_at,

      resolvedAt: data.resolved_at || undefined,

      severity: data.severity || 'high',

      suburb: 'Unknown',
    };

    realtimeHub.getSOSAlertChannel().notify(newAlert);

    return newAlert;
  }

  public async markAsResolved(id: string): Promise<void> {
    const { error } = await supabase
      .from('sos_alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('alert_id', id);

    if (error) {
      console.error('Failed to resolve SOS alert:', error);
      throw error;
    }
  }

  public async dispatchSupport(
    id: string,
    notes: string
  ): Promise<void> {
    const { error } = await supabase
      .from('sos_alerts')
      .update({
        status: 'dispatched',
        note: notes,
      })
      .eq('alert_id', id);

    if (error) {
      console.error('Failed to dispatch support for SOS alert:', error);
      throw error;
    }
  }
}

export const sosRepository = SOSRepository.getInstance();

