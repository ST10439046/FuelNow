import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

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

export class UserRepository {
  private static instance: UserRepository;

  private currentUserId: string | null = null;

  private readonly USER_ID_KEY = '@fuelnow_current_user_id';

  private constructor() {}

  public static getInstance(): UserRepository {
    if (!UserRepository.instance) {
      UserRepository.instance = new UserRepository();
    }

    return UserRepository.instance;
  }

  /**
   * Stores the FuelNow public.users.user_id.
   *
   * This is deliberately NOT the Supabase auth.users.id.
   */
  public async setAuthenticatedUserId(userId: string): Promise<void> {
    if (
      !userId ||
      userId === 'undefined' ||
      userId === 'null'
    ) {
      throw new Error('Cannot save authenticated user: invalid user ID.');
    }

    this.currentUserId = userId;

    await AsyncStorage.setItem(
      this.USER_ID_KEY,
      userId
    );
  }

  /**
   * Returns the FuelNow public user ID for the current session.
   */
  public async getCurrentUserId(): Promise<string> {
    if (
      this.currentUserId &&
      this.currentUserId !== 'undefined' &&
      this.currentUserId !== 'null'
    ) {
      return this.currentUserId;
    }

    const storedUserId = await AsyncStorage.getItem(
      this.USER_ID_KEY
    );

    if (
      storedUserId &&
      storedUserId !== 'undefined' &&
      storedUserId !== 'null'
    ) {
      this.currentUserId = storedUserId;
      return storedUserId;
    }

    throw new Error(
      'No authenticated user found. Please log in again.'
    );
  }

  /**
   * Returns the Supabase Auth user for the active session.
   */
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

  /**
   * Loads the FuelNow driver profile associated with the
   * currently authenticated Supabase Auth account.
   *
   * Mapping:
   *
   * auth.users.id
   *      ↓
   * public.users.auth_id
   *      ↓
   * public.users.user_id
   *      ↓
   * public.drivers.driver_id
   */
  public async getDriverAuthProfile(): Promise<DriverAuthProfile> {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authUser) {
      throw new Error('No authenticated user found.');
    }

    const { data: userProfile, error: userError } = await supabase
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

    const { data: driverProfile, error: driverError } = await supabase
      .from('drivers')
      .select(
        'driver_id, licence_number, rating, status, zone, province'
      )
      .eq('driver_id', userProfile.user_id)
      .single();

    if (driverError || !driverProfile) {
      throw new Error(
        'This account is not registered as a FuelNow driver.'
      );
    }

    if (userProfile.status !== 'active') {
      throw new Error(
        `Your FuelNow account is currently ${userProfile.status}. Please contact FuelNow support.`
      );
    }

    await this.setAuthenticatedUserId(userProfile.user_id);

    return {
      userId: userProfile.user_id,
      authId: authUser.id,
      name: userProfile.full_name ?? '',
      email: userProfile.email ?? authUser.email ?? '',
      phone: userProfile.phone_number ?? '',
      status: userProfile.status,
      driverStatus: driverProfile.status ?? 'Offline',
      zone: driverProfile.zone ?? null,
      province: driverProfile.province ?? 'KwaZulu-Natal',
      licenceNumber: driverProfile.licence_number ?? '',
      rating: Number(driverProfile.rating ?? 5),
    };
  }

  /**
   * Signs in using Supabase Auth and verifies that the
   * authenticated account actually belongs to a FuelNow driver.
   */
  public async login(
    email: string,
    password: string
  ): Promise<DriverAuthProfile> {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new Error('Please enter your email address.');
    }

    if (!password) {
      throw new Error('Please enter your password.');
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

      throw error;
    }
  }

  /**
   * Restores the current authenticated driver after the
   * application starts.
   *
   * Returns null when there is no active session.
   */
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
      await AsyncStorage.removeItem(this.USER_ID_KEY);
      return null;
    }

    try {
      return await this.getDriverAuthProfile();
    } catch (error) {
      await supabase.auth.signOut();
      this.currentUserId = null;
      await AsyncStorage.removeItem(this.USER_ID_KEY);
      throw error;
    }
  }

  /**
   * Signs out of Supabase Auth and clears the FuelNow
   * application user ID.
   */
  public async clearAuthenticatedUser(): Promise<void> {
    this.currentUserId = null;

    await AsyncStorage.removeItem(
      this.USER_ID_KEY
    );

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  }

  public async forgotPassword(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        normalizedEmail
      );

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Driver accounts are provisioned by FuelNow administration.
   *
   * Public driver self-registration is intentionally not exposed
   * through the driver app.
   */
  public async signUp(): Promise<void> {
    throw new Error(
      'Driver accounts are created by FuelNow administration. Please contact your administrator.'
    );
  }

  private mapAuthError(message: string): string {
    const normalized = message.toLowerCase();

    if (
      normalized.includes('invalid login credentials') ||
      normalized.includes('invalid credentials')
    ) {
      return 'Incorrect email or password.';
    }

    if (
      normalized.includes('email not confirmed')
    ) {
      return 'Your email address has not been confirmed.';
    }

    if (
      normalized.includes('too many requests')
    ) {
      return 'Too many login attempts. Please wait a moment and try again.';
    }

    return message;
  }
}

export const userRepository =
  UserRepository.getInstance();