import { CustomerApiClient } from '../services/apiClient';
import { supabase } from '../services/supabase';
import {
  User,
  Customer,
  Address,
  RewardAccount,
} from '../types/database';

export interface DriverAuthProfile {
  userId: string;
  authId: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  driverStatus: string;
  zone: string | null;
  province: string;
  licenceNumber: string;
  rating: number;
}

export interface AddressModel {
  id: string;
  label:
    | 'Home'
    | 'Work'
    | 'Other'
    | 'Site A'
    | 'Depot';

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
  type:
    | 'card'
    | 'eft'
    | 'mobile_money';
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
  loyaltyTier:
    | 'Bronze'
    | 'Silver'
    | 'Gold'
    | 'Platinum';
  companyName: string;
  savedAddresses: AddressModel[];
  paymentMethods: PaymentMethodModel[];
}

export class UserRepository {
  private static instance: UserRepository;

  private currentUserId: string | null = null;

  private constructor() {}

  public static getInstance(): UserRepository {
    if (!UserRepository.instance) {
      UserRepository.instance =
        new UserRepository();
    }

    return UserRepository.instance;
  }

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
  }

  private async getAuthenticatedUserId(): Promise<string> {
    if (
      this.currentUserId &&
      this.currentUserId !== 'undefined' &&
      this.currentUserId !== 'null'
    ) {
      return this.currentUserId;
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw new Error(error.message);
    }

    if (!user) {
      throw new Error(
        'No authenticated user found. Please log in again.'
      );
    }

    const { data: userProfile, error: profileError } =
      await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', user.id)
        .single();

    if (profileError || !userProfile) {
      throw new Error(
        'Authenticated account does not have a FuelNow user profile.'
      );
    }

    this.currentUserId =
      userProfile.user_id;

    return userProfile.user_id;
  }

  public async getCurrentUserId(): Promise<string> {
    return this.getAuthenticatedUserId();
  }

  public async getAuthUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw new Error(error.message);
    }

    return user;
  }

  public async getDriverAuthProfile(): Promise<DriverAuthProfile> {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authUser) {
      throw new Error(
        'No authenticated user found.'
      );
    }

    const {
      data: userProfile,
      error: userError,
    } = await supabase
      .from('users')
      .select(
        'user_id, auth_id, full_name, email, phone_number, status'
      )
      .eq('auth_id', authUser.id)
      .single();

    if (userError || !userProfile) {
      throw new Error(
        'Your account is authenticated, but your FuelNow user profile could not be found.'
      );
    }

    const {
      data: driverProfile,
      error: driverError,
    } = await supabase
      .from('drivers')
      .select(
        'driver_id, licence_number, rating, status, zone, province'
      )
      .eq(
        'driver_id',
        userProfile.user_id
      )
      .single();

    if (driverError || !driverProfile) {
      throw new Error(
        'This account is not registered as a FuelNow driver.'
      );
    }

    if (
      userProfile.status !== 'active'
    ) {
      throw new Error(
        `Your FuelNow account is currently ${userProfile.status}. Please contact FuelNow support.`
      );
    }

    this.currentUserId =
      userProfile.user_id;

    return {
      userId: userProfile.user_id,
      authId: authUser.id,
      name: userProfile.full_name ?? '',
      email:
        userProfile.email ??
        authUser.email ??
        '',
      phone:
        userProfile.phone_number ?? '',
      status: userProfile.status,
      driverStatus:
        driverProfile.status ??
        'Offline',
      zone:
        driverProfile.zone ?? null,
      province:
        driverProfile.province ??
        'KwaZulu-Natal',
      licenceNumber:
        driverProfile.licence_number ?? '',
      rating: Number(
        driverProfile.rating ?? 5
      ),
    };
  }

  public async login(
    email: string,
    password: string
  ): Promise<DriverAuthProfile> {
    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new Error(
        'Please enter your email address.'
      );
    }

    if (!password) {
      throw new Error(
        'Please enter your password.'
      );
    }

    const {
      data,
      error,
    } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      throw new Error(
        this.mapAuthError(error.message)
      );
    }

    if (!data.user) {
      throw new Error(
        'Authentication succeeded, but no authenticated user was returned.'
      );
    }

    try {
      return await this.getDriverAuthProfile();
    } catch (error) {
      await supabase.auth.signOut();
      this.currentUserId = null;

      throw error;
    }
  }

  public async restoreDriverSession(): Promise<DriverAuthProfile | null> {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw new Error(error.message);
    }

    if (!session?.user) {
      this.currentUserId = null;
      return null;
    }

    try {
      return await this.getDriverAuthProfile();
    } catch (error) {
      await supabase.auth.signOut();
      this.currentUserId = null;

      throw error;
    }
  }

  public async clearAuthenticatedUser(): Promise<void> {
    this.currentUserId = null;

    const { error } =
      await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  }

  public async forgotPassword(
    email: string
  ): Promise<void> {
    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new Error(
        'Please enter your email address.'
      );
    }

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        normalizedEmail
      );

    if (error) {
      throw new Error(error.message);
    }
  }

  public async signUp(): Promise<void> {
    throw new Error(
      'Driver accounts are created by FuelNow administration. Please contact your administrator.'
    );
  }

  public async getUser(): Promise<UserModel> {
    const userId =
      await this.getAuthenticatedUserId();

    const userResponse =
      await CustomerApiClient.getUser(
        userId
      );

    if (
      userResponse.error ||
      !userResponse.data
    ) {
      throw (
        userResponse.error ??
        new Error(
          'Unable to retrieve user.'
        )
      );
    }

    const user =
      userResponse.data;

    const customerResponse =
      await CustomerApiClient.getCustomer(
        userId
      );

    if (
      customerResponse.error ||
      !customerResponse.data
    ) {
      throw (
        customerResponse.error ??
        new Error(
          'Unable to retrieve customer profile.'
        )
      );
    }

    const customer =
      customerResponse.data;

    const savedAddresses =
      await this.getAddresses();

    const paymentMethods: PaymentMethodModel[] =
      [];

    return {
      id: user.user_id,
      name: user.full_name ?? '',
      email: user.email ?? '',
      phone: user.phone_number ?? '',
      loyaltyPoints:
        customer.fuel_points_balance ?? 0,
      loyaltyTier:
        this.mapLoyaltyTier(
          customer.loyalty_tier
        ),
      companyName: '',
      savedAddresses,
      paymentMethods,
    };
  }

  public async getAddresses(): Promise<AddressModel[]> {
    const userId =
      await this.getAuthenticatedUserId();

    const {
      data,
      error,
    } = await supabase
      .from('addresses')
      .select('*')
      .eq('customer_id', userId)
      .order('address_id', {
        ascending: true,
      });

    if (error) {
      console.error(
        'UserRepository: failed to fetch addresses:',
        error
      );

      throw error;
    }

    return (data ?? []).map(
      (address: Address) =>
        this.mapAddress(address)
    );
  }

  public async addPoints(
    points: number
  ): Promise<number> {
    if (points <= 0) {
      throw new Error(
        'Points must be greater than zero.'
      );
    }

    const userId =
      await this.getAuthenticatedUserId();

    const customerResponse =
      await CustomerApiClient.getCustomer(
        userId
      );

    if (
      customerResponse.error ||
      !customerResponse.data
    ) {
      throw (
        customerResponse.error ??
        new Error(
          'Unable to retrieve customer.'
        )
      );
    }

    const customer =
      customerResponse.data;

    const currentPoints =
      customer.fuel_points_balance ?? 0;

    const newPoints =
      currentPoints + points;

    const newTier =
      this.calculateLoyaltyTier(
        newPoints
      );

    const updateResponse =
      await CustomerApiClient.updateCustomer({
        customerId: userId,
        loyaltyTier: newTier,
        fuelPointsBalance: newPoints,
      });

    if (
      updateResponse.error ||
      !updateResponse.data
    ) {
      throw (
        updateResponse.error ??
        new Error(
          'Unable to update loyalty points.'
        )
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
    const userId =
      await this.getAuthenticatedUserId();

    const response =
      await CustomerApiClient.updateAddress({
        addressId: params.addressId,
        customerId:
          params.customerId ??
          userId,

        label: params.label,
        unitNumber:
          params.unitNumber,
        streetNumber:
          params.streetNumber,
        streetName:
          params.streetName,
        suburb: params.suburb,
        city: params.city,
        province: params.province,
        postalCode:
          params.postalCode,
        deliveryInstructions:
          params.deliveryInstructions,
        isDefault:
          params.isDefault ?? false,

        latitude:
          params.coordinates?.lat,
        longitude:
          params.coordinates?.lng,
      });

    if (
      response.error ||
      !response.data
    ) {
      throw (
        response.error ??
        new Error(
          'Unable to update address.'
        )
      );
    }

    return this.mapAddress(
      response.data
    );
  }

  public async addAddress(
    address: Omit<AddressModel, 'id'>
  ): Promise<AddressModel> {
    const userId =
      await this.getAuthenticatedUserId();

    const response =
      await CustomerApiClient.createAddress({
        customerId: userId,

        label: address.label,
        unitNumber:
          address.unitNumber,
        streetNumber:
          address.streetNumber,
        streetName:
          address.streetName,
        suburb: address.suburb,
        city: address.city,
        province: address.province,
        postalCode:
          address.postalCode,
        deliveryInstructions:
          address.instructions,
        isDefault:
          address.isDefault ?? false,

        latitude:
          address.coordinates?.lat,
        longitude:
          address.coordinates?.lng,
      });

    if (
      response.error ||
      !response.data
    ) {
      throw (
        response.error ??
        new Error(
          'Unable to create address.'
        )
      );
    }

    return this.mapAddress(
      response.data
    );
  }

  public async addPaymentMethod(
    paymentMethod: Omit<
      PaymentMethodModel,
      'id'
    >
  ): Promise<PaymentMethodModel> {
    throw new Error(
      'Saved payment methods are not yet supported by CustomerApiClient. Add CRUD RPC functions for your payment_methods table first.'
    );
  }

  public async updateProfile(params: {
    fullName: string;
    email: string;
    phoneNumber: string;
  }): Promise<UserModel> {
    const userId =
      await this.getAuthenticatedUserId();

    const {
      data: { user: authUser },
      error: authUserError,
    } = await supabase.auth.getUser();

    if (authUserError) {
      throw authUserError;
    }

    if (!authUser) {
      throw new Error(
        'No authenticated user found.'
      );
    }

    const newEmail =
      params.email.trim();

    const currentEmail =
      authUser.email?.trim() ?? '';

    if (
      newEmail.toLowerCase() !==
      currentEmail.toLowerCase()
    ) {
      const { error } =
        await supabase.auth.updateUser({
          email: newEmail,
        });

      if (error) {
        throw error;
      }
    }

    const response =
      await CustomerApiClient.updateUser({
        userId,
        fullName:
          params.fullName.trim(),
        email: newEmail,
        phoneNumber:
          params.phoneNumber.trim(),
      });

    if (response.error) {
      throw response.error;
    }

    return await this.getUser();
  }

  private mapAddress(
    address: Address
  ): AddressModel {
    return {
      id: address.address_id,

      label:
        this.mapAddressLabel(
          address.label
        ),

      unitNumber:
        address.unit_number ?? '',
      streetNumber:
        address.street_number ?? '',
      streetName:
        address.street_name ?? '',

      street: [
        address.unit_number,
        address.street_number,
        address.street_name,
      ]
        .filter(Boolean)
        .join(' '),

      suburb: address.suburb ?? '',
      city: address.city ?? '',
      province:
        address.province ?? '',
      postalCode:
        address.postal_code ?? '',

      instructions:
        address.delivery_instructions ??
        '',
      isDefault:
        address.is_default ?? false,

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

  private mapLoyaltyTier(
    tier:
      | string
      | null
      | undefined
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

  private calculateLoyaltyTier(
    points: number
  ): UserModel['loyaltyTier'] {
    if (points >= 1000) {
      return 'Platinum';
    }

    if (points >= 500) {
      return 'Gold';
    }

    if (points >= 200) {
      return 'Silver';
    }

    return 'Bronze';
  }

  private mapAddressLabel(
    label:
      | string
      | null
      | undefined
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

export const userRepository =
  UserRepository.getInstance();