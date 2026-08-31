// ─────────────────────────────────────────────────────────────────────────────
// FuelNow Mock API Service
// Functions are named after real REST endpoints to reflect realistic API calls.
// All functions include an artificial delay (600–1200ms) so loading states look
// real during UI demonstrations.
// ─────────────────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// ── Mock data stores ─────────────────────────────────────────────────────────

export interface FuelRate {
  type: 'Petrol 93' | 'Petrol 95' | 'Diesel 50ppm' | 'Diesel 500ppm';
  pricePerLitre: number; // ZAR
  change: number; // cents change from yesterday
  trend: 'up' | 'down' | 'flat';
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
  avatar?: string;
  savedAddresses: Address[];
  paymentMethods: PaymentMethod[];
}

export interface Address {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  street: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  coordinates: { lat: number; lng: number };
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'eft' | 'mobile_money';
  label: string;
  last4?: string;
  brand?: 'visa' | 'mastercard';
  isDefault: boolean;
}

export interface OrderItem {
  fuelType: FuelRate['type'];
  litres: number;
  pricePerLitre: number;
  subtotal: number;
}

export interface Order {
  id: string;
  status:
    | 'pending'
    | 'finding_driver'
    | 'driver_assigned'
    | 'en_route'
    | 'arriving'
    | 'delivered'
    | 'cancelled';
  item: OrderItem;
  deliveryAddress: Address;
  scheduledAt: string | null; // ISO string or null for "now"
  paymentMethod: PaymentMethod;
  deliveryFee: number;
  totalAmount: number;
  driver?: Driver;
  pin: string;
  createdAt: string;
  deliveredAt?: string;
  estimatedArrivalMinutes: number;
  distanceKm: number;
  rating?: number;
  ratingComment?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  rating: number;
  totalDeliveries: number;
  vehicleReg: string;
  vehicleModel: string;
  vehicleColor: string;
  photo?: string;
  coordinates: { lat: number; lng: number };
  stationName: string;
}

// ── Static mock data ──────────────────────────────────────────────────────────

const MOCK_USER: User = {
  id: 'usr_001',
  name: 'Muhammed',
  email: 'muhammedkhan@impactdurban.co.za',
  phone: '082 456 7890',
  loyaltyPoints: 340,
  savedAddresses: [
    {
      id: 'addr_001',
      label: 'Home',
      street: '18 Kenneth Kaunda Road',
      suburb: 'Durban North',
      city: 'Durban',
      province: 'KwaZulu-Natal',
      postalCode: '4051',
      coordinates: { lat: -29.8000, lng: 31.0333 },
    },
    {
      id: 'addr_002',
      label: 'Work',
      street: '45 Jan Hofmeyr Road',
      suburb: 'Westville',
      city: 'Durban',
      province: 'KwaZulu-Natal',
      postalCode: '3629',
      coordinates: { lat: -29.8256, lng: 30.9312 },
    },
  ],
  paymentMethods: [
    {
      id: 'pm_001',
      type: 'card',
      label: 'FNB Cheque ••• 4821',
      last4: '4821',
      brand: 'visa',
      isDefault: true,
    },
    {
      id: 'pm_002',
      type: 'card',
      label: 'Nedbank Credit ••• 9934',
      last4: '9934',
      brand: 'mastercard',
      isDefault: false,
    },
    {
      id: 'pm_003',
      type: 'mobile_money',
      label: 'SnapScan',
      isDefault: false,
    },
  ],
};

const MOCK_RATES: FuelRate[] = [
  { type: 'Petrol 93', pricePerLitre: 22.87, change: -8, trend: 'down' },
  { type: 'Petrol 95', pricePerLitre: 23.45, change: -8, trend: 'down' },
  { type: 'Diesel 50ppm', pricePerLitre: 21.63, change: +12, trend: 'up' },
  { type: 'Diesel 500ppm', pricePerLitre: 21.38, change: +12, trend: 'up' },
];

export const MOCK_DRIVER: Driver = {
  id: 'drv_001',
  name: 'France Sizwe',
  phone: '060 123 4567',
  rating: 4.8,
  totalDeliveries: 1247,
  vehicleReg: 'ND 456-789',
  vehicleModel: 'Toyota Hilux',
  vehicleColor: 'White',
  stationName: 'Engen Durban North',
  coordinates: { lat: -29.7990, lng: 31.0340 },
};

const MOCK_ORDERS: Order[] = [
  {
    id: 'ord_7821',
    status: 'delivered',
    item: {
      fuelType: 'Petrol 95',
      litres: 40,
      pricePerLitre: 23.45,
      subtotal: 938.0,
    },
    deliveryAddress: MOCK_USER.savedAddresses[0],
    scheduledAt: null,
    paymentMethod: MOCK_USER.paymentMethods[0],
    deliveryFee: 49.0,
    totalAmount: 987.0,
    driver: MOCK_DRIVER,
    pin: '5821',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(),
    estimatedArrivalMinutes: 25,
    distanceKm: 3.2,
    rating: 5,
    ratingComment: 'Super fast, France was professional!',
  },
  {
    id: 'ord_7756',
    status: 'delivered',
    item: {
      fuelType: 'Diesel 50ppm',
      litres: 60,
      pricePerLitre: 21.63,
      subtotal: 1297.8,
    },
    deliveryAddress: MOCK_USER.savedAddresses[1],
    scheduledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    paymentMethod: MOCK_USER.paymentMethods[1],
    deliveryFee: 49.0,
    totalAmount: 1346.8,
    driver: {
      ...MOCK_DRIVER,
      id: 'drv_002',
      name: 'Ruan van der Merwe',
      phone: '072 987 6543',
      rating: 4.6,
      totalDeliveries: 834,
      stationName: 'Total Westville',
    },
    pin: '3394',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 18 * 60 * 1000).toISOString(),
    estimatedArrivalMinutes: 18,
    distanceKm: 2.1,
    rating: 4,
    ratingComment: 'On time, good service.',
  },
  {
    id: 'ord_7634',
    status: 'delivered',
    item: {
      fuelType: 'Petrol 95',
      litres: 25,
      pricePerLitre: 23.45,
      subtotal: 586.25,
    },
    deliveryAddress: MOCK_USER.savedAddresses[0],
    scheduledAt: null,
    paymentMethod: MOCK_USER.paymentMethods[0],
    deliveryFee: 49.0,
    totalAmount: 635.25,
    driver: MOCK_DRIVER,
    pin: '1172',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000 + 22 * 60 * 1000).toISOString(),
    estimatedArrivalMinutes: 22,
    distanceKm: 3.2,
    rating: 5,
  },
];

// In-memory "active" order state for tracking simulation
let activeOrder: Order | null = null;

// ── API Functions ──────────────────────────────────────────────────────────────

/** POST /auth/signup */
export async function signUp(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{ success: boolean; user: User; token: string }> {
  await delay(rand(800, 1200));
  if (!data.email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  return {
    success: true,
    user: { ...MOCK_USER, name: data.name, email: data.email, phone: data.phone },
    token: 'mock_jwt_token_' + Date.now(),
  };
}

/** POST /auth/login */
export async function login(data: {
  email: string;
  password: string;
}): Promise<{ success: boolean; user: User; token: string }> {
  await delay(rand(600, 1000));
  if (data.password.length < 6) {
    throw new Error('Incorrect email or password. Please try again.');
  }
  return {
    success: true,
    user: MOCK_USER,
    token: 'mock_jwt_token_' + Date.now(),
  };
}

/** POST /auth/verify-otp */
export async function verifyOtp(data: {
  phone: string;
  otp: string;
}): Promise<{ success: boolean }> {
  await delay(rand(700, 1100));
  // Accept any 6-digit OTP for demo
  if (data.otp.length !== 6) throw new Error('Invalid OTP. Please try again.');
  return { success: true };
}

/** POST /auth/forgot-password */
export async function forgotPassword(data: {
  email: string;
}): Promise<{ success: boolean; message: string }> {
  await delay(rand(600, 900));
  return {
    success: true,
    message: `A reset link has been sent to ${data.email}.`,
  };
}

/** GET /rates/current */
export async function getCurrentRates(): Promise<FuelRate[]> {
  await delay(rand(400, 700));
  // Simulate slight price fluctuations for realism
  return MOCK_RATES.map((r) => ({
    ...r,
    pricePerLitre: +(r.pricePerLitre + (Math.random() - 0.5) * 0.02).toFixed(2),
  }));
}

/** GET /auth/me */
export async function getMe(): Promise<User> {
  await delay(rand(300, 600));
  return MOCK_USER;
}

/** POST /orders */
export async function createOrder(data: {
  fuelType: FuelRate['type'];
  litres: number;
  deliveryAddressId: string;
  scheduledAt: string | null;
  paymentMethodId: string;
}): Promise<Order> {
  await delay(rand(900, 1400));
  const rate = MOCK_RATES.find((r) => r.type === data.fuelType) ?? MOCK_RATES[1];
  const subtotal = +(rate.pricePerLitre * data.litres).toFixed(2);
  const deliveryFee = 49.0;
  const address =
    MOCK_USER.savedAddresses.find((a) => a.id === data.deliveryAddressId) ??
    MOCK_USER.savedAddresses[0];
  const pm =
    MOCK_USER.paymentMethods.find((p) => p.id === data.paymentMethodId) ??
    MOCK_USER.paymentMethods[0];

  activeOrder = {
    id: 'ord_' + rand(8000, 9999),
    status: 'finding_driver',
    item: {
      fuelType: data.fuelType,
      litres: data.litres,
      pricePerLitre: rate.pricePerLitre,
      subtotal,
    },
    deliveryAddress: address,
    scheduledAt: data.scheduledAt,
    paymentMethod: pm,
    deliveryFee,
    totalAmount: +(subtotal + deliveryFee).toFixed(2),
    driver: undefined,
    pin: String(rand(1000, 9999)),
    createdAt: new Date().toISOString(),
    estimatedArrivalMinutes: rand(18, 35),
    distanceKm: +(Math.random() * 4 + 1.5).toFixed(1),
  };
  return activeOrder;
}

/** GET /orders/:id/track */
export async function trackOrder(id: string): Promise<Order> {
  await delay(rand(400, 700));
  if (activeOrder && activeOrder.id === id) {
    // Simulate progression
    if (activeOrder.status === 'finding_driver') {
      activeOrder = { ...activeOrder, status: 'driver_assigned', driver: MOCK_DRIVER };
    } else if (activeOrder.status === 'driver_assigned') {
      activeOrder = { ...activeOrder, status: 'en_route' };
    }
    return activeOrder;
  }
  const hist = MOCK_ORDERS.find((o) => o.id === id);
  if (hist) return hist;
  throw new Error(`Order ${id} not found.`);
}

/** POST /orders/:id/confirm-delivery */
export async function confirmDelivery(
  id: string,
  pin: string,
): Promise<{ success: boolean; order: Order }> {
  await delay(rand(600, 1000));
  const order = activeOrder?.id === id ? activeOrder : MOCK_ORDERS.find((o) => o.id === id);
  if (!order) throw new Error('Order not found.');
  // Mock: accept any 4-digit PIN — this is a demo app
  if (activeOrder?.id === id) {
    activeOrder = {
      ...activeOrder,
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
    };
    return { success: true, order: activeOrder };
  }
  return { success: true, order: { ...order, status: 'delivered' } };
}

/** GET /orders */
export async function getOrderHistory(): Promise<Order[]> {
  await delay(rand(500, 800));
  return [...MOCK_ORDERS];
}

/** POST /orders/:id/rate */
export async function rateOrder(
  id: string,
  data: { rating: number; comment?: string },
): Promise<{ success: boolean }> {
  await delay(rand(400, 700));
  const order = MOCK_ORDERS.find((o) => o.id === id);
  if (order) {
    order.rating = data.rating;
    order.ratingComment = data.comment;
  }
  return { success: true };
}

/** GET /rewards/balance */
export async function getRewardsBalance(): Promise<{
  points: number;
  pointsToNextReward: number;
  nextRewardValue: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  history: Array<{ date: string; description: string; points: number }>;
}> {
  await delay(rand(400, 700));
  return {
    points: MOCK_USER.loyaltyPoints,
    pointsToNextReward: 500 - MOCK_USER.loyaltyPoints,
    nextRewardValue: 49.0, // free delivery
    tier: 'Silver',
    history: [
      { date: '2026-07-26', description: 'Order ord_7821', points: +80 },
      { date: '2026-07-23', description: 'Order ord_7756', points: +120 },
      { date: '2026-07-17', description: 'Order ord_7634', points: +50 },
      { date: '2026-07-10', description: 'Referral bonus — Thabo M.', points: +100 },
    ],
  };
}

/** GET /notifications */
export async function getNotifications(): Promise<
  Array<{
    id: string;
    title: string;
    body: string;
    type: 'order' | 'promo' | 'system';
    isRead: boolean;
    createdAt: string;
  }>
> {
  await delay(rand(300, 600));
  return [
    {
      id: 'notif_001',
      title: 'Driver on the way! 🚛',
      body: 'France Sizwe is heading to 18 Kenneth Kaunda Road. ETA 23 min.',
      type: 'order',
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif_002',
      title: 'Petrol price update',
      body: 'Petrol 95 dropped by 8c/L from midnight tonight. Save on your next fill!',
      type: 'promo',
      isRead: false,
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif_003',
      title: 'Order #7756 delivered ✅',
      body: 'Your 60L diesel was delivered successfully to 45 Jan Hofmeyr Road, Westville.',
      type: 'order',
      isRead: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif_004',
      title: "You've earned 80 FuelPoints!",
      body: 'Keep ordering to reach Silver tier and unlock a free delivery.',
      type: 'promo',
      isRead: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif_005',
      title: 'Scheduled delivery tomorrow ⏰',
      body: 'Your 40L Petrol 95 delivery is scheduled for tomorrow at 08:00.',
      type: 'order',
      isRead: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

/** POST /payment-methods */
export async function addPaymentMethod(pm: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> {
  await delay(rand(400, 700));
  const newMethod: PaymentMethod = {
    ...pm,
    id: `pm_${Date.now()}`,
  };
  MOCK_USER.paymentMethods.push(newMethod);
  return newMethod;
}

/** Expose mock user for pre-population in forms */
export { MOCK_USER, MOCK_RATES };

// ─────────────────────────────────────────────────────────────────────────────
// PART 2 — Driver-side interfaces & mock data
// ─────────────────────────────────────────────────────────────────────────────

export interface DriverDocument {
  id: string;
  type: "Driver's Licence" | 'Professional Driver Permit' | 'Hazmat Certificate' | 'Vehicle Permit';
  number: string;
  expiryDate: string; // ISO date string
  isExpired: boolean;
  isExpiringSoon: boolean; // within 30 days
}

export interface DriverEarningsEntry {
  id: string;
  date: string;
  fuelType: string;
  litres: number;
  amount: number;
  address: string;
  status: 'completed' | 'cancelled';
}

export interface DriverEarnings {
  today: number;
  thisWeek: number;
  thisMonth: number;
  totalDeliveries: number;
  rating: number;
  dailyTarget: number;
  deliveryHistory: DriverEarningsEntry[];
}

export interface AvailableOrder {
  id: string;
  customerInitials: string;
  fuelType: FuelRate['type'];
  litres: number;
  totalZAR: number;
  address: string;
  suburb: string;
  distanceKm: number;
  estimatedMinutes: number;
  coordinates: { lat: number; lng: number };
}

// ── Driver static mock data ────────────────────────────────────────────────────

const DRIVER_DOCUMENTS: DriverDocument[] = [
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
];

const DRIVER_EARNINGS_DATA: DriverEarnings = {
  today: 892.50,
  thisWeek: 4310.00,
  thisMonth: 16840.00,
  totalDeliveries: 1247,
  rating: 4.8,
  dailyTarget: 1500,
  deliveryHistory: [
    { id: 'ord_7821', date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), fuelType: 'Petrol 95', litres: 40, amount: 987.00, address: '18 Kenneth Kaunda Rd, Durban North', status: 'completed' },
    { id: 'ord_7756', date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), fuelType: 'Diesel 50ppm', litres: 60, amount: 1348.80, address: '45 Jan Hofmeyr Rd, Westville', status: 'completed' },
    { id: 'ord_7690', date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), fuelType: 'Petrol 93', litres: 30, amount: 735.10, address: '12 Umgeni Rd, Durban Central', status: 'completed' },
  ],
};

const AVAILABLE_ORDERS_DATA: AvailableOrder[] = [
  {
    id: 'avl_001',
    customerInitials: 'T.N.',
    fuelType: 'Petrol 95',
    litres: 50,
    totalZAR: 1221.50,
    address: '8 Windermere Road',
    suburb: 'Morningside',
    distanceKm: 2.4,
    estimatedMinutes: 12,
    coordinates: { lat: -29.8150, lng: 31.0280 },
  },
  {
    id: 'avl_002',
    customerInitials: 'S.M.',
    fuelType: 'Diesel 50ppm',
    litres: 80,
    totalZAR: 1779.40,
    address: '3 Broad Street',
    suburb: 'Pinetown',
    distanceKm: 5.7,
    estimatedMinutes: 24,
    coordinates: { lat: -29.8180, lng: 30.8670 },
  },
  {
    id: 'avl_003',
    customerInitials: 'P.D.',
    fuelType: 'Petrol 93',
    litres: 35,
    totalZAR: 849.45,
    address: '22 Ridge Road',
    suburb: 'Berea',
    distanceKm: 3.1,
    estimatedMinutes: 17,
    coordinates: { lat: -29.8450, lng: 31.0130 },
  },
];

// ── Driver-side API functions ─────────────────────────────────────────────────

/** GET /orders/available */
export async function getAvailableOrders(): Promise<AvailableOrder[]> {
  await delay(rand(400, 800));
  return AVAILABLE_ORDERS_DATA;
}

/** POST /orders/:id/accept */
export async function acceptOrder(orderId: string): Promise<{ success: boolean; order: AvailableOrder }> {
  await delay(rand(600, 1000));
  const order = AVAILABLE_ORDERS_DATA.find(o => o.id === orderId);
  if (!order) throw new Error('Order not found');
  return { success: true, order };
}

/** PATCH /orders/:id/status */
export async function updateOrderStatus(
  orderId: string,
  status: 'en_route' | 'arrived' | 'dispensing' | 'completed'
): Promise<{ success: boolean; status: string }> {
  await delay(rand(400, 700));
  return { success: true, status };
}

/** POST /sos */
export async function postSOS(
  driverId: string,
  location: { lat: number; lng: number }
): Promise<{ success: boolean; referenceNumber: string; message: string }> {
  await delay(rand(800, 1200));
  return {
    success: true,
    referenceNumber: `SOS-${Date.now().toString().slice(-6)}`,
    message: 'Emergency services and FuelNow dispatch have been notified. Stay calm.',
  };
}

/** GET /driver/earnings */
export async function getDriverEarnings(): Promise<DriverEarnings> {
  await delay(rand(400, 800));
  return DRIVER_EARNINGS_DATA;
}

/** GET /driver/documents */
export async function getDriverDocuments(): Promise<DriverDocument[]> {
  await delay(rand(400, 700));
  return DRIVER_DOCUMENTS;
}
