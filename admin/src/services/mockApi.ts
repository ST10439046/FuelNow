// ─────────────────────────────────────────────────────────────────────────────
// FuelNow Admin — Mock API Service
// Endpoint naming mirrors the mobile app conventions.
// ─────────────────────────────────────────────────────────────────────────────

const delay = (ms = 400) => new Promise(res => setTimeout(res, ms));

// ─── Types ───────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'accepted' | 'en_route' | 'delivered' | 'cancelled';
export type FuelType = 'Petrol 95' | 'Petrol 93' | 'Diesel 50ppm' | 'Diesel 500ppm';
export type DriverStatus = 'active' | 'offline' | 'on_delivery';
export type ComplianceStatus = 'valid' | 'expiring_soon' | 'expired';
export type AlertSeverity = 'critical' | 'warning';

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  fuelType: FuelType;
  litres: number;
  totalZAR: number;
  status: OrderStatus;
  driverName: string | null;
  address: string;
  suburb: string;
  province: string;
  placedAt: string;
  deliveredAt: string | null;
  deliveryMinutes: number | null;
}

export interface ComplianceDoc {
  name: string;
  expiryDate: string;
  status: ComplianceStatus;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: DriverStatus;
  zone: string;
  province: string;
  truck: string;
  rating: number;
  totalDeliveries: number;
  joinedDate: string;
  compliance: ComplianceDoc[];
  avatar: string; // initials
}

export interface FuelRate {
  fuelType: FuelType;
  pricePerLitre: number;
  lastUpdated: string;
  source: 'manual' | 'api';
}

export interface Review {
  id: string;
  customerName: string;
  driverName: string;
  orderId: string;
  rating: number;
  comment: string;
  date: string;
  flagged: boolean;
}

export interface SOSAlert {
  id: string;
  driverName: string;
  location: string;
  suburb: string;
  province: string;
  raisedAt: string;
  severity: AlertSeverity;
  resolved: boolean;
  note: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Ops Manager' | 'Support Agent';
  lastLogin: string;
  active: boolean;
}

export interface KPISummary {
  todayOrders: number;
  todayRevenue: number;
  activeDrivers: number;
  avgDeliveryMinutes: number;
  ordersChange: number;   // % vs yesterday
  revenueChange: number;
  driversChange: number;
  avgTimeChange: number;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

const ORDERS_DATA: Order[] = [
  { id: 'ORD-8821', customerName: 'Thabo Nkosi', phone: '+27 82 111 2233', fuelType: 'Petrol 95', litres: 40, totalZAR: 987.00, status: 'delivered', driverName: 'France Sizwe', address: '18 Kenneth Kaunda Rd', suburb: 'Durban North', province: 'KwaZulu-Natal', placedAt: new Date(Date.now() - 2 * 3600000).toISOString(), deliveredAt: new Date(Date.now() - 1.5 * 3600000).toISOString(), deliveryMinutes: 28 },
  { id: 'ORD-8820', customerName: 'Zanele Dlamini', phone: '+27 71 555 6677', fuelType: 'Diesel 50ppm', litres: 60, totalZAR: 1348.80, status: 'en_route', driverName: 'Sipho Mthembu', address: '45 Jan Hofmeyr Rd', suburb: 'Westville', province: 'KwaZulu-Natal', placedAt: new Date(Date.now() - 45 * 60000).toISOString(), deliveredAt: null, deliveryMinutes: null },
  { id: 'ORD-8819', customerName: 'Pieter van der Berg', phone: '+27 83 222 3344', fuelType: 'Petrol 93', litres: 30, totalZAR: 735.10, status: 'delivered', driverName: 'Bongani Zulu', address: '12 Umgeni Rd', suburb: 'Durban Central', province: 'KwaZulu-Natal', placedAt: new Date(Date.now() - 4 * 3600000).toISOString(), deliveredAt: new Date(Date.now() - 3.4 * 3600000).toISOString(), deliveryMinutes: 35 },
  { id: 'ORD-8818', customerName: 'Nomvula Sithole', phone: '+27 79 333 4455', fuelType: 'Petrol 95', litres: 50, totalZAR: 1221.50, status: 'accepted', driverName: 'France Sizwe', address: '8 Windermere Rd', suburb: 'Morningside', province: 'KwaZulu-Natal', placedAt: new Date(Date.now() - 20 * 60000).toISOString(), deliveredAt: null, deliveryMinutes: null },
  { id: 'ORD-8817', customerName: 'Ayanda Mkhize', phone: '+27 63 444 5566', fuelType: 'Diesel 500ppm', litres: 80, totalZAR: 1750.40, status: 'delivered', driverName: 'Lungelo Cele', address: '3 Broad St', suburb: 'Pinetown', province: 'KwaZulu-Natal', placedAt: new Date(Date.now() - 6 * 3600000).toISOString(), deliveredAt: new Date(Date.now() - 5.4 * 3600000).toISOString(), deliveryMinutes: 22 },
  { id: 'ORD-8816', customerName: 'Riana Botha', phone: '+27 82 777 8899', fuelType: 'Petrol 95', litres: 35, totalZAR: 864.25, status: 'pending', driverName: null, address: '22 Long Street', suburb: 'Cape Town City Bowl', province: 'Western Cape', placedAt: new Date(Date.now() - 5 * 60000).toISOString(), deliveredAt: null, deliveryMinutes: null },
  { id: 'ORD-8815', customerName: 'Mandla Khumalo', phone: '+27 76 888 9900', fuelType: 'Diesel 50ppm', litres: 45, totalZAR: 1011.60, status: 'cancelled', driverName: null, address: '5 Sandton Drive', suburb: 'Sandton', province: 'Gauteng', placedAt: new Date(Date.now() - 3 * 3600000).toISOString(), deliveredAt: null, deliveryMinutes: null },
  { id: 'ORD-8814', customerName: 'Fatima Moosa', phone: '+27 82 000 1122', fuelType: 'Petrol 93', litres: 25, totalZAR: 612.75, status: 'delivered', driverName: 'Sibusiso Hadebe', address: '77 Musgrave Rd', suburb: 'Berea', province: 'KwaZulu-Natal', placedAt: new Date(Date.now() - 8 * 3600000).toISOString(), deliveredAt: new Date(Date.now() - 7.5 * 3600000).toISOString(), deliveryMinutes: 30 },
  { id: 'ORD-8813', customerName: 'Heinrich Erasmus', phone: '+27 71 111 2200', fuelType: 'Petrol 95', litres: 55, totalZAR: 1344.65, status: 'delivered', driverName: 'France Sizwe', address: '9 Stellenbosch Ave', suburb: 'Tygervalley', province: 'Western Cape', placedAt: new Date(Date.now() - 10 * 3600000).toISOString(), deliveredAt: new Date(Date.now() - 9.3 * 3600000).toISOString(), deliveryMinutes: 42 },
  { id: 'ORD-8812', customerName: 'Lwazi Ngcobo', phone: '+27 73 222 3300', fuelType: 'Diesel 500ppm', litres: 100, totalZAR: 2188.00, status: 'delivered', driverName: 'Bongani Zulu', address: '14 Ridge Road', suburb: 'Windermere', province: 'KwaZulu-Natal', placedAt: new Date(Date.now() - 12 * 3600000).toISOString(), deliveredAt: new Date(Date.now() - 11.2 * 3600000).toISOString(), deliveryMinutes: 48 },
  { id: 'ORD-8811', customerName: 'Siphelele Dube', phone: '+27 83 555 6600', fuelType: 'Petrol 95', litres: 20, totalZAR: 493.00, status: 'en_route', driverName: 'Lungelo Cele', address: '3 Steve Biko Rd', suburb: 'Umlazi', province: 'KwaZulu-Natal', placedAt: new Date(Date.now() - 30 * 60000).toISOString(), deliveredAt: null, deliveryMinutes: null },
  { id: 'ORD-8810', customerName: 'Priya Naidoo', phone: '+27 81 777 8800', fuelType: 'Petrol 93', litres: 40, totalZAR: 980.20, status: 'delivered', driverName: 'Sibusiso Hadebe', address: '101 Chatsworth Rd', suburb: 'Chatsworth', province: 'KwaZulu-Natal', placedAt: new Date(Date.now() - 14 * 3600000).toISOString(), deliveredAt: new Date(Date.now() - 13.4 * 3600000).toISOString(), deliveryMinutes: 36 },
];

const DRIVERS_DATA: Driver[] = [
  {
    id: 'DRV-001', name: 'France Sizwe', phone: '+27 82 100 2200', email: 'france.sizwe@fuelnow.co.za',
    status: 'on_delivery', zone: 'Durban North & Morningside', province: 'KwaZulu-Natal',
    truck: 'FN-TRK-004 (Isuzu NMR)', rating: 4.9, totalDeliveries: 1247, joinedDate: '2023-03-15', avatar: 'FS',
    compliance: [
      { name: 'PrDP Licence', expiryDate: '2026-11-30', status: 'valid' },
      { name: 'Hazmat Certificate', expiryDate: '2025-08-31', status: 'expiring_soon' },
      { name: 'Vehicle Roadworthy', expiryDate: '2026-04-01', status: 'valid' },
      { name: 'Criminal Clearance', expiryDate: '2026-02-28', status: 'valid' },
    ],
  },
  {
    id: 'DRV-002', name: 'Sipho Mthembu', phone: '+27 71 200 3300', email: 'sipho.mthembu@fuelnow.co.za',
    status: 'on_delivery', zone: 'Westville & Pinetown', province: 'KwaZulu-Natal',
    truck: 'FN-TRK-007 (Isuzu NMR)', rating: 4.7, totalDeliveries: 892, joinedDate: '2023-07-01', avatar: 'SM',
    compliance: [
      { name: 'PrDP Licence', expiryDate: '2025-09-15', status: 'expiring_soon' },
      { name: 'Hazmat Certificate', expiryDate: '2026-06-30', status: 'valid' },
      { name: 'Vehicle Roadworthy', expiryDate: '2026-01-15', status: 'valid' },
      { name: 'Criminal Clearance', expiryDate: '2025-07-31', status: 'expired' },
    ],
  },
  {
    id: 'DRV-003', name: 'Bongani Zulu', phone: '+27 63 300 4400', email: 'bongani.zulu@fuelnow.co.za',
    status: 'active', zone: 'Durban Central & Berea', province: 'KwaZulu-Natal',
    truck: 'FN-TRK-002 (Mercedes Atego)', rating: 4.8, totalDeliveries: 1034, joinedDate: '2022-11-20', avatar: 'BZ',
    compliance: [
      { name: 'PrDP Licence', expiryDate: '2027-01-31', status: 'valid' },
      { name: 'Hazmat Certificate', expiryDate: '2026-09-30', status: 'valid' },
      { name: 'Vehicle Roadworthy', expiryDate: '2026-03-28', status: 'valid' },
      { name: 'Criminal Clearance', expiryDate: '2026-01-31', status: 'valid' },
    ],
  },
  {
    id: 'DRV-004', name: 'Lungelo Cele', phone: '+27 83 400 5500', email: 'lungelo.cele@fuelnow.co.za',
    status: 'on_delivery', zone: 'Umlazi & Chatsworth', province: 'KwaZulu-Natal',
    truck: 'FN-TRK-009 (Isuzu NMR)', rating: 4.6, totalDeliveries: 621, joinedDate: '2024-01-10', avatar: 'LC',
    compliance: [
      { name: 'PrDP Licence', expiryDate: '2026-05-31', status: 'valid' },
      { name: 'Hazmat Certificate', expiryDate: '2025-08-01', status: 'expiring_soon' },
      { name: 'Vehicle Roadworthy', expiryDate: '2026-07-31', status: 'valid' },
      { name: 'Criminal Clearance', expiryDate: '2026-06-30', status: 'valid' },
    ],
  },
  {
    id: 'DRV-005', name: 'Sibusiso Hadebe', phone: '+27 79 500 6600', email: 'sibusiso.hadebe@fuelnow.co.za',
    status: 'offline', zone: 'Berea & Musgrave', province: 'KwaZulu-Natal',
    truck: 'FN-TRK-003 (Isuzu NMR)', rating: 4.5, totalDeliveries: 458, joinedDate: '2024-04-05', avatar: 'SH',
    compliance: [
      { name: 'PrDP Licence', expiryDate: '2025-06-30', status: 'expired' },
      { name: 'Hazmat Certificate', expiryDate: '2026-12-31', status: 'valid' },
      { name: 'Vehicle Roadworthy', expiryDate: '2025-09-30', status: 'expiring_soon' },
      { name: 'Criminal Clearance', expiryDate: '2026-05-31', status: 'valid' },
    ],
  },
  {
    id: 'DRV-006', name: 'Lindiwe Mokoena', phone: '+27 82 600 7700', email: 'lindiwe.mokoena@fuelnow.co.za',
    status: 'active', zone: 'Sandton & Rosebank', province: 'Gauteng',
    truck: 'FN-TRK-011 (Mercedes Atego)', rating: 4.9, totalDeliveries: 312, joinedDate: '2024-06-20', avatar: 'LM',
    compliance: [
      { name: 'PrDP Licence', expiryDate: '2027-03-31', status: 'valid' },
      { name: 'Hazmat Certificate', expiryDate: '2026-11-30', status: 'valid' },
      { name: 'Vehicle Roadworthy', expiryDate: '2026-09-30', status: 'valid' },
      { name: 'Criminal Clearance', expiryDate: '2026-12-31', status: 'valid' },
    ],
  },
];

const RATES_DATA: FuelRate[] = [
  { fuelType: 'Petrol 95', pricePerLitre: 24.67, lastUpdated: new Date(Date.now() - 3600000).toISOString(), source: 'api' },
  { fuelType: 'Petrol 93', pricePerLitre: 24.15, lastUpdated: new Date(Date.now() - 3600000).toISOString(), source: 'api' },
  { fuelType: 'Diesel 50ppm', pricePerLitre: 22.48, lastUpdated: new Date(Date.now() - 7200000).toISOString(), source: 'manual' },
  { fuelType: 'Diesel 500ppm', pricePerLitre: 21.88, lastUpdated: new Date(Date.now() - 7200000).toISOString(), source: 'manual' },
];

const REVIEWS_DATA: Review[] = [
  { id: 'REV-001', customerName: 'Thabo Nkosi', driverName: 'France Sizwe', orderId: 'ORD-8821', rating: 5, comment: 'Excellent service! France was punctual and professional. Will definitely use FuelNow again.', date: new Date(Date.now() - 1.5 * 3600000).toISOString(), flagged: false },
  { id: 'REV-002', customerName: 'Pieter van der Berg', driverName: 'Bongani Zulu', orderId: 'ORD-8819', rating: 4, comment: 'Good delivery, arrived within the estimated time. Truck was clean and professional.', date: new Date(Date.now() - 3.4 * 3600000).toISOString(), flagged: false },
  { id: 'REV-003', customerName: 'Ayanda Mkhize', driverName: 'Lungelo Cele', orderId: 'ORD-8817', rating: 5, comment: 'Fantastic experience! Quick delivery and the driver was very friendly.', date: new Date(Date.now() - 5.4 * 3600000).toISOString(), flagged: false },
  { id: 'REV-004', customerName: 'Fatima Moosa', driverName: 'Sibusiso Hadebe', orderId: 'ORD-8814', rating: 2, comment: 'Driver was late and rude when I asked about the delay. Not happy at all.', date: new Date(Date.now() - 7.5 * 3600000).toISOString(), flagged: true },
  { id: 'REV-005', customerName: 'Heinrich Erasmus', driverName: 'France Sizwe', orderId: 'ORD-8813', rating: 5, comment: 'Always a pleasure using FuelNow! France is the best driver — always on time.', date: new Date(Date.now() - 9.3 * 3600000).toISOString(), flagged: false },
  { id: 'REV-006', customerName: 'Priya Naidoo', driverName: 'Sibusiso Hadebe', orderId: 'ORD-8810', rating: 3, comment: 'Delivery was okay but took longer than expected. Communication could be better.', date: new Date(Date.now() - 13.4 * 3600000).toISOString(), flagged: false },
];

const SOS_DATA: SOSAlert[] = [
  { id: 'SOS-021', driverName: 'Sipho Mthembu', location: '45 Jan Hofmeyr Rd', suburb: 'Westville', province: 'KwaZulu-Natal', raisedAt: new Date(Date.now() - 8 * 60000).toISOString(), severity: 'critical', resolved: false, note: 'Driver reported a vehicle breakdown on active delivery. Customer waiting.' },
  { id: 'SOS-020', driverName: 'Lungelo Cele', location: '3 Steve Biko Rd', suburb: 'Umlazi', province: 'KwaZulu-Natal', raisedAt: new Date(Date.now() - 35 * 60000).toISOString(), severity: 'warning', resolved: false, note: 'Fuel spill reported near delivery point. Area cordoned off, awaiting hazmat team.' },
  { id: 'SOS-019', driverName: 'France Sizwe', location: '22 Ridge Rd', suburb: 'Morningside', province: 'KwaZulu-Natal', raisedAt: new Date(Date.now() - 2 * 3600000).toISOString(), severity: 'warning', resolved: true, note: 'Minor road accident — no injuries. Vehicle damage assessed.' },
];

const ADMIN_USERS: AdminUser[] = [
  { id: 'ADM-001', name: 'Muhammed Safwaan', email: 'safwaan@fuelnow.co.za', role: 'Super Admin', lastLogin: new Date(Date.now() - 30 * 60000).toISOString(), active: true },
  { id: 'ADM-002', name: 'Rohan Pillay', email: 'rohan.pillay@fuelnow.co.za', role: 'Ops Manager', lastLogin: new Date(Date.now() - 2 * 3600000).toISOString(), active: true },
  { id: 'ADM-003', name: 'Karabo Sithole', email: 'karabo.sithole@fuelnow.co.za', role: 'Support Agent', lastLogin: new Date(Date.now() - 5 * 3600000).toISOString(), active: true },
  { id: 'ADM-004', name: 'Aisha Cassim', email: 'aisha.cassim@fuelnow.co.za', role: 'Support Agent', lastLogin: new Date(Date.now() - 24 * 3600000).toISOString(), active: false },
];

const KPI_SUMMARY: KPISummary = {
  todayOrders: 47,
  todayRevenue: 108450.60,
  activeDrivers: 4,
  avgDeliveryMinutes: 31,
  ordersChange: +12.4,
  revenueChange: +8.7,
  driversChange: 0,
  avgTimeChange: -3.2,
};

// ─── API Functions ────────────────────────────────────────────────────────────

// POST /auth/login
export async function adminLogin(email: string, password: string) {
  await delay(600);
  if (email && password.length >= 4) {
    const user = ADMIN_USERS.find(u => u.email === email) ?? ADMIN_USERS[0];
    return { token: 'mock-admin-jwt-token', user };
  }
  throw new Error('Invalid credentials. Please try again.');
}

// GET /kpi/summary
export async function getKPISummary(): Promise<KPISummary> {
  await delay(300);
  return KPI_SUMMARY;
}

// GET /orders
export async function getOrders(): Promise<Order[]> {
  await delay(400);
  return ORDERS_DATA;
}

// GET /drivers
export async function getDrivers(): Promise<Driver[]> {
  await delay(400);
  return DRIVERS_DATA;
}

// GET /drivers/:id/compliance
export async function getDriverCompliance(id: string): Promise<ComplianceDoc[]> {
  await delay(300);
  const driver = DRIVERS_DATA.find(d => d.id === id);
  return driver?.compliance ?? [];
}

// PATCH /rates
export async function updateRate(fuelType: FuelType, pricePerLitre: number): Promise<FuelRate> {
  await delay(500);
  const idx = RATES_DATA.findIndex(r => r.fuelType === fuelType);
  if (idx !== -1) {
    RATES_DATA[idx] = { ...RATES_DATA[idx], pricePerLitre, lastUpdated: new Date().toISOString(), source: 'manual' };
    return RATES_DATA[idx];
  }
  throw new Error('Fuel type not found');
}

// GET /rates/current
export async function getRates(): Promise<FuelRate[]> {
  await delay(300);
  return [...RATES_DATA];
}

// GET /reviews
export async function getReviews(): Promise<Review[]> {
  await delay(350);
  return REVIEWS_DATA;
}

// GET /sos/alerts
export async function getSOSAlerts(): Promise<SOSAlert[]> {
  await delay(300);
  return SOS_DATA;
}

// PATCH /sos/:id/resolve
export async function resolveSOSAlert(id: string): Promise<void> {
  await delay(500);
  const alert = SOS_DATA.find(a => a.id === id);
  if (alert) alert.resolved = true;
}

// GET /reports/export
export async function exportReport(_from: string, _to: string): Promise<void> {
  await delay(800);
  // Mock: would trigger CSV/Excel download in production
}

// GET /admin/users
export async function getAdminUsers(): Promise<AdminUser[]> {
  await delay(300);
  return ADMIN_USERS;
}

export const PROVINCES = [
  'Gauteng', 'KwaZulu-Natal', 'Western Cape', 'Eastern Cape',
  'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape',
];

export const FUEL_TYPES: FuelType[] = ['Petrol 95', 'Petrol 93', 'Diesel 50ppm', 'Diesel 500ppm'];

// POST /drivers
export async function createDriver(data: Partial<Driver>): Promise<Driver> {
  await delay(500);
  const newDriver: Driver = {
    id: `DRV-00${DRIVERS_DATA.length + 1}`,
    name: data.name || 'New Driver',
    phone: data.phone || '+27 00 000 0000',
    email: data.email || 'driver@fuelnow.co.za',
    status: 'offline',
    zone: data.zone || 'Unassigned',
    province: data.province || 'KwaZulu-Natal',
    truck: data.truck || 'Unassigned',
    rating: 0,
    totalDeliveries: 0,
    joinedDate: new Date().toISOString().split('T')[0],
    avatar: (data.name || 'N D').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
    compliance: [],
  };
  DRIVERS_DATA.push(newDriver);
  return newDriver;
}

// PUT /drivers/:id
export async function updateDriver(id: string, data: Partial<Driver>): Promise<Driver> {
  await delay(500);
  const idx = DRIVERS_DATA.findIndex(d => d.id === id);
  if (idx === -1) throw new Error('Driver not found');
  DRIVERS_DATA[idx] = { ...DRIVERS_DATA[idx], ...data };
  return DRIVERS_DATA[idx];
}

// DELETE /drivers/:id
export async function deleteDriver(id: string): Promise<void> {
  await delay(500);
  const idx = DRIVERS_DATA.findIndex(d => d.id === id);
  if (idx !== -1) DRIVERS_DATA.splice(idx, 1);
}

// POST /admin/users
export async function createAdminUser(data: Partial<AdminUser>): Promise<AdminUser> {
  await delay(500);
  const newUser: AdminUser = {
    id: `ADM-00${ADMIN_USERS.length + 1}`,
    name: data.name || 'New Admin',
    email: data.email || 'admin@fuelnow.co.za',
    role: data.role as any || 'Support Agent',
    lastLogin: new Date().toISOString(),
    active: true,
  };
  ADMIN_USERS.push(newUser);
  return newUser;
}
