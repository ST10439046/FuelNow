
import { supabase } from "../services/supabase";
import { realtimeHub } from "../patterns/realtimeObserver";

export type DriverDocumentStatus =
  | "valid"
  | "expiring_soon"
  | "expired"
  | "flagged";

export interface DriverDocumentModel {
  id: string;
  driverId: string;

  type: string;
  number: string;

  issueDate: string | null;
  expiryDate: string | null;

  status: DriverDocumentStatus;

  filePath: string | null;
  fileName: string | null;
  fileMimeType: string | null;
  fileSize: number | null;
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

  // ===========================================================================
  // Driver mapping
  // ===========================================================================

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

  // ===========================================================================
  // Compliance document mapping
  // ===========================================================================

  private mapDocument(
    document: any,
  ): DriverDocumentModel {
    const rawStatus =
      String(
        document.status ??
          "valid",
      ).toLowerCase();

    let status: DriverDocumentStatus;

    if (
      rawStatus === "flagged"
    ) {
      status = "flagged";
    } else if (
      rawStatus === "expired"
    ) {
      status = "expired";
    } else if (
      rawStatus === "expiring_soon"
    ) {
      status = "expiring_soon";
    } else {
      status = "valid";
    }

    return {
      id:
        document.document_id ??
        document.id ??
        "",

      driverId:
        document.driver_id ??
        "",

      type:
        document.document_type ??
        "Unknown Document",

      number:
        document.document_number ??
        "",

      issueDate:
        document.issue_date ??
        null,

      expiryDate:
        document.expiry_date ??
        null,

      status,

      filePath:
        document.file_path ??
        null,

      fileName:
        document.file_name ??
        null,

      fileMimeType:
        document.file_mime_type ??
        null,

      fileSize:
        document.file_size !== null &&
        document.file_size !== undefined
          ? Number(
              document.file_size,
            )
          : null,
    };
  }

  // ===========================================================================
  // Driver retrieval
  // ===========================================================================

  public async getAllDrivers(): Promise<DriverModel[]> {
    const {
      data,
      error,
    } = await supabase.rpc(
      "get_all_drivers",
    );

    if (error) {
      console.error(
        "Error fetching drivers:",
        error,
      );

      throw error;
    }

    const drivers =
      (data ?? []).map(
        (driver: any) =>
          this.mapDriver(driver),
      );

    /*
     * Load compliance documents separately.
     *
     * This avoids relying on get_all_drivers() returning
     * nested compliance data.
     */
    if (drivers.length > 0) {
      const driverIds =
        drivers.map(
          (driver: { id: any; }) =>
            driver.id,
        );

      const {
        data: documents,
        error:
          documentsError,
      } = await supabase
        .from(
          "compliance_documents",
        )
        .select("*")
        .in(
          "driver_id",
          driverIds,
        );

      if (documentsError) {
        console.error(
          "Error fetching driver compliance documents:",
          documentsError,
        );

        throw documentsError;
      }

      const documentsByDriver =
        new Map<
          string,
          DriverDocumentModel[]
        >();

      for (
        const rawDocument of
          documents ?? []
      ) {
        const document =
          this.mapDocument(
            rawDocument,
          );

        const existing =
          documentsByDriver.get(
            document.driverId,
          ) ?? [];

        existing.push(
          document,
        );

        documentsByDriver.set(
          document.driverId,
          existing,
        );
      }

      return drivers.map(
        (driver: { id: string; }) => ({
          ...driver,

          documents:
            documentsByDriver.get(
              driver.id,
            ) ?? [],
        }),
      );
    }

    return drivers;
  }

  public async getDriver(
    driverId: string,
  ): Promise<DriverModel> {
    const {
      data,
      error,
    } = await supabase.rpc(
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

    const driver = Array.isArray(
      data,
    )
      ? data[0]
      : data;

    if (!driver) {
      throw new Error(
        "Driver was not found.",
      );
    }

    const mappedDriver =
      this.mapDriver(driver);

    const documents =
      await this.getDriverDocuments(
        driverId,
      );

    return {
      ...mappedDriver,

      documents,
    };
  }

  // ===========================================================================
  // Compliance documents
  // ===========================================================================

  public async getDriverDocuments(
    driverId: string,
  ): Promise<DriverDocumentModel[]> {
    if (!driverId) {
      throw new Error(
        "A driver ID is required.",
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        "compliance_documents",
      )
      .select("*")
      .eq(
        "driver_id",
        driverId,
      )
      .order(
        "expiry_date",
        {
          ascending: true,
          nullsFirst: false,
        },
      );

    if (error) {
      console.error(
        "Error fetching compliance documents:",
        error,
      );

      throw error;
    }

    return (
      data ?? []
    ).map(
      (document: any) =>
        this.mapDocument(
          document,
        ),
    );
  }

  public async getComplianceDocument(
    documentId: string,
  ): Promise<DriverDocumentModel> {
    if (!documentId) {
      throw new Error(
        "A document ID is required.",
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        "compliance_documents",
      )
      .select("*")
      .eq(
        "document_id",
        documentId,
      )
      .single();

    if (error) {
      console.error(
        "Error fetching compliance document:",
        error,
      );

      throw error;
    }

    return this.mapDocument(
      data,
    );
  }

  public async flagDriverDocument(
    documentId: string,
  ): Promise<DriverDocumentModel> {
    if (!documentId) {
      throw new Error(
        "A document ID is required.",
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        "compliance_documents",
      )
      .update({
        status: "flagged",
      })
      .eq(
        "document_id",
        documentId,
      )
      .select("*")
      .single();

    if (error) {
      console.error(
        "Error flagging compliance document:",
        error,
      );

      throw error;
    }

    return this.mapDocument(
      data,
    );
  }

  public async unflagDriverDocument(
    documentId: string,
  ): Promise<DriverDocumentModel> {
    if (!documentId) {
      throw new Error(
        "A document ID is required.",
      );
    }

    const document =
      await this.getComplianceDocument(
        documentId,
      );

    /*
     * Restore the status based on the expiry date.
     *
     * We don't blindly restore "valid" because a document
     * could have expired while it was flagged.
     */
    let status: DriverDocumentStatus =
      "valid";

    if (
      document.expiryDate
    ) {
      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0,
      );

      const expiry =
        new Date(
          `${document.expiryDate}T00:00:00`,
        );

      expiry.setHours(
        0,
        0,
        0,
        0,
      );

      const daysUntilExpiry =
        Math.ceil(
          (
            expiry.getTime() -
            today.getTime()
          ) /
            86400000,
        );

      if (
        daysUntilExpiry < 0
      ) {
        status =
          "expired";
      } else if (
        daysUntilExpiry <= 30
      ) {
        status =
          "expiring_soon";
      }
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        "compliance_documents",
      )
      .update({
        status,
      })
      .eq(
        "document_id",
        documentId,
      )
      .select("*")
      .single();

    if (error) {
      console.error(
        "Error unflagging compliance document:",
        error,
      );

      throw error;
    }

    return this.mapDocument(
      data,
    );
  }

  public async deleteDriverDocument(
    documentId: string,
  ): Promise<void> {
    if (!documentId) {
      throw new Error(
        "A document ID is required.",
      );
    }

    /*
     * Fetch the document first so we know which private
     * Storage object needs to be deleted.
     */
    const document =
      await this.getComplianceDocument(
        documentId,
      );

    /*
     * Delete the physical file first.
     *
     * If there is no file_path, this step is skipped.
     */
    if (
      document.filePath
    ) {
      const {
        error:
          storageError,
      } = await supabase
        .storage
        .from(
          "driver-compliance",
        )
        .remove([
          document.filePath,
        ]);

      if (storageError) {
        console.error(
          "Failed to delete compliance file from Storage:",
          storageError,
        );

        throw new Error(
          `The document database record was not deleted because the Storage file could not be removed: ${storageError.message}`,
        );
      }
    }

    /*
     * Delete the database record.
     */
    const {
      error,
    } = await supabase
      .from(
        "compliance_documents",
      )
      .delete()
      .eq(
        "document_id",
        documentId,
      );

    if (error) {
      console.error(
        "Failed to delete compliance document record:",
        error,
      );

      throw error;
    }
  }

  public async getDriverDocumentUrl(
    documentId: string,
    expiresInSeconds = 300,
  ): Promise<string> {
    const document =
      await this.getComplianceDocument(
        documentId,
      );

    if (
      !document.filePath
    ) {
      throw new Error(
        "This compliance document does not have an uploaded file.",
      );
    }

    const {
      data,
      error,
    } = await supabase
      .storage
      .from(
        "driver-compliance",
      )
      .createSignedUrl(
        document.filePath,
        expiresInSeconds,
      );

    if (error) {
      console.error(
        "Failed to create compliance document URL:",
        error,
      );

      throw error;
    }

    if (!data?.signedUrl) {
      throw new Error(
        "Supabase did not return a document URL.",
      );
    }

    return data.signedUrl;
  }

  // ===========================================================================
  // Vehicles
  // ===========================================================================

  public async getAvailableVehicles(
    currentDriverId?: string,
  ): Promise<DriverVehicleModel[]> {
    const {
      data,
      error,
    } = await supabase
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

    return (
      data ?? []
    ).map(
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
            vehicle.capacity_litres ??
              0,
          ),

        driverId:
          vehicle.driver_id ??
          null,
      }),
    );
  }

  public async assignVehicle(
    driverId: string,
    vehicleId: string | null,
  ): Promise<void> {
    const {
      error:
        clearError,
    } = await supabase
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

    if (
      vehicleError ||
      !vehicle
    ) {
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

    const {
      error: assignError,
    } = await supabase
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

  // ===========================================================================
  // Driver Auth
  // ===========================================================================

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

    const {
      data,
      error,
    } = await supabase.rpc(
      "create_driver_user",
      {
        p_email:
          cleanEmail,

        p_password:
          password,

        p_name:
          cleanName,
      },
    );

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
        "The driver account was not created correctly. The create_driver_user function did not return the required user information.",
      );
    }

    return {
      userId:
        data.userId,

      authId:
        data.authId,

      email:
        data.email,
    };
  }

  // ===========================================================================
  // Driver status / GPS
  // ===========================================================================

  public async toggleOnDutyStatus(
    isOnDuty: boolean,
  ): Promise<boolean> {
    const driverId =
      this.activeDriver.id;

    const {
      data,
      error,
    } = await supabase.rpc(
      "update_driver_status",
      {
        p_driver_id:
          driverId,

        p_status:
          isOnDuty
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

    const {
      data,
      error,
    } = await supabase.rpc(
      "update_driver_gps",
      {
        p_driver_id:
          driverId,

        p_latitude:
          lat,

        p_longitude:
          lng,
      },
    );

    if (error) {
      console.error(
        "Failed to update driver GPS:",
        error,
      );

      throw error;
    }

    this.activeDriver.latitude =
      lat;

    this.activeDriver.longitude =
      lng;

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

  // ===========================================================================
  // Driver CRUD
  // ===========================================================================

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

    const {
      data,
      error,
    } = await supabase.rpc(
      "create_driver",
      {
        p_driver_id:
          driverId,

        p_name:
          driver.name,

        p_phone:
          driver.phone,

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
          driver.rating ||
          0,
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

    if (
      driver.vehicleId
    ) {
      await this.assignVehicle(
        createdDriverId,
        driver.vehicleId,
      );
    }

    return {
      ...driver,

      id:
        createdDriverId,

      todayEarnings:
        0,

      weekEarnings:
        0,

      monthEarnings:
        0,

      documents: [],
    };
  }

  public async updateDriver(
    id: string,
    updates: Partial<DriverModel>,
  ): Promise<void> {
    const {
      error,
    } = await supabase.rpc(
      "update_driver_details",
      {
        p_driver_id:
          id,

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
          updates.rating !==
          undefined
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
    const {
      data,
      error,
    } = await supabase.rpc(
      "delete_driver",
      {
        p_driver_id:
          id,
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

