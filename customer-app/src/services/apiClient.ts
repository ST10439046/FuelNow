import { supabase } from './supabase';
import {
  User,
  Customer,
  Address,
  Order,
  Payment,
  Review,
  RewardAccount,
  FuelType,
  FuelRate,
  UserStatus,
} from '../types/database';

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Customer App API Client
 * Wraps Supabase RPC functions from the database schema to provide typed CRUD operations.
 */
export class CustomerApiClient {
  // ───────────────────────────────────────────────────────────────────────────
  // USER & AUTH RPCs
  // ───────────────────────────────────────────────────────────────────────────

  static async signInWithPassword(email: string, password: string): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase.rpc('sign_in_with_password', {
        p_email: email,
        p_password: password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async getUser(userId: string): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase.rpc('get_user', {
        p_user_id: userId,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async createUser(params: {
    userId?: string;
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    passwordHash?: string;
    status?: UserStatus;
  }): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase.rpc('create_user', {
        p_user_id: params.userId,
        p_full_name: params.fullName,
        p_email: params.email,
        p_phone_number: params.phoneNumber,
        p_password_hash: params.passwordHash,
        p_status: params.status || 'active',
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async updateUser(params: {
    userId: string;
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    passwordHash?: string;
    status?: UserStatus;
  }): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase.rpc('update_user', {
        p_user_id: params.userId,
        p_full_name: params.fullName,
        p_email: params.email,
        p_phone_number: params.phoneNumber,
        p_password_hash: params.passwordHash,
        p_status: params.status,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async deleteUser(userId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabase.rpc('delete_user', {
        p_user_id: userId,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async isCustomer(): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabase.rpc('is_customer');
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CUSTOMER PROFILE RPCs
  // ───────────────────────────────────────────────────────────────────────────

  static async getCustomer(customerId: string): Promise<ApiResponse<Customer>> {
    try {
      const { data, error } = await supabase.rpc('get_customer', {
        p_customer_id: customerId,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async createCustomer(customerId: string): Promise<ApiResponse<Customer>> {
    try {
      const { data, error } = await supabase.rpc('create_customer', {
        p_customer_id: customerId,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async updateCustomer(params: {
    customerId: string;
    loyaltyTier?: string;
    fuelPointsBalance?: number;
  }): Promise<ApiResponse<Customer>> {
    try {
      const { data, error } = await supabase.rpc('update_customer', {
        p_customer_id: params.customerId,
        p_loyalty_tier: params.loyaltyTier,
        p_fuel_points_balance: params.fuelPointsBalance,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async deleteCustomer(customerId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabase.rpc('delete_customer', {
        p_customer_id: customerId,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ADDRESS RPCs
  // ───────────────────────────────────────────────────────────────────────────

  static async getAddress(addressId: string): Promise<ApiResponse<Address>> {
    try {
      const { data, error } = await supabase.rpc('get_address', {
        p_address_id: addressId,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async createAddress(params: {
    customerId: string;
    label?: string;
    unitNumber?: string;
    streetNumber?: string;
    streetName?: string;
    suburb?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    deliveryInstructions?: string;
    isDefault?: boolean;
  }): Promise<ApiResponse<Address>> {
    try {
      const { data, error } = await supabase.rpc('create_address', {
        p_customer_id: params.customerId,
        p_label: params.label || 'Home',
        p_unit_number: params.unitNumber || null,
        p_street_number: params.streetNumber || null,
        p_street_name: params.streetName || null,
        p_suburb: params.suburb || null,
        p_city: params.city || null,
        p_province: params.province || 'KwaZulu-Natal',
        p_postal_code: params.postalCode || null,
        p_delivery_instructions: params.deliveryInstructions || null,
        p_is_default: params.isDefault ?? false,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async updateAddress(params: {
  addressId: string;
  customerId?: string;
  label?: string;
  unitNumber?: string;
  streetNumber?: string;
  streetName?: string;
  suburb?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  deliveryInstructions?: string;
  isDefault?: boolean;
}): Promise<ApiResponse<Address>> {
  try {
    const { data, error } = await supabase.rpc('update_address', {
      p_address_id: params.addressId,
      p_customer_id: params.customerId,
      p_label: params.label,
      p_unit_number: params.unitNumber,
      p_street_number: params.streetNumber,
      p_street_name: params.streetName,
      p_suburb: params.suburb,
      p_city: params.city,
      p_province: params.province,
      p_postal_code: params.postalCode,
      p_delivery_instructions: params.deliveryInstructions,
      p_is_default: params.isDefault,
    });

    if (error) {
      console.error('CustomerApiClient.updateAddress RPC error:', error);
      return {
        data: null,
        error,
      };
    }

    return {
      data: data as Address,
      error: null,
    };
  } catch (error) {
    console.error('CustomerApiClient.updateAddress error:', error);

    return {
      data: null,
      error: error instanceof Error
        ? error
        : new Error('Unable to update address.'),
    };
  }
}

  static async deleteAddress(addressId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabase.rpc('delete_address', {
        p_address_id: addressId,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ORDER RPCs
  // ───────────────────────────────────────────────────────────────────────────

  static async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    try {
      const { data, error } = await supabase.rpc('get_order', {
        p_order_id: orderId,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async createOrder(params: {
    customerId: string;
    driverId?: string;
    addressId?: string;
    fuelTypeId?: string;
    orderMethod?: string;
    volumeLitres?: number;
    randAmount?: number;
    deliveryType?: string;
    scheduledDateTime?: string;
    status?: string;
    deliveryPin?: string;
  }): Promise<ApiResponse<Order>> {
    try {
      const { data, error } = await supabase.rpc('create_order', {
        p_customer_id: params.customerId,
        p_driver_id: params.driverId || null,
        p_address_id: params.addressId || null,
        p_fuel_type_id: params.fuelTypeId || null,
        p_order_method: params.orderMethod || null,
        p_volume_litres: params.volumeLitres || null,
        p_rand_amount: params.randAmount || null,
        p_delivery_type: params.deliveryType || 'Deliver Now',
        p_scheduled_date_time: params.scheduledDateTime || null,
        p_status: params.status || 'PENDING_PAYMENT',
        p_delivery_pin: params.deliveryPin || null,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async updateOrder(params: {
    orderId: string;
    customerId?: string;
    driverId?: string;
    addressId?: string;
    fuelTypeId?: string;
    orderMethod?: string;
    volumeLitres?: number;
    randAmount?: number;
    deliveryType?: string;
    scheduledDateTime?: string;
    status?: string;
    deliveryPin?: string;
    deliveredAt?: string;
  }): Promise<ApiResponse<Order>> {
    try {
      const { data, error } = await supabase.rpc('update_order', {
        p_order_id: params.orderId,
        p_customer_id: params.customerId,
        p_driver_id: params.driverId,
        p_address_id: params.addressId,
        p_fuel_type_id: params.fuelTypeId,
        p_order_method: params.orderMethod,
        p_volume_litres: params.volumeLitres,
        p_rand_amount: params.randAmount,
        p_delivery_type: params.deliveryType,
        p_scheduled_date_time: params.scheduledDateTime,
        p_status: params.status,
        p_delivery_pin: params.deliveryPin,
        p_delivered_at: params.deliveredAt,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async deleteOrder(orderId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabase.rpc('delete_order', {
        p_order_id: orderId,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PAYMENT RPCs
  // ───────────────────────────────────────────────────────────────────────────

  static async getPayment(paymentId: string): Promise<ApiResponse<Payment>> {
    try {
      const { data, error } = await supabase.rpc('get_payment', {
        p_payment_id: paymentId,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async createPayment(params: {
    orderId: string;
    paymentMethodId: string;
    fuelSubtotal: number;
    deliveryFee?: number;
    serviceFee?: number;
    vatAmount?: number;
    totalAmount?: number;
    status?: string;
  }): Promise<ApiResponse<Payment>> {
    try {
      const { data, error } = await supabase.rpc('create_payment', {
        p_order_id: params.orderId,
        p_payment_method_id: params.paymentMethodId,
        p_fuel_subtotal: params.fuelSubtotal,
        p_delivery_fee: params.deliveryFee ?? 49.00,
        p_service_fee: params.serviceFee ?? 0.00,
        p_vat_amount: params.vatAmount || null,
        p_total_amount: params.totalAmount || null,
        p_status: params.status || 'PENDING',
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async updatePayment(params: {
    paymentId: string;
    orderId?: string;
    paymentMethodId?: string;
    fuelSubtotal?: number;
    deliveryFee?: number;
    serviceFee?: number;
    vatAmount?: number;
    totalAmount?: number;
    status?: string;
    chargedAt?: string;
  }): Promise<ApiResponse<Payment>> {
    try {
      const { data, error } = await supabase.rpc('update_payment', {
        p_payment_id: params.paymentId,
        p_order_id: params.orderId,
        p_payment_method_id: params.paymentMethodId,
        p_fuel_subtotal: params.fuelSubtotal,
        p_delivery_fee: params.deliveryFee,
        p_service_fee: params.serviceFee,
        p_vat_amount: params.vatAmount,
        p_total_amount: params.totalAmount,
        p_status: params.status,
        p_charged_at: params.chargedAt,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async deletePayment(paymentId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabase.rpc('delete_payment', {
        p_payment_id: paymentId,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REVIEW RPCs
  // ───────────────────────────────────────────────────────────────────────────

  static async getReview(reviewId: string): Promise<ApiResponse<Review>> {
    try {
      const { data, error } = await supabase.rpc('get_review', {
        p_review_id: reviewId,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async createReview(params: {
    orderId: string;
    customerId: string;
    driverId: string;
    rating: number;
    comment?: string;
    status?: string;
  }): Promise<ApiResponse<Review>> {
    try {
      const { data, error } = await supabase.rpc('create_review', {
        p_order_id: params.orderId,
        p_customer_id: params.customerId,
        p_driver_id: params.driverId,
        p_rating: params.rating,
        p_comment: params.comment || null,
        p_status: params.status || 'Published',
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async updateReview(params: {
    reviewId: string;
    orderId?: string;
    customerId?: string;
    driverId?: string;
    rating?: number;
    comment?: string;
    status?: string;
  }): Promise<ApiResponse<Review>> {
    try {
      const { data, error } = await supabase.rpc('update_review', {
        p_review_id: params.reviewId,
        p_order_id: params.orderId,
        p_customer_id: params.customerId,
        p_driver_id: params.driverId,
        p_rating: params.rating,
        p_comment: params.comment,
        p_status: params.status,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async deleteReview(reviewId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabase.rpc('delete_review', {
        p_review_id: reviewId,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REWARD ACCOUNT RPCs
  // ───────────────────────────────────────────────────────────────────────────

  static async getRewardAccount(rewardAccountId: string): Promise<ApiResponse<RewardAccount>> {
    try {
      const { data, error } = await supabase.rpc('get_reward_account', {
        p_reward_account_id: rewardAccountId,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async createRewardAccount(params: {
    customerId: string;
    pointsBalance?: number;
    tier?: string;
  }): Promise<ApiResponse<RewardAccount>> {
    try {
      const { data, error } = await supabase.rpc('create_reward_account', {
        p_customer_id: params.customerId,
        p_points_balance: params.pointsBalance ?? 0,
        p_tier: params.tier || 'Bronze',
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async updateRewardAccount(params: {
    rewardAccountId: string;
    customerId?: string;
    pointsBalance?: number;
    tier?: string;
  }): Promise<ApiResponse<RewardAccount>> {
    try {
      const { data, error } = await supabase.rpc('update_reward_account', {
        p_reward_account_id: params.rewardAccountId,
        p_customer_id: params.customerId,
        p_points_balance: params.pointsBalance,
        p_tier: params.tier,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async deleteRewardAccount(rewardAccountId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabase.rpc('delete_reward_account', {
        p_reward_account_id: rewardAccountId,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // FUEL TYPES & RATES READ RPCs
  // ───────────────────────────────────────────────────────────────────────────

  static async getFuelType(fuelTypeId: string): Promise<ApiResponse<FuelType>> {
    try {
      const { data, error } = await supabase.rpc('get_fuel_type', {
        p_fuel_type_id: fuelTypeId,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  static async getFuelRate(rateId: string): Promise<ApiResponse<FuelRate>> {
    try {
      const { data, error } = await supabase.rpc('get_fuel_rate', {
        p_rate_id: rateId,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }
}
