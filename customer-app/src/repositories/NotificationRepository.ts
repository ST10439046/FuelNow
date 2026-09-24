import { supabase } from '../services/supabase';
import { userRepository } from './UserRepository';

export type NotificationType =
  | 'ORDER_STATUS'
  | 'PAYMENT'
  | 'FUEL_PRICE'
  | 'SYSTEM';

export interface NotificationData {
  order_id?: string;
  status?: string;
  type?: string;
  prices?: Array<{
    fuel_type_id?: string;
    fuel_type?: string;
    price?: number;
    price_per_litre?: number;
  }>;
  [key: string]: unknown;
}

export interface NotificationModel {
  id: string;
  customerId: string;
  orderId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data: NotificationData;
  isRead: boolean;
  createdAt: string;
}

type NotificationRow = {
  notification_id: string;
  customer_id: string;
  order_id: string | null;
  type: string;
  title: string;
  message: string;
  data: NotificationData | null;
  is_read: boolean;
  created_at: string;
};

export class NotificationRepository {
  private static instance: NotificationRepository;

  private constructor() {}

  public static getInstance(): NotificationRepository {
    if (!NotificationRepository.instance) {
      NotificationRepository.instance =
        new NotificationRepository();
    }

    return NotificationRepository.instance;
  }

  private mapNotification(
    row: NotificationRow
  ): NotificationModel {
    return {
      id: row.notification_id,
      customerId: row.customer_id,
      orderId: row.order_id ?? undefined,
      type: this.mapType(row.type),
      title: row.title,
      message: row.message,
      data: row.data ?? {},
      isRead: row.is_read,
      createdAt: row.created_at,
    };
  }

  private mapType(type: string): NotificationType {
    switch (type) {
      case 'PAYMENT':
        return 'PAYMENT';

      case 'FUEL_PRICE':
        return 'FUEL_PRICE';

      case 'SYSTEM':
        return 'SYSTEM';

      case 'ORDER_STATUS':
      default:
        return 'ORDER_STATUS';
    }
  }

  public async getNotifications(): Promise<NotificationModel[]> {
    const {
      data,
      error,
    } = await supabase.rpc(
      'get_customer_notifications'
    );

    if (error) {
      console.error(
        'NotificationRepository: failed to load notifications:',
        error
      );

      throw error;
    }

    return ((data ?? []) as NotificationRow[]).map(
      row => this.mapNotification(row)
    );
  }

  public async getUnreadCount(): Promise<number> {
    const {
      data,
      error,
    } = await supabase.rpc(
      'get_unread_notification_count'
    );

    if (error) {
      console.error(
        'NotificationRepository: failed to load unread count:',
        error
      );

      throw error;
    }

    return Number(data ?? 0);
  }

  public async markAsRead(
    notificationId: string
  ): Promise<boolean> {
    const {
      data,
      error,
    } = await supabase.rpc(
      'mark_notification_read',
      {
        p_notification_id: notificationId,
      }
    );

    if (error) {
      console.error(
        'NotificationRepository: failed to mark notification as read:',
        error
      );

      throw error;
    }

    return data === true;
  }

  public async markAllAsRead(): Promise<number> {
    const {
      data,
      error,
    } = await supabase.rpc(
      'mark_all_notifications_read'
    );

    if (error) {
      console.error(
        'NotificationRepository: failed to mark all notifications as read:',
        error
      );

      throw error;
    }

    return Number(data ?? 0);
  }

  public async subscribe(
    onNotification: (
      notification: NotificationModel
    ) => void
  ): Promise<() => void> {
    const customerId =
      await userRepository.getCurrentUserId();

    const channelName =
      `customer-notifications:${customerId}`;

    const channel =
      supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `customer_id=eq.${customerId}`,
          },
          payload => {
            try {
              const notification =
                this.mapNotification(
                  payload.new as NotificationRow
                );

              onNotification(notification);
            } catch (error) {
              console.error(
                'NotificationRepository: failed to process realtime notification:',
                error
              );
            }
          }
        )
        .subscribe(status => {
          console.log(
            `NotificationRepository: realtime status = ${status}`
          );
        });

    return () => {
      void supabase.removeChannel(channel);
    };
  }
}

export const notificationRepository =
  NotificationRepository.getInstance();