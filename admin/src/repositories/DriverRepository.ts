import { supabase } from "../services/supabase";
import { realtimeHub } from "../patterns/realtimeObserver";

export interface DriverDocumentModel {
  id: string;
  type:
    | "Driver's Licence"
    | "Professional Driver Permit"
    | "Hazmat Certificate"
    | "Vehicle Permit";
  number: string;
  expiryDate: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

export interface DriverModel {
  id: string;
  name: string;
  phone: string;
  email: string;
  rating: number;
  licence_number: string;
  zone: string;
  province: string;
  status: string;
  total_deliveries: number;

  isOnDuty: boolean;
  isApproved: boolean;

  latitude: number;
  longitude: number;

  coordinates: {
    lat: number;
    lng: number;
  };

  dailyTarget: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;

  documents: DriverDocumentModel[];

  vehicleId: string;
  vehicleReg: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleColor: string;
  stationName: string;
  vehicleCapacity: number;

  truck: string;
  avatar: string;
  compliance: any[];
}

export class DriverRepository {
  private static instance: DriverRepository;

  private activeDriver: DriverModel = {
    id: "drv_001",
    name: "Admin Driver",
    phone: "",
    email: "",

    rating: 5,
    licence_number: "",

    zone: "",
    province: "KwaZulu-Natal",
    status: "active",

    total_deliveries: 0,

    isOnDuty: true,
    isApproved: true,

    latitude: -29.7990,
    longitude: 31.0340,

    coordinates: {
      lat: -29.7990,
      lng: 31.0340,
    },

    dailyTarget: 1500.0,

    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,

    documents: [],

    vehicleId: "",
    vehicleReg: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleColor: "",
    stationName: "",
    vehicleCapacity: 0,

    truck: "No Vehicle Assigned",

    avatar: "AD",

    compliance: [],
  };

  private constructor() {}

  public static getInstance(): DriverRepository {
    if (!DriverRepository.instance) {
      DriverRepository.instance = new DriverRepository();
    }

    return DriverRepository.instance;
  }

  public async getActiveDriver(): Promise<DriverModel> {
    return { ...this.activeDriver };
  }

  public async getAllDrivers(): Promise<DriverModel[]> {
    const { data, error } = await supabase.rpc("get_all_drivers");

    if (error) {
      console.error("Error fetching drivers:", error);
      throw error;
    }

    return (data ?? []).map((driver: any): DriverModel => {
      const latitude =
        driver.latitude !== null &&
        driver.latitude !== undefined
          ? Number(driver.latitude)
          : 0;

      const longitude =
        driver.longitude !== null &&
        driver.longitude !== undefined
          ? Number(driver.longitude)
          : 0;

      const isOnDuty =
        driver.is_on_duty ??
        driver.isOnDuty ??
        driver.status === "active";

      const isApproved =
        driver.is_approved ??
        driver.isApproved ??
        true;

      return {
        id: driver.id ?? driver.driver_id ?? "",

        name: driver.name ?? "",

        phone: driver.phone ?? "",

        email: driver.email ?? "",

        rating: Number(driver.rating ?? 0),

        licence_number:
          driver.licence_number ?? "",

        zone:
          driver.zone ?? "",

        province:
          driver.province ?? "",

        status:
          driver.status ?? "",

        total_deliveries: Number(
          driver.total_deliveries ??
            driver.totalDeliveries ??
            0,
        ),

        isOnDuty,

        isApproved,

        latitude,

        longitude,

        coordinates: {
          lat: latitude,
          lng: longitude,
        },

        dailyTarget: Number(
          driver.daily_target ?? 1500,
        ),

        todayEarnings: Number(
          driver.today_earnings ?? 0,
        ),

        weekEarnings: Number(
          driver.week_earnings ?? 0,
        ),

        monthEarnings: Number(
          driver.month_earnings ?? 0,
        ),

        documents: [],

        vehicleId:
          driver.vehicle_id ?? "",

        vehicleReg:
          driver.registration_number ?? "",

        vehicleMake:
          driver.vehicle_make ?? "",

        vehicleModel:
          driver.vehicle_model ?? "",

        vehicleColor:
          driver.vehicle_color ?? "",

        stationName:
          driver.station_name ?? "",

        vehicleCapacity: Number(
          driver.capacity_litres ?? 0,
        ),

        truck:
          driver.registration_number ||
          [driver.vehicle_make, driver.vehicle_model]
            .filter(Boolean)
            .join(" ") ||
          "No Vehicle Assigned",

        avatar: (driver.name ?? "?")
          .split(" ")
          .map((part: string) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),

        compliance: [],
      };
    });
  }

  public async toggleOnDutyStatus(
    isOnDuty: boolean,
  ): Promise<boolean> {
    const driverId = this.activeDriver.id;

    const { data, error } = await supabase.rpc(
      "update_driver_status",
      {
        p_driver_id: driverId,
        p_status: isOnDuty
          ? "active"
          : "inactive",
      },
    );

    if (error) {
      console.error(
        "Failed to update driver duty status:",
        error,
      );

      throw error;
    }

    this.activeDriver.isOnDuty = isOnDuty;

    this.activeDriver.status = isOnDuty
      ? "active"
      : "inactive";

    return Boolean(data);
  }

  public async updateGpsCoordinates(
    lat: number,
    lng: number,
  ): Promise<void> {
    const driverId = this.activeDriver.id;

    const { data, error } = await supabase.rpc(
      "update_driver_gps",
      {
        p_driver_id: driverId,
        p_latitude: lat,
        p_longitude: lng,
      },
    );

    if (error) {
      console.error(
        "Failed to update driver GPS:",
        error,
      );

      throw error;
    }

    this.activeDriver.latitude = lat;
    this.activeDriver.longitude = lng;

    this.activeDriver.coordinates = {
      lat,
      lng,
    };

    realtimeHub
      .getDriverGpsChannel(driverId)
      .notify({
        driverId,

        coordinates: {
          lat,
          lng,
        },

        timestamp:
          data?.timestamp ??
          new Date().toISOString(),
      });
  }

  public async getUserIdByEmail(
    email: string,
  ): Promise<string> {
    const { data, error } = await supabase
      .from("users")
      .select("user_id")
      .eq(
        "email",
        email.trim().toLowerCase(),
      )
      .single();

    if (error || !data) {
      throw new Error(
        "No FuelNow user was found with this email address.",
      );
    }

    return data.user_id;
  }

  public async addDriver(
    driverId: string,
    driver: Omit<
      DriverModel,
      | "id"
      | "todayEarnings"
      | "weekEarnings"
      | "monthEarnings"
      | "documents"
    >,
  ): Promise<DriverModel> {
    const { data, error } =
      await supabase.rpc(
        "create_driver",
        {
          p_driver_id: driverId,

          p_name: driver.name,

          p_phone: driver.phone,

          p_licence_number:
            driver.licence_number ||
            driver.vehicleReg ||
            null,

          p_zone:
            driver.zone || null,

          p_province:
            driver.province || null,

          p_status:
            driver.status ||
            (driver.isOnDuty
              ? "active"
              : "inactive"),

          p_rating:
            driver.rating || 0,
        },
      );

    if (error) {
      console.error(
        "Failed to create driver:",
        error,
      );

      throw error;
    }

    return {
      ...driver,

      id: data,

      todayEarnings: 0,

      weekEarnings: 0,

      monthEarnings: 0,

      documents: [],
    };
  }

  public async updateDriver(
    id: string,
    updates: Partial<DriverModel>,
  ): Promise<void> {
    const { error } =
      await supabase.rpc(
        "update_driver_details",
        {
          p_driver_id: id,

          p_name:
            updates.name ?? null,

          p_phone:
            updates.phone ?? null,

          p_zone:
            updates.zone ?? null,

          p_province:
            updates.province ?? null,

          p_licence_number:
            updates.licence_number ??
            updates.vehicleReg ??
            null,

          p_status:
            updates.status ?? null,

          p_rating:
            updates.rating !== undefined
              ? updates.rating
              : null,
        },
      );

    if (error) {
      console.error(
        "Error updating driver:",
        error,
      );

      throw error;
    }
  }

  public async deleteDriver(
    id: string,
  ): Promise<void> {
    const { data, error } =
      await supabase.rpc(
        "delete_driver",
        {
          p_driver_id: id,
        },
      );

    if (error) {
      console.error(
        "Error deleting driver:",
        error,
      );

      throw error;
    }

    if (!data) {
      throw new Error(
        "Driver was not found.",
      );
    }
  }
}

export const driverRepository =
  DriverRepository.getInstance();