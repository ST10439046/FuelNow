import { supabase } from "../services/supabase";

export interface FuelMarkupSettings {
  petrol93: number;
  petrol95: number;
  diesel50: number;
  diesel500: number;
}

export interface PlatformSettings {
  settingsId: string;
  autoAssignOrders: boolean;
  customerSmsNotifications: boolean;
  updatedBy: string | null;
  updatedAt: string;
  fuelMarkup: FuelMarkupSettings;
}

export class PlatformSettingsRepository {
  private static instance: PlatformSettingsRepository;

  private constructor() {}

  public static getInstance(): PlatformSettingsRepository {
    if (!PlatformSettingsRepository.instance) {
      PlatformSettingsRepository.instance =
        new PlatformSettingsRepository();
    }

    return PlatformSettingsRepository.instance;
  }

  public async getSettings(): Promise<PlatformSettings> {
    const { data, error } = await supabase.rpc(
      "get_platform_settings",
    );

    if (error) {
      console.error(
        "Error fetching platform settings:",
        error,
      );

      throw error;
    }

    const row = Array.isArray(data)
      ? data[0]
      : data;

    if (!row) {
      throw new Error(
        "Platform settings could not be found.",
      );
    }

    const fuelMarkup = row.fuel_markup ?? {};

    return {
      settingsId: row.settings_id,

      autoAssignOrders:
        Boolean(row.auto_assign_orders),

      customerSmsNotifications:
        Boolean(row.customer_sms_notifications),

      updatedBy:
        row.updated_by ?? null,

      updatedAt:
        row.updated_at,

      fuelMarkup: {
        petrol93: Number(
          fuelMarkup.petrol93 ?? 0,
        ),

        petrol95: Number(
          fuelMarkup.petrol95 ?? 0,
        ),

        diesel50: Number(
          fuelMarkup.diesel50 ?? 0,
        ),

        diesel500: Number(
          fuelMarkup.diesel500 ?? 0,
        ),
      },
    };
  }

  public async updateSettings(
    settings: Pick<
      PlatformSettings,
      | "autoAssignOrders"
      | "customerSmsNotifications"
      | "fuelMarkup"
    >,
  ): Promise<void> {
    const { data, error } = await supabase.rpc(
      "update_platform_settings",
      {
        p_auto_assign_orders:
          settings.autoAssignOrders,

        p_customer_sms_notifications:
          settings.customerSmsNotifications,

        p_fuel_markup: settings.fuelMarkup,
      },
    );

    if (error) {
      console.error(
        "Error updating platform settings:",
        error,
      );

      throw error;
    }

    if (!data) {
      throw new Error(
        "Platform settings were not updated.",
      );
    }
  }
}

export const platformSettingsRepository =
  PlatformSettingsRepository.getInstance();