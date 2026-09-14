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
}

export class SOSRepository {
  private static instance: SOSRepository;

  private alerts: SOSAlertModel[] = [
    {
      id: 'sos_001',
      referenceNumber: 'SOS-849201',
      driverId: 'drv_003',
      driverName: 'Sipho Mthembu',
      driverPhone: '083 555 1290',
      vehicleReg: 'ND 619-332',
      lat: -29.8256,
      lng: 30.9312,
      locationAddress: '45 Jan Hofmeyr Rd, Westville, Durban',
      orderId: 'ord_7756',
      status: 'active',
      notes: 'Vehicle breakdown - Engine overheating on steep incline.',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
  ];

  private constructor() {}

  public static getInstance(): SOSRepository {
    if (!SOSRepository.instance) {
      SOSRepository.instance = new SOSRepository();
    }
    return SOSRepository.instance;
  }

  public async getAlerts(): Promise<SOSAlertModel[]> {
    return [...this.alerts];
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
    const newAlert: SOSAlertModel = {
      id: `sos_${Date.now().toString().slice(-6)}`,
      referenceNumber: `SOS-${Math.floor(100000 + Math.random() * 900000)}`,
      driverId: payload.driverId,
      driverName: payload.driverName,
      driverPhone: payload.driverPhone,
      vehicleReg: payload.vehicleReg,
      lat: payload.lat,
      lng: payload.lng,
      locationAddress: payload.locationAddress,
      orderId: payload.orderId,
      status: 'active',
      notes: payload.notes || 'Emergency assistance requested via Driver App SOS trigger.',
      createdAt: new Date().toISOString(),
    };

    this.alerts.unshift(newAlert);

    // Broadcast to Admin Realtime Observer
    realtimeHub.getSOSAlertChannel().notify(newAlert);
    return newAlert;
  }

  public async markAsResolved(id: string): Promise<SOSAlertModel | null> {
    const alert = this.alerts.find((a) => a.id === id);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date().toISOString();
      realtimeHub.getSOSAlertChannel().notify(alert);
      return { ...alert };
    }
    return null;
  }

  public async dispatchSupport(id: string, notes: string): Promise<SOSAlertModel | null> {
    const alert = this.alerts.find((a) => a.id === id);
    if (alert) {
      alert.status = 'dispatched';
      alert.notes = notes;
      realtimeHub.getSOSAlertChannel().notify(alert);
      return { ...alert };
    }
    return null;
  }
}

export const sosRepository = SOSRepository.getInstance();
