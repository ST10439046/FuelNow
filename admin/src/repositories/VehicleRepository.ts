
import { supabase } from "../services/supabase";

export interface VehicleModel {
  vehicleId: string;
  driverId: string | null;
  driverName: string | null;
  registrationNumber: string;
  make: string;
  model: string;
  capacityLitres: number;
}

export interface DriverOption {
  driverId: string;
  name: string;
  licenceNumber: string;
  status: string;
}

class VehicleRepository {
  private static instance: VehicleRepository;

  private constructor() {}

  public static getInstance(): VehicleRepository {
    if (!VehicleRepository.instance) {
      VehicleRepository.instance = new VehicleRepository();
    }

    return VehicleRepository.instance;
  }

  public async getAllVehicles(): Promise<VehicleModel[]> {
    const { data, error } = await supabase
      .from("vehicles")
      .select(
        `
        vehicle_id,
        driver_id,
        registration_number,
        make,
        model,
        capacity_litres,
        drivers (
          driver_id,
          licence_number,
          status,
          users (
            full_name
          )
        )
        `,
      )
      .order("registration_number", { ascending: true });

    if (error) {
      console.error("Failed to load vehicles:", error);
      throw error;
    }

    return (data ?? []).map((vehicle: any) => ({
      vehicleId: vehicle.vehicle_id,
      driverId: vehicle.driver_id,
      driverName: vehicle.drivers?.users?.full_name ?? null,
      registrationNumber: vehicle.registration_number,
      make: vehicle.make,
      model: vehicle.model,
      capacityLitres: Number(vehicle.capacity_litres),
    }));
  }

  public async getAvailableDrivers(): Promise<DriverOption[]> {
    const { data: drivers, error: driverError } = await supabase
      .from("drivers")
      .select(
        `
        driver_id,
        licence_number,
        status,
        users (
          full_name
        )
        `,
      )
      .order("licence_number", { ascending: true });

    if (driverError) {
      console.error("Failed to load drivers:", driverError);
      throw driverError;
    }

    const { data: vehicles, error: vehicleError } = await supabase
      .from("vehicles")
      .select("driver_id")
      .not("driver_id", "is", null);

    if (vehicleError) {
      console.error("Failed to check assigned drivers:", vehicleError);
      throw vehicleError;
    }

    const assignedDriverIds = new Set(
      (vehicles ?? [])
        .map((vehicle: any) => vehicle.driver_id)
        .filter(Boolean),
    );

    return (drivers ?? [])
      .filter((driver: any) => !assignedDriverIds.has(driver.driver_id))
      .map((driver: any) => ({
        driverId: driver.driver_id,
        name: driver.users?.full_name ?? "Unknown Driver",
        licenceNumber: driver.licence_number,
        status: driver.status ?? "Offline",
      }));
  }

  public async getDriversForVehicle(
    vehicleId: string,
  ): Promise<DriverOption[]> {
    const { data: drivers, error: driverError } = await supabase
      .from("drivers")
      .select(
        `
        driver_id,
        licence_number,
        status,
        users (
          full_name
        )
        `,
      )
      .order("licence_number", { ascending: true });

    if (driverError) {
      console.error("Failed to load drivers:", driverError);
      throw driverError;
    }

    const { data: vehicles, error: vehicleError } = await supabase
      .from("vehicles")
      .select("vehicle_id, driver_id")
      .not("driver_id", "is", null);

    if (vehicleError) {
      console.error("Failed to check assigned drivers:", vehicleError);
      throw vehicleError;
    }

    const assignedToOtherVehicle = new Set(
      (vehicles ?? [])
        .filter(
          (vehicle: any) =>
            vehicle.vehicle_id !== vehicleId && vehicle.driver_id,
        )
        .map((vehicle: any) => vehicle.driver_id),
    );

    return (drivers ?? [])
      .filter((driver: any) => !assignedToOtherVehicle.has(driver.driver_id))
      .map((driver: any) => ({
        driverId: driver.driver_id,
        name: driver.users?.full_name ?? "Unknown Driver",
        licenceNumber: driver.licence_number,
        status: driver.status ?? "Offline",
      }));
  }

  public async createVehicle(payload: {
    registrationNumber: string;
    make: string;
    model: string;
    capacityLitres: number;
    driverId?: string | null;
  }): Promise<void> {
    const { error } = await supabase.from("vehicles").insert({
      registration_number: payload.registrationNumber.trim(),
      make: payload.make.trim(),
      model: payload.model.trim(),
      capacity_litres: payload.capacityLitres,
      driver_id: payload.driverId || null,
    });

    if (error) {
      console.error("Failed to create vehicle:", error);
      throw error;
    }
  }

  public async updateVehicle(
    vehicleId: string,
    payload: {
      registrationNumber: string;
      make: string;
      model: string;
      capacityLitres: number;
    },
  ): Promise<void> {
    const { error } = await supabase
      .from("vehicles")
      .update({
        registration_number: payload.registrationNumber.trim(),
        make: payload.make.trim(),
        model: payload.model.trim(),
        capacity_litres: payload.capacityLitres,
      })
      .eq("vehicle_id", vehicleId);

    if (error) {
      console.error("Failed to update vehicle:", error);
      throw error;
    }
  }

  public async deleteVehicle(vehicleId: string): Promise<void> {
    const { error } = await supabase
      .from("vehicles")
      .delete()
      .eq("vehicle_id", vehicleId);

    if (error) {
      console.error("Failed to delete vehicle:", error);
      throw error;
    }
  }

  public async assignDriver(
    vehicleId: string,
    driverId: string | null,
  ): Promise<void> {
    const { error } = await supabase
      .from("vehicles")
      .update({
        driver_id: driverId || null,
      })
      .eq("vehicle_id", vehicleId);

    if (error) {
      console.error("Failed to assign driver:", error);
      throw error;
    }
  }
}

export const vehicleRepository = VehicleRepository.getInstance();
