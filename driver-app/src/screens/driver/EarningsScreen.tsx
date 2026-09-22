import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../../context/DesignModeContext';
import FuelGaugeArc from '../../components/FuelGaugeArc';
import {
  driverRepository,
  DriverEarnings,
  DriverEarningsEntry,
} from '../../repositories/DriverRepository';

function formatZAR(amount: number): string {
  return `R ${amount.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);

  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const yesterday = new Date(today);

  yesterday.setDate(
    today.getDate() - 1
  );

  const entryDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const timeStr =
    date.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

  if (
    entryDay.getTime() ===
    today.getTime()
  ) {
    return `Today, ${timeStr}`;
  }

  if (
    entryDay.getTime() ===
    yesterday.getTime()
  ) {
    return `Yesterday, ${timeStr}`;
  }

  return date.toLocaleDateString(
    'en-ZA',
    {
      day: 'numeric',
      month: 'short',
    }
  );
}

interface StatCardProps {
  label: string;
  value: string;
  isWireframe: boolean;
  colors: ReturnType<
    typeof useDesignMode
  >['colors'];
  font: ReturnType<
    typeof useDesignMode
  >['font'];
}

function StatCard({
  label,
  value,
  isWireframe,
  colors,
  font,
}: StatCardProps) {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor:
            colors.cardBg,
          borderColor:
            colors.divider,
          borderWidth:
            isWireframe ? 1.5 : 0,
        },
        !isWireframe && {
          shadowColor: '#111827',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.07,
          shadowRadius: 8,
          elevation: 3,
        },
      ]}
    >
      <Text
        style={[
          styles.statValue,
          {
            color:
              colors.charcoalInk,
            fontFamily:
              font('displayBold'),
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>

      <Text
        style={[
          styles.statLabel,
          {
            color:
              colors.inkLight,
            fontFamily:
              font('body'),
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

interface DeliveryRowProps {
  entry: DriverEarningsEntry;
  isWireframe: boolean;
  colors: ReturnType<
    typeof useDesignMode
  >['colors'];
  font: ReturnType<
    typeof useDesignMode
  >['font'];
}

function DeliveryRow({
  entry,
  isWireframe,
  colors,
  font,
}: DeliveryRowProps) {
  const orangeColor = isWireframe
    ? colors.inkLight
    : '#F97316';

  const iconBg = isWireframe
    ? colors.ashDark
    : '#FFEDD5';

  return (
    <View
      style={[
        styles.deliveryRow,
        {
          backgroundColor:
            colors.cardBg,
        },
      ]}
    >
      <View
        style={[
          styles.deliveryIconCircle,
          {
            backgroundColor:
              iconBg,
          },
        ]}
      >
        <Feather
          name="truck"
          size={18}
          color={orangeColor}
        />
      </View>

      <View
        style={styles.deliveryCenter}
      >
        <Text
          style={[
            styles.deliveryOrderId,
            {
              color:
                colors.charcoalInk,
              fontFamily:
                font('bodyBold'),
            },
          ]}
        >
          #{entry.id}
        </Text>

        <Text
          style={[
            styles.deliveryAddress,
            {
              color:
                colors.inkLight,
              fontFamily:
                font('body'),
            },
          ]}
          numberOfLines={1}
        >
          {entry.address}
        </Text>

        <Text
          style={[
            styles.deliveryDate,
            {
              color:
                colors.inkFaint,
              fontFamily:
                font('body'),
            },
          ]}
        >
          {formatRelativeDate(
            entry.date
          )}{' '}
          · {entry.litres}L{' '}
          {entry.fuelType}
        </Text>
      </View>

      <View
        style={styles.deliveryRight}
      >
        <Text
          style={[
            styles.deliveryAmount,
            {
              color: orangeColor,
              fontFamily:
                font('displayBold'),
            },
          ]}
        >
          {formatZAR(entry.amount)}
        </Text>

        <View
          style={[
            styles.completedBadge,
            {
              backgroundColor:
                isWireframe
                  ? colors.ashDark
                  : '#DCFCE7',
            },
          ]}
        >
          <Text
            style={[
              styles.completedBadgeText,
              {
                color: isWireframe
                  ? colors.inkLight
                  : '#16A34A',
                fontFamily:
                  font('bodyMedium'),
              },
            ]}
          >
            completed
          </Text>
        </View>
      </View>
    </View>
  );
}

interface Props {
  navigation: any;
}

export default function EarningsScreen({
  navigation,
}: Props) {
  const {
    colors,
    font,
    isWireframe,
  } = useDesignMode();

  const [
    earnings,
    setEarnings,
  ] =
    useState<DriverEarnings | null>(
      null
    );

  const [
    driverName,
    setDriverName,
  ] = useState('Driver');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  useEffect(() => {
    let mounted = true;

    const loadEarnings =
      async () => {
        try {
          setLoading(true);
          setError(null);

          const [
            earningsData,
            driver,
          ] = await Promise.all([
            driverRepository.getEarnings(),
            driverRepository.getActiveDriver(),
          ]);

          if (!mounted) {
            return;
          }

          setEarnings(
            earningsData
          );

          setDriverName(
            driver.name ||
              'Driver'
          );
        } catch (error) {
          console.error(
            'EarningsScreen: failed to load earnings',
            error
          );

          if (mounted) {
            setError(
              error instanceof Error
                ? error.message
                : 'Unable to load earnings.'
            );
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    loadEarnings();

    return () => {
      mounted = false;
    };
  }, []);

  const orangeColor =
    isWireframe
      ? colors.charcoalInk
      : '#F97316';

  const todayEarnings =
    earnings?.todayEarnings ?? 0;

  const weekEarnings =
    earnings?.weekEarnings ?? 0;

  const monthEarnings =
    earnings?.monthEarnings ?? 0;

  const dailyTarget =
    earnings?.dailyTarget ?? 1500;

  const totalDeliveries =
    earnings?.totalDeliveries ?? 0;

  const gaugeValue = Math.min(
    todayEarnings,
    dailyTarget
  );

  const initials =
    driverName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part.charAt(0).toUpperCase()
      )
      .join('') || 'D';

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor:
            colors.warmAsh,
        },
      ]}
      edges={[
        'top',
        'left',
        'right',
      ]}
    >
      <View
        style={[
          styles.root,
          {
            backgroundColor:
              colors.warmAsh,
          },
        ]}
      >
        <View
          style={[
            styles.header,
            {
              borderBottomColor:
                colors.divider,
            },
          ]}
        >
          <View>
            <Text
              style={[
                styles.headerTitle,
                {
                  color:
                    colors.charcoalInk,
                  fontFamily:
                    font(
                      'displayBold'
                    ),
                },
              ]}
            >
              Earnings
            </Text>

            <Text
              style={[
                styles.headerSub,
                {
                  color:
                    colors.inkLight,
                  fontFamily:
                    font('body'),
                },
              ]}
            >
              {driverName}
            </Text>
          </View>

          <View
            style={[
              styles.avatarCircle,
              {
                backgroundColor:
                  isWireframe
                    ? colors.ashDark
                    : '#FFEDD5',
                borderWidth:
                  isWireframe
                    ? 1.5
                    : 0,
                borderColor:
                  colors.divider,
              },
            ]}
          >
            <Text
              style={[
                styles.avatarInitials,
                {
                  color:
                    orangeColor,
                  fontFamily:
                    font(
                      'displayBold'
                    ),
                },
              ]}
            >
              {initials}
            </Text>
          </View>
        </View>

        {loading ? (
          <View
            style={
              styles.loadingContainer
            }
          >
            <ActivityIndicator
              size="large"
              color={
                isWireframe
                  ? colors.inkLight
                  : '#F97316'
              }
            />

            <Text
              style={[
                styles.loadingText,
                {
                  color:
                    colors.inkLight,
                  fontFamily:
                    font('body'),
                },
              ]}
            >
              Loading earnings...
            </Text>
          </View>
        ) : error ? (
          <View
            style={
              styles.errorContainer
            }
          >
            <View
              style={[
                styles.errorIcon,
                {
                  backgroundColor:
                    isWireframe
                      ? colors.ashDark
                      : '#FEE2E2',
                },
              ]}
            >
              <Feather
                name="alert-circle"
                size={32}
                color={
                  isWireframe
                    ? colors.inkLight
                    : '#DC2626'
                }
              />
            </View>

            <Text
              style={[
                styles.errorTitle,
                {
                  color:
                    colors.charcoalInk,
                  fontFamily:
                    font(
                      'displayBold'
                    ),
                },
              ]}
            >
              Unable to load earnings
            </Text>

            <Text
              style={[
                styles.errorMessage,
                {
                  color:
                    colors.inkLight,
                  fontFamily:
                    font('body'),
                },
              ]}
            >
              {error}
            </Text>

            <TouchableOpacity
              style={[
                styles.retryButton,
                {
                  backgroundColor:
                    isWireframe
                      ? colors.charcoalInk
                      : colors.petrolDeep,
                },
              ]}
              onPress={() => {
                setError(null);
                setLoading(true);

                Promise.all([
                  driverRepository.getEarnings(),
                  driverRepository.getActiveDriver(),
                ])
                  .then(
                    ([
                      earningsData,
                      driver,
                    ]) => {
                      setEarnings(
                        earningsData
                      );

                      setDriverName(
                        driver.name ||
                          'Driver'
                      );
                    }
                  )
                  .catch(
                    (retryError) => {
                      console.error(
                        'EarningsScreen: retry failed',
                        retryError
                      );

                      setError(
                        retryError instanceof
                          Error
                          ? retryError.message
                          : 'Unable to load earnings.'
                      );
                    }
                  )
                  .finally(() => {
                    setLoading(false);
                  });
              }}
            >
              <Feather
                name="refresh-cw"
                size={17}
                color="#FFFFFF"
              />

              <Text
                style={[
                  styles.retryText,
                  {
                    fontFamily:
                      font(
                        'bodyMedium'
                      ),
                  },
                ]}
              >
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={
              styles.scrollContent
            }
            showsVerticalScrollIndicator={
              false
            }
          >
            <View
              style={[
                styles.gaugeCard,
                {
                  backgroundColor:
                    colors.cardBg,
                  borderColor:
                    colors.divider,
                  borderWidth:
                    isWireframe
                      ? 1.5
                      : 0,
                },
                !isWireframe && {
                  shadowColor:
                    '#111827',
                  shadowOffset: {
                    width: 0,
                    height: 4,
                  },
                  shadowOpacity:
                    0.09,
                  shadowRadius: 16,
                  elevation: 5,
                },
              ]}
            >
              <Text
                style={[
                  styles.gaugeCardTitle,
                  {
                    color:
                      colors.inkLight,
                    fontFamily:
                      font(
                        'bodyMedium'
                      ),
                  },
                ]}
              >
                Today's Earnings
              </Text>

              <View
                style={
                  styles.gaugeCenter
                }
              >
                <FuelGaugeArc
                  value={gaugeValue}
                  max={dailyTarget}
                  label="Today"
                  size={220}
                  color={
                    isWireframe
                      ? undefined
                      : '#F97316'
                  }
                />
              </View>

              <Text
                style={[
                  styles.gaugeAmount,
                  {
                    color:
                      orangeColor,
                    fontFamily:
                      font(
                        'displayBold'
                      ),
                  },
                ]}
              >
                {formatZAR(
                  todayEarnings
                )}
              </Text>

              <Text
                style={[
                  styles.gaugeTarget,
                  {
                    color:
                      colors.inkLight,
                    fontFamily:
                      font('body'),
                  },
                ]}
              >
                of{' '}
                {formatZAR(
                  dailyTarget
                )}{' '}
                daily target
              </Text>
            </View>

            <View
              style={
                styles.statsRow
              }
            >
              <StatCard
                label="This Week"
                value={formatZAR(
                  weekEarnings
                )}
                isWireframe={
                  isWireframe
                }
                colors={colors}
                font={font}
              />

              <StatCard
                label="This Month"
                value={formatZAR(
                  monthEarnings
                )}
                isWireframe={
                  isWireframe
                }
                colors={colors}
                font={font}
              />

              <StatCard
                label="Completed Trips"
                value={String(
                  totalDeliveries
                )}
                isWireframe={
                  isWireframe
                }
                colors={colors}
                font={font}
              />
            </View>

            <View
              style={
                styles.sectionHeader
              }
            >
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color:
                      colors.charcoalInk,
                    fontFamily:
                      font(
                        'displayBold'
                      ),
                  },
                ]}
              >
                Delivery History
              </Text>

              <Text
                style={[
                  styles.seeAll,
                  {
                    color:
                      orangeColor,
                    fontFamily:
                      font(
                        'bodyMedium'
                      ),
                  },
                ]}
              >
                {totalDeliveries}{' '}
                completed
              </Text>
            </View>

            <View
              style={[
                styles.historyCard,
                {
                  backgroundColor:
                    colors.cardBg,
                  borderColor:
                    colors.divider,
                  borderWidth:
                    isWireframe
                      ? 1.5
                      : 0,
                },
                !isWireframe && {
                  shadowColor:
                    '#111827',
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity:
                    0.07,
                  shadowRadius: 10,
                  elevation: 3,
                },
              ]}
            >
              {(
                earnings?.deliveryHistory ??
                []
              ).length === 0 ? (
                <View
                  style={
                    styles.emptyHistory
                  }
                >
                  <Feather
                    name="truck"
                    size={32}
                    color={
                      isWireframe
                        ? colors.inkFaint
                        : colors.inkLight
                    }
                  />

                  <Text
                    style={[
                      styles.emptyTitle,
                      {
                        color:
                          colors.charcoalInk,
                        fontFamily:
                          font(
                            'bodyMedium'
                          ),
                      },
                    ]}
                  >
                    No completed deliveries yet
                  </Text>

                  <Text
                    style={[
                      styles.emptyText,
                      {
                        color:
                          colors.inkLight,
                        fontFamily:
                          font('body'),
                      },
                    ]}
                  >
                    Completed deliveries will appear here.
                  </Text>
                </View>
              ) : (
                (
                  earnings?.deliveryHistory ??
                  []
                )
                  .slice(0, 20)
                  .map(
                    (
                      entry,
                      index,
                      array
                    ) => (
                      <View
                        key={
                          entry.id
                        }
                        style={
                          index <
                          array.length -
                            1
                            ? {
                                borderBottomWidth:
                                  StyleSheet.hairlineWidth,
                                borderBottomColor:
                                  colors.divider,
                              }
                            : undefined
                        }
                      >
                        <DeliveryRow
                          entry={
                            entry
                          }
                          isWireframe={
                            isWireframe
                          }
                          colors={
                            colors
                          }
                          font={
                            font
                          }
                        />
                      </View>
                    )
                  )
              )}
            </View>

            <View
              style={{
                height: 32,
              }}
            />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  root: {
    flex: 1,
    height:
      Platform.OS === 'web'
        ? ('100vh' as any)
        : '100%',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
  },

  headerSub: {
    fontSize: 13,
    marginTop: 1,
  },

  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  avatarInitials: {
    fontSize: 15,
    fontWeight: '700',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 12,
  },

  loadingText: {
    fontSize: 14,
  },

  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent:
      'center',
    paddingHorizontal: 32,
  },

  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent:
      'center',
    marginBottom: 16,
  },

  errorTitle: {
    fontSize: 19,
    textAlign: 'center',
    marginBottom: 8,
  },

  errorMessage: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 20,
  },

  retryButton: {
    minHeight: 46,
    paddingHorizontal: 22,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 8,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  gaugeCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },

  gaugeCardTitle: {
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform:
      'uppercase',
    marginBottom: 4,
  },

  gaugeCenter: {
    alignItems: 'center',
  },

  gaugeAmount: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: -0.5,
  },

  gaugeTarget: {
    fontSize: 13,
    marginTop: 4,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },

  statCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },

  statValue: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },

  statLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },

  seeAll: {
    fontSize: 13,
    fontWeight: '500',
  },

  historyCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  emptyHistory: {
    alignItems: 'center',
    justifyContent:
      'center',
    paddingVertical: 42,
    paddingHorizontal: 24,
  },

  emptyTitle: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },

  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },

  deliveryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent:
      'center',
    flexShrink: 0,
  },

  deliveryCenter: {
    flex: 1,
    gap: 2,
  },

  deliveryOrderId: {
    fontSize: 13,
    fontWeight: '700',
  },

  deliveryAddress: {
    fontSize: 12,
  },

  deliveryDate: {
    fontSize: 11,
    marginTop: 1,
  },

  deliveryRight: {
    alignItems: 'flex-end',
    gap: 5,
    flexShrink: 0,
  },

  deliveryAmount: {
    fontSize: 13,
    fontWeight: '700',
  },

  completedBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },

  completedBadgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
});