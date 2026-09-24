import { Platform } from "react-native";
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  onNotificationOpenedApp,
  getInitialNotification,
  registerDeviceForRemoteMessages,
  requestPermission,
  type RemoteMessage,
} from "@react-native-firebase/messaging";

import { supabase } from "./supabase";
import { userRepository } from "../repositories/UserRepository";

export interface PushNotificationData {
  notificationId?: string;
  type?: string;
  orderId?: string;
  status?: string;
  [key: string]: unknown;
}

class PushNotificationService {
  private static instance: PushNotificationService;

  private constructor() {}

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance =
        new PushNotificationService();
    }

    return PushNotificationService.instance;
  }

  /**
   * Initialize Firebase Cloud Messaging for the current customer.
   *
   * This:
   * 1. Requests notification permission.
   * 2. Registers the device for remote messages.
   * 3. Gets the FCM token.
   * 4. Saves the token against the logged-in FuelNow customer.
   */
  public async initialize(): Promise<string | null> {
    if (Platform.OS !== "android" && Platform.OS !== "ios") {
      console.log(
        "PushNotificationService: FCM is disabled on this platform."
      );

      return null;
    }

    try {
      const messaging = getMessaging();

      const permissionStatus = await requestPermission(
        messaging
      );

      const enabled =
        permissionStatus === AuthorizationStatus.AUTHORIZED ||
        permissionStatus === AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log(
          "PushNotificationService: notification permission denied."
        );

        return null;
      }

      await registerDeviceForRemoteMessages(messaging);

      const fcmToken = await getToken(messaging);

      if (!fcmToken) {
        throw new Error(
          "Firebase did not return an FCM registration token."
        );
      }

      console.log(
        "PushNotificationService: FCM token received:",
        fcmToken
      );

      await this.saveToken(fcmToken);

      return fcmToken;
    } catch (error) {
      console.error(
        "PushNotificationService: failed to initialize FCM:",
        error
      );

      return null;
    }
  }

  /**
   * Save the FCM token for the currently authenticated
   * FuelNow customer.
   */
  private async saveToken(
    fcmToken: string
  ): Promise<void> {
    const customerId =
      await userRepository.getCurrentUserId();

    if (!customerId) {
      throw new Error(
        "Cannot save FCM token because no authenticated FuelNow user was found."
      );
    }

    const platform =
      Platform.OS === "android"
        ? "android"
        : "ios";

    const { error } = await supabase
      .from("customer_push_tokens")
      .upsert(
        {
          customer_id: customerId,
          fcm_token: fcmToken,
          platform,
          device_name: null,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "fcm_token",
        }
      );

    if (error) {
      console.error(
        "PushNotificationService: failed to save FCM token:",
        error
      );

      throw error;
    }

    console.log(
      "PushNotificationService: FCM token saved successfully."
    );
  }

  /**
   * Get the current FCM token and save it again.
   *
   * Useful when the application starts or when the token
   * may have changed.
   */
  public async refreshToken(): Promise<string | null> {
    if (Platform.OS !== "android" && Platform.OS !== "ios") {
      return null;
    }

    try {
      const messaging = getMessaging();

      const token = await getToken(messaging);

      if (!token) {
        console.log(
          "PushNotificationService: no FCM token available."
        );

        return null;
      }

      await this.saveToken(token);

      return token;
    } catch (error) {
      console.error(
        "PushNotificationService: failed to refresh FCM token:",
        error
      );

      return null;
    }
  }

  /**
   * Mark the current customer's push token(s) as inactive.
   *
   * We do not delete the token from the database because
   * keeping the record is useful for device/token tracking.
   */
  public async deactivateCurrentToken(): Promise<void> {
    try {
      const customerId =
        await userRepository.getCurrentUserId();

      if (!customerId) {
        return;
      }

      const { error } = await supabase
        .from("customer_push_tokens")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("customer_id", customerId);

      if (error) {
        console.error(
          "PushNotificationService: failed to deactivate FCM token:",
          error
        );
      }
    } catch (error) {
      console.error(
        "PushNotificationService: failed to deactivate current FCM token:",
        error
      );
    }
  }

  /**
   * Listen for FCM messages while the app is in the foreground.
   */
  public addMessageListener(
    listener: (message: RemoteMessage) => void
  ): () => void {
    if (
      Platform.OS !== "android" &&
      Platform.OS !== "ios"
    ) {
      return () => {};
    }

    const messaging = getMessaging();

    return onMessage(
      messaging,
      async (message) => {
        listener(message);
      }
    );
  }

  /**
   * Listen for Firebase token refresh events.
   */
  public addTokenRefreshListener(
    listener: (token: string) => void
  ): () => void {
    if (
      Platform.OS !== "android" &&
      Platform.OS !== "ios"
    ) {
      return () => {};
    }

    const messaging = getMessaging();

    return onTokenRefresh(
      messaging,
      async (token) => {
        listener(token);

        try {
          await this.saveToken(token);
        } catch (error) {
          console.error(
            "PushNotificationService: failed to save refreshed FCM token:",
            error
          );
        }
      }
    );
  }

  /**
   * Check whether the application was opened from
   * a notification while it was completely closed.
   */
  public async getInitialNotification(): Promise<RemoteMessage | null> {
    if (
      Platform.OS !== "android" &&
      Platform.OS !== "ios"
    ) {
      return null;
    }

    try {
      const messaging = getMessaging();

      return await getInitialNotification(messaging);
    } catch (error) {
      console.error(
        "PushNotificationService: failed to get initial notification:",
        error
      );

      return null;
    }
  }

  /**
   * Listen for a notification being opened while the
   * application was in the background.
   */
  public onNotificationOpenedApp(
    listener: (message: RemoteMessage) => void
  ): () => void {
    if (
      Platform.OS !== "android" &&
      Platform.OS !== "ios"
    ) {
      return () => {};
    }

    const messaging = getMessaging();

    return onNotificationOpenedApp(
      messaging,
      (message) => {
        listener(message);
      }
    );
  }
}

export const pushNotificationService =
  PushNotificationService.getInstance();