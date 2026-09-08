import { CustomerApiClient } from '../services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import {
  User,
  Customer,
  Address,
  RewardAccount,
} from '../types/database';



export interface AddressModel {
  id: string;
  label: 'Home' | 'Work' | 'Other' | 'Site A' | 'Depot';

  unitNumber?: string;
  streetNumber?: string;
  streetName?: string;

  street: string;

  suburb: string;
  city: string;
  province: string;
  postalCode: string;

  instructions?: string;
  isDefault?: boolean;

  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface PaymentMethodModel {
  id: string;
  type: 'card' | 'eft' | 'mobile_money';
  label: string;
  last4?: string;
  brand?: 'visa' | 'mastercard';
  isDefault: boolean;
}

export interface UserModel {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
  loyaltyTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  companyName: string;
  savedAddresses: AddressModel[];
  paymentMethods: PaymentMethodModel[];
}

export class UserRepository {
  private static instance: UserRepository;

  private constructor() {}

  public static getInstance(): UserRepository {
    if (!UserRepository.instance) {
      UserRepository.instance = new UserRepository();
    }

    return UserRepository.instance;
  }

  /**
   * Gets the currently authenticated user's ID.
   */
private currentUserId: string | null = null;

private readonly USER_ID_KEY = '@fuelnow_current_user_id';
public async setAuthenticatedUserId(
  userId: string
): Promise<void> {
  if (
    !userId ||
    userId === 'undefined' ||
    userId === 'null'
  ) {
    throw new Error(
      'Cannot save authenticated user: invalid user ID.'
    );
  }

  this.currentUserId = userId;

  await AsyncStorage.setItem(
    this.USER_ID_KEY,
    userId
  );

  console.log(
    'UserRepository: authenticated user ID saved:',
    userId
  );
}

private async getAuthenticatedUserId(): Promise<string> {
  // Check memory first
  if (
    this.currentUserId &&
    this.currentUserId !== 'undefined' &&
    this.currentUserId !== 'null'
  ) {
    return this.currentUserId;
  }

  // Restore from AsyncStorage
  const storedUserId = await AsyncStorage.getItem(
    this.USER_ID_KEY
  );

  if (
    storedUserId &&
    storedUserId !== 'undefined' &&
    storedUserId !== 'null'
  ) {
    this.currentUserId = storedUserId;

    console.log(
      'UserRepository: restored user ID:',
      storedUserId
    );

    return storedUserId;
  }

  throw new Error(
    'No authenticated user found. Please log in again.'
  );
}
  public async clearAuthenticatedUser(): Promise<void> {
  this.currentUserId = null;
  await AsyncStorage.removeItem(this.USER_ID_KEY);
}

  /**
   * Gets the complete customer profile from Supabase.
   */
  public async getUser(): Promise<UserModel> {
  const userId = await this.getAuthenticatedUserId();

  // Get user record
  const userResponse = await CustomerApiClient.getUser(userId);

  if (userResponse.error || !userResponse.data) {
    throw userResponse.error ?? new Error('Unable to retrieve user.');
  }

  const user = userResponse.data;

  // Get customer record
  const customerResponse =
    await CustomerApiClient.getCustomer(userId);

  if (customerResponse.error || !customerResponse.data) {
    throw (
      customerResponse.error ??
      new Error('Unable to retrieve customer profile.')
    );
  }

  const customer = customerResponse.data;

  // Get saved addresses
  const savedAddresses = await this.getAddresses();

  const paymentMethods: PaymentMethodModel[] = [];

  return {
    id: user.user_id,
    name: user.full_name ?? '',
    email: user.email ?? '',
    phone: user.phone_number ?? '',
    loyaltyPoints: customer.fuel_points_balance ?? 0,
    loyaltyTier: this.mapLoyaltyTier(customer.loyalty_tier),
    companyName: '',
    savedAddresses,
    paymentMethods,
  };
}


  public async getAddresses(): Promise<AddressModel[]> {
  const userId = await this.getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('customer_id', userId)
    .order('address_id', { ascending: true });

  if (error) {
    console.error('UserRepository: failed to fetch addresses:', error);
    throw error;
  }

  return (data ?? []).map((address: Address) =>
    this.mapAddress(address)
  );
}


  /**
   * Adds loyalty points to the customer's account.
   */
  public async addPoints(points: number): Promise<number> {
    if (points <= 0) {
      throw new Error('Points must be greater than zero.');
    }

    const userId = await this.getAuthenticatedUserId();

    const customerResponse =
      await CustomerApiClient.getCustomer(userId);

    if (customerResponse.error || !customerResponse.data) {
      throw (
        customerResponse.error ??
        new Error('Unable to retrieve customer.')
      );
    }

    const customer = customerResponse.data;

    const currentPoints =
      customer.fuel_points_balance ?? 0;

    const newPoints = currentPoints + points;

    const newTier = this.calculateLoyaltyTier(newPoints);

    const updateResponse =
      await CustomerApiClient.updateCustomer({
        customerId: userId,
        loyaltyTier: newTier,
        fuelPointsBalance: newPoints,
      });

    if (updateResponse.error || !updateResponse.data) {
      throw (
        updateResponse.error ??
        new Error('Unable to update loyalty points.')
      );
    }

    return newPoints;
  }


public async updateAddress(params: {
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
  coordinates?: {
    lat: number;
    lng: number;
  };
}): Promise<AddressModel> {
  const userId = await this.getAuthenticatedUserId();

  const response = await CustomerApiClient.updateAddress({
    addressId: params.addressId,
    customerId: params.customerId ?? userId,

    label: params.label,
    unitNumber: params.unitNumber,
    streetNumber: params.streetNumber,
    streetName: params.streetName,
    suburb: params.suburb,
    city: params.city,
    province: params.province,
    postalCode: params.postalCode,
    deliveryInstructions: params.deliveryInstructions,
    isDefault: params.isDefault ?? false,

    latitude: params.coordinates?.lat,
    longitude: params.coordinates?.lng,
  });

  if (response.error || !response.data) {
    throw (
      response.error ??
      new Error('Unable to update address.')
    );
  }

  return this.mapAddress(response.data);
}

  /**
   * Adds an address to the customer's Supabase account.
   */
public async addAddress(
  address: Omit<AddressModel, 'id'>
): Promise<AddressModel> {
  const userId = await this.getAuthenticatedUserId();

  const response = await CustomerApiClient.createAddress({
    customerId: userId,

    label: address.label,
    unitNumber: address.unitNumber,
    streetNumber: address.streetNumber,
    streetName: address.streetName,
    suburb: address.suburb,
    city: address.city,
    province: address.province,
    postalCode: address.postalCode,
    deliveryInstructions: address.instructions,
    isDefault: address.isDefault ?? false,

    latitude: address.coordinates?.lat,
    longitude: address.coordinates?.lng,
  });

  if (response.error || !response.data) {
    throw (
      response.error ??
      new Error('Unable to create address.')
    );
  }

  return this.mapAddress(response.data);
}
  /**
   * Adds a payment method.
   *
   * This currently requires a payment-method RPC/table because
   * createPayment() in CustomerApiClient creates an order payment,
   * not a saved customer payment method.
   */
  public async addPaymentMethod(
    paymentMethod: Omit<PaymentMethodModel, 'id'>
  ): Promise<PaymentMethodModel> {
    throw new Error(
      'Saved payment methods are not yet supported by CustomerApiClient. ' +
      'Add CRUD RPC functions for your payment_methods table first.'
    );
  }

  /**
   * Converts a database Address into the format expected by the app.
   */
private mapAddress(address: Address): AddressModel {
  return {
    id: address.address_id,

    label: this.mapAddressLabel(address.label),

    unitNumber: address.unit_number ?? '',
    streetNumber: address.street_number ?? '',
    streetName: address.street_name ?? '',

    street: [
      address.unit_number,
      address.street_number,
      address.street_name,
    ]
      .filter(Boolean)
      .join(' '),

    suburb: address.suburb ?? '',
    city: address.city ?? '',
    province: address.province ?? '',
    postalCode: address.postal_code ?? '',

    instructions: address.delivery_instructions ?? '',
    isDefault: address.is_default ?? false,

    coordinates:
      address.latitude != null &&
      address.longitude != null
        ? {
            lat: address.latitude,
            lng: address.longitude,
          }
        : undefined,
  };
}

  /**
   * Converts the database loyalty tier into the app's loyalty tier.
   */
  private mapLoyaltyTier(
    tier: string | null | undefined
  ): UserModel['loyaltyTier'] {
    switch (tier) {
      case 'Platinum':
        return 'Platinum';

      case 'Gold':
        return 'Gold';

      case 'Silver':
        return 'Silver';

      default:
        return 'Bronze';
    }
  }

  /**
   * Calculates the loyalty tier from the number of points.
   */
  private calculateLoyaltyTier(
    points: number
  ): UserModel['loyaltyTier'] {
    if (points >= 2500) {
      return 'Platinum';
    }

    if (points >= 1000) {
      return 'Gold';
    }

    if (points >= 500) {
      return 'Silver';
    }

    return 'Bronze';
  }

  /**
   * Makes sure address labels match the application's allowed values.
   */
  private mapAddressLabel(
    label: string | null | undefined
  ): AddressModel['label'] {
    switch (label) {
      case 'Home':
        return 'Home';

      case 'Work':
        return 'Work';

      case 'Site A':
        return 'Site A';

      case 'Depot':
        return 'Depot';

      default:
        return 'Other';
    }
  }
}

export const userRepository = UserRepository.getInstance();