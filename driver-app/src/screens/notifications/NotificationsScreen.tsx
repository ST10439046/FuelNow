import React, { useEffect, useState } from 'react';
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
import { FontSizes, Spacing, Radius } from '../../theme/tokens';
import { supabase } from '../../services/supabase';

interface Props {
  navigation?: any;
}

type NotifType = 'order' | 'promo' | 'system';

interface NotificationItem {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

const NOTIF_ICONS: Record<NotifType, string> = {
  order: 'package',
  promo: 'tag',
  system: 'bell',
};

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;

  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsScreen({ navigation }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();

  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (mounted) {
            setNotifs([]);
          }

          return;
        }

        const { data, error } = await supabase
          .from('notifications')
          .select('id, type, title, body, is_read, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error(
            'NotificationsScreen: failed to load notifications',
            error
          );

          if (mounted) {
            setNotifs([]);
          }

          return;
        }

        if (mounted) {
          setNotifs(
            (data ?? []).map((notification) => ({
              id: String(notification.id),
              type: notification.type as NotifType,
              title: notification.title,
              body: notification.body,
              isRead: Boolean(notification.is_read),
              createdAt: notification.created_at,
            }))
          );
        }
      } catch (error) {
        console.error(
          'NotificationsScreen: unexpected notification error',
          error
        );

        if (mounted) {
          setNotifs([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, []);

  const markAllRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error(
        'NotificationsScreen: failed to mark notifications as read',
        error
      );

      return;
    }

    setNotifs((current) =>
      current.map((notification) => ({
        ...notification,
        isRead: true,
      }))
    );
  };

  const markRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error(
        'NotificationsScreen: failed to mark notification as read',
        error
      );

      return;
    }

    setNotifs((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              isRead: true,
            }
          : notification
      )
    );
  };

  const getIconBg = (
    type: NotifType,
    isRead: boolean
  ): string => {
    if (isWF) {
      return isRead ? '#E0E0E0' : '#C0C0C0';
    }

    if (!isRead) {
      return type === 'order'
        ? colors.petrolLight
        : colors.amberLight;
    }

    return colors.warmAsh;
  };

  const getIconColor = (
    type: NotifType,
    isRead: boolean
  ): string => {
    if (isWF) {
      return isRead ? '#888' : '#444';
    }

    if (!isRead) {
      return type === 'order'
        ? colors.petrolDeep
        : colors.ignitionAmber;
    }

    return colors.inkLight;
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isWF ? '#F0F0F0' : colors.warmAsh,
        },
      ]}
    >
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={styles.backButton}
        >
          <Feather
            name="arrow-left"
            size={21}
            color={isWF ? '#222' : colors.charcoalInk}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.title,
            {
              color: isWF ? '#1A1A1A' : colors.charcoalInk,
              fontFamily: font('displayBold'),
              fontSize: FontSizes.xl,
            },
          ]}
        >
          Notifications
        </Text>

        <TouchableOpacity
          onPress={markAllRead}
          disabled={notifs.length === 0}
        >
          <Text
            style={[
              {
                color: isWF ? '#444' : colors.petrolDeep,
                fontFamily: font('bodyMedium'),
                fontSize: FontSizes.sm,
                opacity: notifs.length === 0 ? 0.4 : 1,
              },
            ]}
          >
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          color={isWF ? '#888' : colors.petrolDeep}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={(notification) => notification.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.notifCard,
                {
                  backgroundColor: item.isRead
                    ? isWF
                      ? '#FFFFFF'
                      : colors.white
                    : isWF
                    ? '#EEEEEE'
                    : colors.petrolLight,
                  borderRadius: isWF ? Radius.sm : Radius.lg,
                  borderWidth: item.isRead ? 1 : 0,
                  borderColor: isWF
                    ? '#DDDDDD'
                    : colors.divider,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => {
                if (!item.isRead) {
                  markRead(item.id);
                }
              }}
            >
              {!item.isRead && (
                <View
                  style={[
                    styles.unreadDot,
                    {
                      backgroundColor: isWF
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
                    backgroundColor: getIconBg(
                      item.type,
                      item.isRead
                    ),
                    borderRadius: isWF ? 6 : 20,
                  },
                ]}
              >
                <Feather
                  name={
                    NOTIF_ICONS[item.type as NotifType] as any
                  }
                  size={18}
                  color={getIconColor(
                    item.type,
                    item.isRead
                  )}
                />
              </View>

              <View style={{ flex: 1, gap: 3 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Text
                    style={[
                      styles.notifTitle,
                      {
                        color: isWF
                          ? '#1A1A1A'
                          : colors.charcoalInk,
                        fontFamily: font(
                          item.isRead
                            ? 'body'
                            : 'bodyMedium'
                        ),
                        fontSize: FontSizes.sm,
                        flex: 1,
                        marginRight: Spacing.sm,
                      },
                    ]}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={[
                      {
                        color: isWF
                          ? '#999'
                          : colors.inkFaint,
                        fontFamily: font('body'),
                        fontSize: FontSizes.xs,
                      },
                    ]}
                  >
                    {timeAgo(item.createdAt)}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.notifBody,
                    {
                      color: isWF
                        ? '#555'
                        : colors.inkLight,
                      fontFamily: font('body'),
                      fontSize: FontSizes.xs,
                    },
                  ]}
                >
                  {item.body}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather
                name="bell-off"
                size={40}
                color={
                  isWF ? '#CCCCCC' : colors.inkFaint
                }
              />

              <Text
                style={[
                  {
                    color: isWF
                      ? '#888'
                      : colors.inkLight,
                    fontFamily: font('body'),
                    fontSize: FontSizes.base,
                  },
                ]}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },

  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    flex: 1,
  },

  list: {
    padding: Spacing.base,
    paddingBottom: Spacing['4xl'],
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