import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { supabase } from "./supabase";
import { userRepository } from "../repositories/UserRepository";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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

  public async initialize(): Promise<string | null> {
    if (Platform.OS === "web") {
      console.log(
        "PushNotificationService: web push registration is not enabled."
      );

      return null;
    }

    if (!Device.isDevice) {
      console.log(
        "PushNotificationService: push notifications require a physical device."
      );

      return null;
    }

    try {
      const permissions =
        await Notifications.getPermissionsAsync();

      let finalStatus = permissions.status;

      if (finalStatus !== "granted") {
        const requested =
          await Notifications.requestPermissionsAsync();

        finalStatus = requested.status;
      }

      if (finalStatus !== "granted") {
        console.log(
          "PushNotificationService: notification permission denied."
        );

        return null;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync(
          "default",
          {
            name: "FuelNow Notifications",
            importance:
              Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#0B3D42",
            sound: "default",
          }
        );
      }

      const projectId =
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

      if (!projectId) {
        throw new Error(
          "Missing EXPO_PUBLIC_EAS_PROJECT_ID."
        );
      }

      const tokenResponse =
        await Notifications.getExpoPushTokenAsync({
          projectId,
        });

      const expoPushToken =
        tokenResponse.data;

      console.log(
        "PushNotificationService: Expo push token:",
        expoPushToken
      );

      await this.saveToken(expoPushToken);

      return expoPushToken;
    } catch (error) {
      console.error(
        "PushNotificationService: failed to initialize:",
        error
      );

      return null;
    }
  }

  private async saveToken(
    expoPushToken: string
  ): Promise<void> {
    const customerId =
      await userRepository.getCurrentUserId();

    const platform =
      Platform.OS === "android"
        ? "android"
        : Platform.OS === "ios"
          ? "ios"
          : "web";

    const deviceName =
      Device.deviceName ?? null;

    const { error } = await supabase
      .from("customer_push_tokens")
      .upsert(
        {
          customer_id: customerId,
          expo_push_token: expoPushToken,
          platform,
          device_name: deviceName,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "expo_push_token",
        }
      );

    if (error) {
      console.error(
        "PushNotificationService: failed to save push token:",
        error
      );

      throw error;
    }

    console.log(
      "PushNotificationService: push token saved."
    );
  }

  public async deactivateCurrentToken(): Promise<void> {
    if (Platform.OS === "web") {
      return;
    }

    try {
      const customerId =
        await userRepository.getCurrentUserId();

      const { error } = await supabase
        .from("customer_push_tokens")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("customer_id", customerId);

      if (error) {
        console.error(
          "PushNotificationService: failed to deactivate token:",
          error
        );
      }
    } catch (error) {
      console.error(
        "PushNotificationService: failed to deactivate current token:",
        error
      );
    }
  }

  public addNotificationReceivedListener(
    listener: (
      notification: Notifications.Notification
    ) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(
      listener
    );
  }

  public addNotificationResponseListener(
    listener: (
      response: Notifications.NotificationResponse
    ) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(
      listener
    );
  }
}

export const pushNotificationService =
  PushNotificationService.getInstance();