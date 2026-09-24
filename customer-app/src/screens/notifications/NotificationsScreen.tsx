import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { Feather } from '@expo/vector-icons';

import { useDesignMode } from '../../context/DesignModeContext';

import {
  FontSizes,
  Spacing,
  Radius,
} from '../../theme/tokens';

import {
  notificationRepository,
  NotificationModel,
} from '../../repositories/NotificationRepository';

interface Props {
  navigation?: any;
}

type IconName =
  | 'package'
  | 'credit-card'
  | 'tag'
  | 'bell'
  | 'truck'
  | 'check-circle'
  | 'x-circle';

function timeAgo(iso: string): string {
  const diff =
    (Date.now() - new Date(iso).getTime()) /
    1000;

  if (diff < 60) {
    return 'Just now';
  }

  if (diff < 3600) {
    return `${Math.floor(diff / 60)}m ago`;
  }

  if (diff < 86400) {
    return `${Math.floor(diff / 3600)}h ago`;
  }

  if (diff < 604800) {
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return new Date(iso).toLocaleDateString();
}

function getNotificationIcon(
  notification: NotificationModel
): IconName {
  if (notification.type === 'PAYMENT') {
    return 'credit-card';
  }

  if (notification.type === 'FUEL_PRICE') {
    return 'tag';
  }

  if (notification.type === 'SYSTEM') {
    return 'bell';
  }

  switch (notification.data.status) {
    case 'ACCEPTED':
      return 'truck';

    case 'IN_TRANSIT':
    case 'NAVIGATING':
      return 'truck';

    case 'ARRIVED':
      return 'check-circle';

    case 'DISPENSING':
      return 'package';

    case 'DELIVERED':
    case 'COMPLETED':
      return 'check-circle';

    case 'CANCELLED':
      return 'x-circle';

    default:
      return 'package';
  }
}

export default function NotificationsScreen({
  navigation,
}: Props) {
  const {
    colors,
    font,
    isWireframe: isWF,
  } = useDesignMode();

  const [
    notifications,
    setNotifications,
  ] = useState<NotificationModel[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    markingAllRead,
    setMarkingAllRead,
  ] = useState(false);

  const loadNotifications =
    useCallback(async () => {
      try {
        setLoading(true);

        const data =
          await notificationRepository
            .getNotifications();

        setNotifications(data);
      } catch (error) {
        console.error(
          'NotificationsScreen: failed to load notifications:',
          error
        );

        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadNotifications();

    let unsubscribe:
      | (() => void)
      | undefined;

    let mounted = true;

    const setupRealtime =
      async () => {
        try {
          const cleanup =
            await notificationRepository
              .subscribe(
                notification => {
                  if (!mounted) {
                    return;
                  }

                  setNotifications(
                    current => {
                      const exists =
                        current.some(
                          item =>
                            item.id ===
                            notification.id
                        );

                      if (exists) {
                        return current;
                      }

                      return [
                        notification,
                        ...current,
                      ];
                    }
                  );
                }
              );

          if (mounted) {
            unsubscribe = cleanup;
          } else {
            cleanup();
          }
        } catch (error) {
          console.error(
            'NotificationsScreen: realtime setup failed:',
            error
          );
        }
      };

    setupRealtime();

    return () => {
      mounted = false;

      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loadNotifications]);

  const handleMarkRead =
    async (
      notification: NotificationModel
    ) => {
      if (notification.isRead) {
        return;
      }

      setNotifications(
        current =>
          current.map(item =>
            item.id === notification.id
              ? {
                  ...item,
                  isRead: true,
                }
              : item
          )
      );

      try {
        await notificationRepository
          .markAsRead(
            notification.id
          );
      } catch (error) {
        console.error(
          'NotificationsScreen: failed to mark notification as read:',
          error
        );

        setNotifications(
          current =>
            current.map(item =>
              item.id === notification.id
                ? {
                    ...item,
                    isRead: false,
                  }
                : item
            )
        );
      }
    };

  const handleMarkAllRead =
    async () => {
      const unread =
        notifications.some(
          notification =>
            !notification.isRead
        );

      if (!unread || markingAllRead) {
        return;
      }

      const previous =
        notifications;

      setMarkingAllRead(true);

      setNotifications(
        current =>
          current.map(notification => ({
            ...notification,
            isRead: true,
          }))
      );

      try {
        await notificationRepository
          .markAllAsRead();
      } catch (error) {
        console.error(
          'NotificationsScreen: failed to mark all notifications as read:',
          error
        );

        setNotifications(previous);
      } finally {
        setMarkingAllRead(false);
      }
    };

  const handleNotificationPress =
    async (
      notification: NotificationModel
    ) => {
      await handleMarkRead(
        notification
      );

      const orderId =
        notification.orderId ??
        notification.data.order_id;

      if (
        orderId &&
        (
          notification.type ===
            'ORDER_STATUS' ||
          notification.type ===
            'PAYMENT'
        )
      ) {
        navigation?.navigate(
          'OrderDetails',
          {
            orderId,
          }
        );

        return;
      }

      if (
        notification.type ===
        'FUEL_PRICE'
      ) {
        navigation?.navigate(
          'FuelSelection'
        );

        return;
      }
    };

  const getIconBackground =
    (
      notification: NotificationModel
    ): string => {
      if (isWF) {
        return notification.isRead
          ? '#E0E0E0'
          : '#C0C0C0';
      }

      if (notification.isRead) {
        return colors.warmAsh;
      }

      if (
        notification.type ===
        'FUEL_PRICE'
      ) {
        return colors.amberLight;
      }

      if (
        notification.type ===
        'PAYMENT'
      ) {
        return colors.greenLight;
      }

      return colors.petrolLight;
    };

  const getIconColor =
    (
      notification: NotificationModel
    ): string => {
      if (isWF) {
        return notification.isRead
          ? '#888'
          : '#444';
      }

      if (notification.isRead) {
        return colors.inkLight;
      }

      if (
        notification.type ===
        'FUEL_PRICE'
      ) {
        return colors.ignitionAmber;
      }

      if (
        notification.type ===
        'PAYMENT'
      ) {
        return colors.dieselGreen;
      }

      return colors.petrolDeep;
    };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isWF
            ? '#F0F0F0'
            : colors.warmAsh,
        },
      ]}
    >
      <View style={styles.topBar}>
        <View
          style={styles.headerLeft}
        >
          <TouchableOpacity
            style={[
              styles.backButton,
              {
                backgroundColor:
                  isWF
                    ? '#FFFFFF'
                    : colors.white,
                borderColor:
                  isWF
                    ? '#DDDDDD'
                    : colors.divider,
              },
            ]}
            onPress={() =>
              navigation?.goBack()
            }
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather
              name="arrow-left"
              size={22}
              color={
                isWF
                  ? '#1A1A1A'
                  : colors.charcoalInk
              }
            />
          </TouchableOpacity>

          <Text
            style={[
              styles.title,
              {
                color: isWF
                  ? '#1A1A1A'
                  : colors.charcoalInk,
                fontFamily:
                  font('displayBold'),
                fontSize:
                  FontSizes.xl,
              },
            ]}
          >
            Notifications
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={
            handleMarkAllRead
          }
          disabled={
            markingAllRead
          }
        >
          {markingAllRead ? (
            <ActivityIndicator
              size="small"
              color={
                isWF
                  ? '#444'
                  : colors.petrolDeep
              }
            />
          ) : (
            <Text
              style={{
                color: isWF
                  ? '#444'
                  : colors.petrolDeep,
                fontFamily:
                  font('bodyMedium'),
                fontSize:
                  FontSizes.sm,
              }}
            >
              Mark all read
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          color={
            isWF
              ? '#888'
              : colors.petrolDeep
          }
          style={{
            marginTop: 40,
          }}
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item =>
            item.id
          }
          contentContainerStyle={
            styles.list
          }
          showsVerticalScrollIndicator={
            false
          }
          renderItem={({
            item,
          }) => (
            <TouchableOpacity
              style={[
                styles.notifCard,
                {
                  backgroundColor:
                    item.isRead
                      ? isWF
                        ? '#FFFFFF'
                        : colors.white
                      : isWF
                        ? '#EEEEEE'
                        : colors.petrolLight,

                  borderRadius:
                    isWF
                      ? Radius.sm
                      : Radius.lg,

                  borderWidth:
                    item.isRead
                      ? 1
                      : 0,

                  borderColor:
                    isWF
                      ? '#DDDDDD'
                      : colors.divider,
                },
              ]}
              activeOpacity={0.8}
              onPress={() =>
                handleNotificationPress(
                  item
                )
              }
            >
              {!item.isRead && (
                <View
                  style={[
                    styles.unreadDot,
                    {
                      backgroundColor:
                        isWF
                          ? '#555'
                          : colors.ignitionAmber,
                    },
                  ]}
                />
              )}

              <View
                style={[
                  styles.notifIcon,
                  {
                    backgroundColor:
                      getIconBackground(
                        item
                      ),
                    borderRadius:
                      isWF
                        ? 6
                        : 20,
                  },
                ]}
              >
                <Feather
                  name={
                    getNotificationIcon(
                      item
                    )
                  }
                  size={18}
                  color={
                    getIconColor(
                      item
                    )
                  }
                />
              </View>

              <View
                style={{
                  flex: 1,
                  gap: 3,
                }}
              >
                <View
                  style={{
                    flexDirection:
                      'row',
                    justifyContent:
                      'space-between',
                    alignItems:
                      'flex-start',
                  }}
                >
                  <Text
                    style={[
                      styles.notifTitle,
                      {
                        color:
                          isWF
                            ? '#1A1A1A'
                            : colors.charcoalInk,

                        fontFamily:
                          font(
                            item.isRead
                              ? 'body'
                              : 'bodyMedium'
                          ),

                        fontSize:
                          FontSizes.sm,

                        flex: 1,

                        marginRight:
                          Spacing.sm,
                      },
                    ]}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={{
                      color:
                        isWF
                          ? '#999'
                          : colors.inkFaint,

                      fontFamily:
                        font('body'),

                      fontSize:
                        FontSizes.xs,
                    }}
                  >
                    {timeAgo(
                      item.createdAt
                    )}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.notifBody,
                    {
                      color:
                        isWF
                          ? '#555'
                          : colors.inkLight,

                      fontFamily:
                        font('body'),

                      fontSize:
                        FontSizes.xs,
                    },
                  ]}
                >
                  {item.message}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View
              style={styles.empty}
            >
              <Feather
                name="bell-off"
                size={40}
                color={
                  isWF
                    ? '#CCCCCC'
                    : colors.inkFaint
                }
              />

              <Text
                style={{
                  color: isWF
                    ? '#888'
                    : colors.inkLight,

                  fontFamily:
                    font('body'),

                  fontSize:
                    FontSizes.base,
                }}
              >
                No notifications yet
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    padding:
      Spacing.base,
    paddingTop:
      Spacing.md,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  title: {},

  list: {
    padding: Spacing.base,
    paddingBottom:
      Spacing['4xl'],
    gap: Spacing.sm,
  },

  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.md,
    position: 'relative',
  },

  unreadDot: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  notifIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  notifTitle: {
    lineHeight: 18,
  },

  notifBody: {
    lineHeight: 16,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    gap: Spacing.md,
  },
});