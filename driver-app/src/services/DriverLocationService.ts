import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { driverRepository } from '../repositories/DriverRepository';

const LOCATION_TASK_NAME =
  'fuelnow-driver-location-task';

const LOCATION_UPDATE_INTERVAL = 5000;
const LOCATION_DISTANCE_INTERVAL = 10;

let trackingStartPromise:
  | Promise<boolean>
  | null = null;

  TaskManager.defineTask(
    LOCATION_TASK_NAME,
    async ({ data, error }: any) => {
      if (error) {
        console.error(
          'DriverLocationService: background location task error:',
          error
        );
        return;
      }
  
      if (!data) {
        return;
      }
  
      const locations = data.locations;
  
      if (!locations || locations.length === 0) {
        return;
      }
  
      const location = locations[locations.length - 1];
  
      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;
  
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        return;
      }
  
      try {
        await driverRepository.updateGpsCoordinates(
          latitude,
          longitude
        );
      } catch (updateError) {
        console.error(
          'DriverLocationService: failed to update driver GPS coordinates:',
          updateError
        );
      }
    }
  );

class DriverLocationService {
  private static instance:
    | DriverLocationService
    | null = null;

  private constructor() {}

  public static getInstance():
    DriverLocationService {
    if (
      !DriverLocationService.instance
    ) {
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
      return await Location.hasStartedLocationUpdatesAsync(
        LOCATION_TASK_NAME
      );
    } catch (error) {
      console.error(
        'DriverLocationService: failed to check tracking state:',
        error
      );

      return false;
    }
  }

  public async requestPermissions(): Promise<boolean> {
    const {
      status: foregroundStatus,
    } =
      await Location.requestForegroundPermissionsAsync();

    if (
      foregroundStatus !==
      Location.PermissionStatus.GRANTED
    ) {
      console.error(
        'DriverLocationService: foreground location permission was not granted.'
      );

      return false;
    }

    const {
      status: backgroundStatus,
    } =
      await Location.requestBackgroundPermissionsAsync();

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
        return true;
      }

      await Location.startLocationUpdatesAsync(
        LOCATION_TASK_NAME,
        {
          accuracy:
            Location.Accuracy.High,

          timeInterval:
            LOCATION_UPDATE_INTERVAL,

          distanceInterval:
            LOCATION_DISTANCE_INTERVAL,

          deferredUpdatesInterval:
            LOCATION_UPDATE_INTERVAL,

          deferredUpdatesDistance:
            LOCATION_DISTANCE_INTERVAL,

          pausesUpdatesAutomatically:
            false,

          activityType:
            Location.ActivityType.AutomotiveNavigation,

          showsBackgroundLocationIndicator:
            true,

          foregroundService: {
            notificationTitle:
              'FuelNow Driver',

            notificationBody:
              'FuelNow is updating your location for active driver tracking.',

            notificationColor:
              '#1A2E35',

            killServiceOnDestroy:
              true,
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
      const {
        status,
      } =
        await Location.getForegroundPermissionsAsync();

      if (
        status !==
        Location.PermissionStatus.GRANTED
      ) {
        return false;
      }

      const location =
        await Location.getCurrentPositionAsync({
          accuracy:
            Location.Accuracy.High,
        });

      const latitude =
        location.coords.latitude;

      const longitude =
        location.coords.longitude;

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        return false;
      }

      await driverRepository.updateGpsCoordinates(
        latitude,
        longitude
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