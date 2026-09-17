
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

export interface DriverVehicleModel {
  vehicleId: string;
  registrationNumber: string;
  make: string;
  model: string;
  capacityLitres: number;
  driverId: string | null;
}

export interface DriverAuthAccount {
  // This is public.users.user_id, NOT auth.users.id.
  // drivers.driver_id references this value.
  userId: string;

  // The email belonging to the Auth account.
  email: string;

  // The Supabase Auth UUID.
  authId: string;
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

    latitude: -29.799,
    longitude: 31.034,

    coordinates: {
      lat: -29.799,
      lng: 31.034,
    },

    dailyTarget: 1500,

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
      DriverRepository.instance =
        new DriverRepository();
    }

    return DriverRepository.instance;
  }

  public async getActiveDriver(): Promise<DriverModel> {
    return { ...this.activeDriver };
  }

  private mapDriver(driver: any): DriverModel {
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

    const vehicleId =
      driver.vehicle_id ??
      driver.vehicleId ??
      "";

    const vehicleReg =
      driver.registration_number ??
      driver.vehicle_reg ??
      driver.vehicleReg ??
      "";

    const vehicleMake =
      driver.vehicle_make ??
      driver.vehicleMake ??
      "";

    const vehicleModel =
      driver.vehicle_model ??
      driver.vehicleModel ??
      "";

    const vehicleCapacity = Number(
      driver.capacity_litres ??
        driver.vehicle_capacity ??
        driver.vehicleCapacity ??
        0,
    );

    const vehicleName = [
      vehicleMake,
      vehicleModel,
    ]
      .filter(Boolean)
      .join(" ");

    return {
      id:
        driver.id ??
        driver.driver_id ??
        "",

      name:
        driver.name ??
        "",

      phone:
        driver.phone ??
        "",

      email:
        driver.email ??
        "",

      rating:
        Number(driver.rating ?? 0),

      licence_number:
        driver.licence_number ??
        "",

      zone:
        driver.zone ??
        "",

      province:
        driver.province ??
        "",

      status:
        driver.status ??
        "",

      total_deliveries:
        Number(
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

      dailyTarget:
        Number(
          driver.daily_target ??
            driver.dailyTarget ??
            1500,
        ),

      todayEarnings:
        Number(
          driver.today_earnings ??
            driver.todayEarnings ??
            0,
        ),

      weekEarnings:
        Number(
          driver.week_earnings ??
            driver.weekEarnings ??
            0,
        ),

      monthEarnings:
        Number(
          driver.month_earnings ??
            driver.monthEarnings ??
            0,
        ),

      documents: [],

      vehicleId,

      vehicleReg,

      vehicleMake,

      vehicleModel,

      vehicleColor:
        driver.vehicle_color ??
        driver.vehicleColor ??
        "",

      stationName:
        driver.station_name ??
        driver.stationName ??
        "",

      vehicleCapacity,

      truck:
        vehicleReg ||
        vehicleName ||
        "No Vehicle Assigned",

      avatar:
        (driver.name ?? "?")
          .split(" ")
          .map(
            (part: string) => part[0],
          )
          .join("")
          .slice(0, 2)
          .toUpperCase(),

      compliance: [],
    };
  }

  public async getAllDrivers(): Promise<DriverModel[]> {
    const { data, error } =
      await supabase.rpc(
        "get_all_drivers",
      );

    if (error) {
      console.error(
        "Error fetching drivers:",
        error,
      );

      throw error;
    }

    return (data ?? []).map(
      (driver: any) =>
        this.mapDriver(driver),
    );
  }

  public async getDriver(
    driverId: string,
  ): Promise<DriverModel> {
    const { data, error } =
      await supabase.rpc(
        "get_driver",
        {
          p_driver_id: driverId,
        },
      );

    if (error) {
      console.error(
        "Error fetching driver details:",
        error,
      );

      throw error;
    }

    const driver = Array.isArray(data)
      ? data[0]
      : data;

    if (!driver) {
      throw new Error(
        "Driver was not found.",
      );
    }

    return this.mapDriver(driver);
  }

  public async getAvailableVehicles(
    currentDriverId?: string,
  ): Promise<DriverVehicleModel[]> {
    const { data, error } =
      await supabase
        .from("vehicles")
        .select(
          `
          vehicle_id,
          driver_id,
          registration_number,
          make,
          model,
          capacity_litres
          `,
        )
        .or(
          currentDriverId
            ? `driver_id.is.null,driver_id.eq.${currentDriverId}`
            : "driver_id.is.null",
        )
        .order(
          "registration_number",
          {
            ascending: true,
          },
        );

    if (error) {
      console.error(
        "Error fetching available vehicles:",
        error,
      );

      throw error;
    }

    return (data ?? []).map(
      (vehicle: any) => ({
        vehicleId:
          vehicle.vehicle_id,

        registrationNumber:
          vehicle.registration_number,

        make:
          vehicle.make,

        model:
          vehicle.model,

        capacityLitres:
          Number(
            vehicle.capacity_litres ?? 0,
          ),

        driverId:
          vehicle.driver_id ?? null,
      }),
    );
  }

  public async assignVehicle(
    driverId: string,
    vehicleId: string | null,
  ): Promise<void> {
    const { error: clearError } =
      await supabase
        .from("vehicles")
        .update({
          driver_id: null,
        })
        .eq(
          "driver_id",
          driverId,
        );

    if (clearError) {
      console.error(
        "Failed to clear driver's previous vehicle:",
        clearError,
      );

      throw clearError;
    }

    if (!vehicleId) {
      return;
    }

    const {
      data: vehicle,
      error: vehicleError,
    } = await supabase
      .from("vehicles")
      .select(
        "vehicle_id, driver_id",
      )
      .eq(
        "vehicle_id",
        vehicleId,
      )
      .single();

    if (vehicleError || !vehicle) {
      throw new Error(
        "The selected vehicle could not be found.",
      );
    }

    if (
      vehicle.driver_id &&
      vehicle.driver_id !== driverId
    ) {
      throw new Error(
        "That vehicle is already assigned to another driver.",
      );
    }

    const { error: assignError } =
      await supabase
        .from("vehicles")
        .update({
          driver_id: driverId,
        })
        .eq(
          "vehicle_id",
          vehicleId,
        );

    if (assignError) {
      console.error(
        "Failed to assign vehicle:",
        assignError,
      );

      throw assignError;
    }
  }

  /**
   * Creates the driver's Supabase Auth account through
   * the create-driver-user Edge Function.
   *
   * The Edge Function is responsible for:
   *
   * auth.users
   *      ↓
   * public.users.auth_id
   *
   * and returns public.users.user_id.
   *
   * The returned userId is therefore the value that
   * must be passed to create_driver as p_driver_id.
   */
  public async createAuthAccount(
    email: string,
    password: string,
    name: string,
  ): Promise<DriverAuthAccount> {
    const cleanEmail =
      email.trim().toLowerCase();

    const cleanName =
      name.trim();

    if (!cleanEmail) {
      throw new Error(
        "Email address is required.",
      );
    }

    if (!password) {
      throw new Error(
        "A password is required.",
      );
    }

    if (!cleanName) {
      throw new Error(
        "Driver name is required.",
      );
    }

    const { data, error } = await supabase.rpc("create_driver_user", {
  p_email: cleanEmail,
  p_password: password,
  p_name: cleanName,
});

if (error) {
  throw new Error(error.message);
}

if (!data?.userId || !data?.authId || !data?.email) {
  throw new Error("Driver Auth account was not created correctly.");
}

return {
  userId: data.userId,
  authId: data.authId,
  email: data.email,
};

    if (error) {
      console.error(
        "Failed to create driver Auth account:",
        error,
      );

      throw new Error(
        error.message ||
          "Failed to create driver Auth account.",
      );
    }

    if (
      !data?.userId ||
      !data?.authId ||
      !data?.email
    ) {
      throw new Error(
        "The driver account was not created correctly. The Edge Function did not return the required user information.",
      );
    }

    return {
      userId: data.userId,
      authId: data.authId,
      email: data.email,
    };
  }

  public async toggleOnDutyStatus(
    isOnDuty: boolean,
  ): Promise<boolean> {
    const driverId =
      this.activeDriver.id;

    const { data, error } =
      await supabase.rpc(
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

    this.activeDriver.isOnDuty =
      isOnDuty;

    this.activeDriver.status =
      isOnDuty
        ? "active"
        : "inactive";

    return Boolean(data);
  }

  public async updateGpsCoordinates(
    lat: number,
    lng: number,
  ): Promise<void> {
    const driverId =
      this.activeDriver.id;

    const { data, error } =
      await supabase.rpc(
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
      .getDriverGpsChannel(
        driverId,
      )
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
    if (!driverId) {
      throw new Error(
        "A public user ID is required to create the driver.",
      );
    }

    const { data, error } =
      await supabase.rpc(
        "create_driver",
        {
          p_driver_id: driverId,

          p_name: driver.name,

          p_phone: driver.phone,

          p_licence_number:
            driver.licence_number ||
            null,

          p_zone:
            driver.zone ||
            null,

          p_province:
            driver.province ||
            null,

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

    const createdDriverId =
      typeof data === "string"
        ? data
        : data?.driver_id ??
          data?.id ??
          driverId;

    if (driver.vehicleId) {
      await this.assignVehicle(
        createdDriverId,
        driver.vehicleId,
      );
    }

    return {
      ...driver,

      id: createdDriverId,

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
            updates.name ??
            null,

          p_phone:
            updates.phone ??
            null,

          p_zone:
            updates.zone ??
            null,

          p_province:
            updates.province ??
            null,

          p_licence_number:
            updates.licence_number ??
            null,

          p_status:
            updates.status ??
            null,

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

    if (
      updates.vehicleId !==
      undefined
    ) {
      await this.assignVehicle(
        id,
        updates.vehicleId ||
          null,
      );
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

