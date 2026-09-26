import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { driverRepository } from '../repositories/DriverRepository';

const LOCATION_TASK_NAME = 'fuelnow-driver-location-task';

const LOCATION_UPDATE_INTERVAL = 5000;
const LOCATION_DISTANCE_INTERVAL = 10;

let trackingStartPromise: Promise<boolean> | null = null;

TaskManager.defineTask(
  LOCATION_TASK_NAME,
  async ({ data, error }: any) => {
    console.log(
      'DriverLocationService: background task fired.'
    );

    if (error) {
      console.error(
        'DriverLocationService: background task error:',
        error
      );
      return;
    }

    if (!data) {
      console.log(
        'DriverLocationService: background task received no data.'
      );
      return;
    }

    const locations = data.locations;

    console.log(
      'DriverLocationService: locations received:',
      locations?.length ?? 0
    );

    if (!locations || locations.length === 0) {
      return;
    }

    const location = locations[locations.length - 1];

    const latitude = location.coords.latitude;
    const longitude = location.coords.longitude;

    console.log(
      'DriverLocationService: GPS coordinates:',
      latitude,
      longitude
    );

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      console.error(
        'DriverLocationService: invalid GPS coordinates.'
      );
      return;
    }

    try {
      await driverRepository.updateGpsCoordinates(
        latitude,
        longitude
      );

      console.log(
        'DriverLocationService: Supabase GPS update successful.'
      );
    } catch (updateError) {
      console.error(
        'DriverLocationService: Supabase GPS update failed:',
        updateError
      );
    }
  }
);

class DriverLocationService {
  private static instance: DriverLocationService | null = null;

  private constructor() {}

  public static getInstance(): DriverLocationService {
    if (!DriverLocationService.instance) {
      DriverLocationService.instance =
        new DriverLocationService();
    }

    return DriverLocationService.instance;
  }

  public getTaskName(): string {
    return LOCATION_TASK_NAME;
  }

  public async isTracking(): Promise<boolean> {
    try {
      const tracking =
        await Location.hasStartedLocationUpdatesAsync(
          LOCATION_TASK_NAME
        );

      console.log(
        'DriverLocationService: tracking status:',
        tracking
      );

      return tracking;
    } catch (error) {
      console.error(
        'DriverLocationService: failed to check tracking state:',
        error
      );

      return false;
    }
  }

  public async requestPermissions(): Promise<boolean> {
    console.log(
      'DriverLocationService: requesting foreground location permission.'
    );

    const {
      status: foregroundStatus,
    } =
      await Location.requestForegroundPermissionsAsync();

    console.log(
      'DriverLocationService: foreground permission:',
      foregroundStatus
    );

    if (
      foregroundStatus !==
      Location.PermissionStatus.GRANTED
    ) {
      console.error(
        'DriverLocationService: foreground location permission was not granted.'
      );

      return false;
    }

    console.log(
      'DriverLocationService: requesting background location permission.'
    );

    const {
      status: backgroundStatus,
    } =
      await Location.requestBackgroundPermissionsAsync();

    console.log(
      'DriverLocationService: background permission:',
      backgroundStatus
    );

    if (
      backgroundStatus !==
      Location.PermissionStatus.GRANTED
    ) {
      console.error(
        'DriverLocationService: background location permission was not granted.'
      );

      return false;
    }

    return true;
  }

  public async startTracking(): Promise<boolean> {
    if (trackingStartPromise) {
      return trackingStartPromise;
    }

    trackingStartPromise =
      this.startTrackingInternal();

    try {
      return await trackingStartPromise;
    } finally {
      trackingStartPromise = null;
    }
  }

  private async startTrackingInternal(): Promise<boolean> {
    try {
      const permissionsGranted =
        await this.requestPermissions();

      if (!permissionsGranted) {
        return false;
      }

      const alreadyTracking =
        await this.isTracking();

      if (alreadyTracking) {
        console.log(
          'DriverLocationService: tracking already running.'
        );

        return true;
      }

      console.log(
        'DriverLocationService: starting background location updates.'
      );

      await Location.startLocationUpdatesAsync(
        LOCATION_TASK_NAME,
        {
          accuracy: Location.Accuracy.High,

          timeInterval: LOCATION_UPDATE_INTERVAL,

          distanceInterval: LOCATION_DISTANCE_INTERVAL,

          deferredUpdatesInterval:
            LOCATION_UPDATE_INTERVAL,

          deferredUpdatesDistance:
            LOCATION_DISTANCE_INTERVAL,

          pausesUpdatesAutomatically: false,

          activityType:
            Location.ActivityType.AutomotiveNavigation,

          showsBackgroundLocationIndicator: true,

          foregroundService: {
            notificationTitle: 'FuelNow Driver',

            notificationBody:
              'FuelNow is updating your location for active driver tracking.',

            notificationColor: '#1A2E35',

            killServiceOnDestroy: true,
          },
        }
      );

      console.log(
        'DriverLocationService: background location tracking started.'
      );

      return true;
    } catch (error) {
      console.error(
        'DriverLocationService: failed to start tracking:',
        error
      );

      return false;
    }
  }

  public async stopTracking(): Promise<void> {
    try {
      const tracking =
        await this.isTracking();

      if (!tracking) {
        return;
      }

      await Location.stopLocationUpdatesAsync(
        LOCATION_TASK_NAME
      );

      console.log(
        'DriverLocationService: background location tracking stopped.'
      );
    } catch (error) {
      console.error(
        'DriverLocationService: failed to stop tracking:',
        error
      );
    }
  }

  public async updateCurrentLocation(): Promise<boolean> {
    try {
      console.log(
        'DriverLocationService: getting current GPS location.'
      );

      const {
        status,
      } =
        await Location.getForegroundPermissionsAsync();

      console.log(
        'DriverLocationService: foreground permission:',
        status
      );

      if (
        status !==
        Location.PermissionStatus.GRANTED
      ) {
        console.error(
          'DriverLocationService: foreground location permission not granted.'
        );

        return false;
      }

      const location =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      const latitude =
        location.coords.latitude;

      const longitude =
        location.coords.longitude;

      console.log(
        'DriverLocationService: current GPS coordinates:',
        latitude,
        longitude
      );

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        console.error(
          'DriverLocationService: invalid current GPS coordinates.'
        );

        return false;
      }

      await driverRepository.updateGpsCoordinates(
        latitude,
        longitude
      );

      console.log(
        'DriverLocationService: current GPS location successfully written to Supabase.'
      );

      return true;
    } catch (error) {
      console.error(
        'DriverLocationService: failed to update current location:',
        error
      );

      return false;
    }
  }
}

export const driverLocationService =
  DriverLocationService.getInstance();

export {
  LOCATION_TASK_NAME,
};