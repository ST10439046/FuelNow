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

export class DriverRepository {
  private static instance: DriverRepository;

  private activeDriver: DriverModel = {
    id: 'drv_001',
    name: 'France Sizwe',
    phone: '060 123 4567',
    rating: 4.9,
    totalDeliveries: 1248,
    vehicleReg: 'ND 456-789',
    vehicleModel: 'Toyota Hilux 2.8 GD-6',
    vehicleColor: 'Super White',
    stationName: 'Engen Durban North',
    isOnDuty: true,
    isApproved: true,
    coordinates: { lat: -29.7990, lng: 31.0340 },
    dailyTarget: 1500.0,
    todayEarnings: 892.50,
    weekEarnings: 4310.00,
    monthEarnings: 16840.00,
    documents: [
      {
        id: 'doc_001',
        type: "Driver's Licence",
        number: 'DL-KZN-20456',
        expiryDate: '2027-08-15',
        isExpired: false,
        isExpiringSoon: false,
      },
      {
        id: 'doc_002',
        type: 'Professional Driver Permit',
        number: 'PDP-KZN-89012',
        expiryDate: '2025-09-01',
        isExpired: false,
        isExpiringSoon: true,
      },
      {
        id: 'doc_003',
        type: 'Hazmat Certificate',
        number: 'HAZ-001-2024',
        expiryDate: '2024-12-31',
        isExpired: true,
        isExpiringSoon: false,
      },
      {
        id: 'doc_004',
        type: 'Vehicle Permit',
        number: 'VP-ND456789-25',
        expiryDate: '2026-03-20',
        isExpired: false,
        isExpiringSoon: false,
      },
    ],
  };

  private driversList: DriverModel[] = [];

  private constructor() {
    this.driversList = [
      this.activeDriver,
      {
        id: 'drv_002',
        name: 'Ruan van der Merwe',
        phone: '072 987 6543',
        rating: 4.7,
        totalDeliveries: 834,
        vehicleReg: 'ND 882-104',
        vehicleModel: 'Isuzu D-Max 3.0 Ddi',
        vehicleColor: 'Silver',
        stationName: 'Total Westville',
        isOnDuty: true,
        isApproved: true,
        coordinates: { lat: -29.8256, lng: 30.9312 },
        dailyTarget: 1500.0,
        todayEarnings: 680.00,
        weekEarnings: 3450.00,
        monthEarnings: 13900.00,
        documents: [],
      },
      {
        id: 'drv_003',
        name: 'Sipho Mthembu',
        phone: '083 555 1290',
        rating: 4.85,
        totalDeliveries: 942,
        vehicleReg: 'ND 619-332',
        vehicleModel: 'Ford Ranger 2.2 TDCi',
        vehicleColor: 'Dark Grey',
        stationName: 'Shell Umhlanga Ridge',
        isOnDuty: false,
        isApproved: true,
        coordinates: { lat: -29.7280, lng: 31.0680 },
        dailyTarget: 1500.0,
        todayEarnings: 0,
        weekEarnings: 2980.00,
        monthEarnings: 11400.00,
        documents: [],
      },
    ];
  }

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
    return [...this.driversList];
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
    const newDriver: DriverModel = {
      ...driver,
      id: `drv_${Date.now().toString().slice(-4)}`,
      todayEarnings: 0,
      weekEarnings: 0,
      monthEarnings: 0,
      documents: [],
    };
    this.driversList.push(newDriver);
    return newDriver;
  }
}

export const driverRepository = DriverRepository.getInstance();
