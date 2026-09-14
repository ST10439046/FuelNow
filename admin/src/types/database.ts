export type UserStatus = 'active' | 'inactive' | 'suspended';
export type AdminRole = 'superadmin' | 'admin' | 'support';

export interface User {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  status: UserStatus;
  created_at?: string;
}

export interface AdminUser {
  id: string;
  role: AdminRole;
  last_login_at: string | null;
}

export interface Customer {
  id: string;
  loyalty_tier: string;
  fuel_points_balance: number;
}

export interface Driver {
  id: string;
  licence_number: string;
  rating: number;
  status: string;
  zone: string | null;
  province: string;
}

export interface Address {
  address_id: string;
  customer_id: string;

  label: string | null;

  unit_number: string | null;
  street_number: string | null;
  street_name: string | null;

  suburb: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;

  delivery_instructions: string | null;
  is_default: boolean | null;

  latitude: number | null;
  longitude: number | null;
}

export interface FuelType {
  id: string;
  name: string;
  description: string | null;
}

export interface FuelRate {
  id: string;
  fuel_type_id: string;
  price_per_litre: number;
  source: string;
  last_updated_by: string | null;
}

export interface Order {
  id: string;
  customer_id: string;
  driver_id: string | null;
  address_id: string | null;
  fuel_type_id: string | null;
  order_method: string | null;
  volume_litres: number | null;
  rand_amount: number | null;
  delivery_type: string;
  scheduled_date_time: string | null;
  status: string;
  delivery_pin: string | null;
  delivered_at: string | null;
  created_at?: string;
  rating : number | null;
}



export interface Payment {
  id: string;
  order_id: string;
  payment_method_id: string;
  fuel_subtotal: number;
  delivery_fee: number;
  service_fee: number;
  vat_amount: number | null;
  total_amount: number | null;
  status: string;
  charged_at: string | null;
}

export interface Review {
  id: string;
  order_id: string;
  customer_id: string;
  driver_id: string;
  rating: number;
  comment: string | null;
  status: string;
}

export interface Vehicle {
  id: string;
  driver_id: string;
  registration_number: string;
  make: string;
  model: string;
  capacity_litres: number;
}

export interface ComplianceDocument {
  id: string;
  driver_id: string;
  document_type: string;
  document_number: string;
  issue_date: string;
  expiry_date: string;
  status: string;
}

export interface SosAlert {
  id: string;
  driver_id: string;
  order_id: string | null;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
  severity: string;
  status: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface RewardAccount {
  id: string;
  customer_id: string;
  points_balance: number;
  tier: string;
}

export interface PlatformSettings {
  id: string;
  auto_assign_orders: boolean;
  customer_sms_notifications: boolean;
  updated_by: string | null;
}
