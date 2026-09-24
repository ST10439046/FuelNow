import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useDesignMode } from '../../context/DesignModeContext';
import {
  FontSizes,
  Spacing,
  Radius,
} from '../../theme/tokens';

import Card from '../../components/Card';
import Button from '../../components/Button';

import {
  orderRepository,
} from '../../repositories/OrderRepository';
import OrderHistoryScreen from '../history/OrderHistoryScreen';

interface Props {
  navigation: any;
  route?: any;
}

function StarPicker({
  value,
  onChange,
  color,
}: {
  value: number;
  onChange: (value: number) => void;
  color: string;
}) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onChange(star)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Rate ${star} out of 5`}
        >
          <Feather
            name="star"
            size={38}
            color={
              star <= value
                ? color
                : '#D8D8D8'
            }
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function RateReviewScreen({
  navigation,
  route,
}: Props) {
  const {
    colors,
    font,
    isWireframe: isWF,
  } = useDesignMode();

  const orderId =
    route?.params?.orderId ?? null;

  const [driverName, setDriverName] =
    useState('Your driver');

  const [driverRating, setDriverRating] =
    useState(5);

  const [comment, setComment] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [loadingOrder, setLoadingOrder] =
    useState(true);

  const [error, setError] =
    useState('');

  const [done, setDone] =
    useState(false);

  const [alreadyReviewed, setAlreadyReviewed] =
    useState(false);

  const QUICK_COMMENTS = [
    'Super fast delivery!',
    'Driver was professional',
    'Fuel quality excellent',
    'On time',
    'Would order again',
  ];

  useEffect(() => {
    let mounted = true;

    const loadOrder = async () => {
      if (!orderId) {
        if (mounted) {
          setError(
            'No order was supplied for this review.'
          );

          setLoadingOrder(false);
        }

        return;
      }

      try {
        setLoadingOrder(true);
        setError('');

        const order =
          await orderRepository.getOrderById(
            orderId
          );

        if (!mounted) {
          return;
        }

        if (!order) {
          setError(
            'We could not find this order.'
          );

          return;
        }

        if (
          order.status !==
          'COMPLETED'
        ) {
          setError(
            'Only completed orders can be reviewed.'
          );

          return;
        }

        if (!order.driver) {
          setError(
            'This order does not have an assigned driver.'
          );

          return;
        }

        setDriverName(
          order.driver.name ||
            'Your driver'
        );

        if (
          order.rating !== undefined &&
          order.rating !== null
        ) {
          setDriverRating(
            Math.min(
              5,
              Math.max(
                1,
                Number(order.rating)
              )
            )
          );

          setComment(
            order.ratingComment ?? ''
          );

          setAlreadyReviewed(true);
        }
      } catch (e: any) {
        console.error(
          'RateReviewScreen: failed to load order:',
          e
        );

        if (mounted) {
          setError(
            e?.message ??
              'Unable to load the order.'
          );
        }
      } finally {
        if (mounted) {
          setLoadingOrder(false);
        }
      }
    };

    loadOrder();

    return () => {
      mounted = false;
    };
  }, [orderId]);

  const handleSubmit = async () => {
    if (!orderId) {
      setError(
        'No order was supplied for this review.'
      );

      return;
    }

    if (alreadyReviewed) {
      setError(
        'This order has already been reviewed.'
      );

      return;
    }

    if (
      driverRating < 1 ||
      driverRating > 5
    ) {
      setError(
        'Please select a rating from 1 to 5 stars.'
      );

      return;
    }

    setLoading(true);
    setError('');

    try {
      const success =
        await orderRepository.rateOrder(
          orderId,
          driverRating,
          comment.trim()
        );

      if (!success) {
        throw new Error(
          'We could not submit your review. Please try again.'
        );
      }

      setDone(true);

      setTimeout(() => {
        
      }, 1500);
    } catch (e: any) {
      console.error(
        'RateReviewScreen: review submission failed:',
        e
      );

      setError(
        e?.message ??
          'Unable to submit your review. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (!orderId) {
      navigation.goBack();

      return;
    }

    navigation.navigate(
      'OrderHistoryScreen',
      {
        
      }
    );
  };

  if (loadingOrder) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor:
              isWF
                ? '#F0F0F0'
                : colors.warmAsh,
          },
        ]}
      >
        <View style={styles.loadingContainer}>
          <Feather
            name="star"
            size={42}
            color={
              isWF
                ? '#777'
                : colors.ignitionAmber
            }
          />

          <Text
            style={[
              styles.loadingText,
              {
                color:
                  isWF
                    ? '#555'
                    : colors.inkLight,

                fontFamily:
                  font('body'),

                fontSize:
                  FontSizes.base,
              },
            ]}
          >
            Loading your delivery...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (done) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor:
              isWF
                ? '#F0F0F0'
                : colors.warmAsh,
          },
        ]}
      >
        <View style={styles.doneContainer}>
          <View
            style={[
              styles.doneIcon,
              {
                backgroundColor:
                  isWF
                    ? '#D0D0D0'
                    : colors.greenLight,
              },
            ]}
          >
            <Feather
              name="check"
              size={52}
              color={
                isWF
                  ? '#555'
                  : colors.dieselGreen
              }
            />
          </View>

          <Text
            style={[
              styles.doneTitle,
              {
                color:
                  isWF
                    ? '#1A1A1A'
                    : colors.charcoalInk,

                fontFamily:
                  font('displayBold'),

                fontSize:
                  FontSizes['2xl'],
              },
            ]}
          >
            Thanks for the review!
          </Text>

          <Text
            style={[
              styles.doneSub,
              {
                color:
                  isWF
                    ? '#555'
                    : colors.inkLight,

                fontFamily:
                  font('body'),

                fontSize:
                  FontSizes.base,
              },
            ]}
          >
            Your rating has been submitted
            successfully.
          </Text>

          <Text
            style={[
              styles.doneRating,
              {
                color:
                  isWF
                    ? '#555'
                    : colors.ignitionAmber,

                fontFamily:
                  font('bodyMedium'),

                fontSize:
                  FontSizes.lg,
              },
            ]}
          >
            {driverRating} / 5 stars
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            isWF
              ? '#F0F0F0'
              : colors.warmAsh,
        },
      ]}
    >
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() =>
            navigation.goBack()
          }
          style={styles.backButton}
          activeOpacity={0.7}
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
            styles.screenTitle,
            {
              color:
                isWF
                  ? '#1A1A1A'
                  : colors.charcoalInk,

              fontFamily:
                font('display'),

              fontSize:
                FontSizes.md,
            },
          ]}
        >
          Rate & Review
        </Text>

        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipButton}
          activeOpacity={0.7}
        >
          <Text
            style={{
              color:
                isWF
                  ? '#666'
                  : colors.inkLight,

              fontFamily:
                font('body'),

              fontSize:
                FontSizes.sm,
            }}
          >
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.intro}>
          <Text
            style={[
              styles.introTitle,
              {
                color:
                  isWF
                    ? '#1A1A1A'
                    : colors.charcoalInk,

                fontFamily:
                  font('display'),

                fontSize:
                  FontSizes.xl,
              },
            ]}
          >
            How was your delivery?
          </Text>

          <Text
            style={[
              styles.introText,
              {
                color:
                  isWF
                    ? '#666'
                    : colors.inkLight,

                fontFamily:
                  font('body'),

                fontSize:
                  FontSizes.sm,
              },
            ]}
          >
            Rate the driver who delivered
            your fuel.
          </Text>
        </View>

        <Card style={styles.section}>
          <View style={styles.driverRow}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor:
                    isWF
                      ? '#D0D0D0'
                      : colors.petrolDeep,
                },
              ]}
            >
              <Feather
                name="user"
                size={26}
                color={
                  isWF
                    ? '#555'
                    : colors.white
                }
              />
            </View>

            <View style={styles.driverInfo}>
              <Text
                style={[
                  styles.driverName,
                  {
                    color:
                      isWF
                        ? '#1A1A1A'
                        : colors.charcoalInk,

                    fontFamily:
                      font('bodyMedium'),

                    fontSize:
                      FontSizes.base,
                  },
                ]}
              >
                {driverName}
              </Text>

              <Text
                style={{
                  color:
                    isWF
                      ? '#666'
                      : colors.inkLight,

                  fontFamily:
                    font('body'),

                  fontSize:
                    FontSizes.xs,
                }}
              >
                Your FuelNow driver
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.sectionLabel,
              {
                color:
                  isWF
                    ? '#333'
                    : colors.charcoalInk,

                fontFamily:
                  font('bodyMedium'),

                fontSize:
                  FontSizes.sm,
              },
            ]}
          >
            Rate your driver
          </Text>

          <StarPicker
            value={driverRating}
            onChange={(value) => {
              setDriverRating(value);
              setError('');
            }}
            color={
              isWF
                ? '#888'
                : colors.ignitionAmber
            }
          />

          <Text
            style={[
              styles.ratingLabel,
              {
                color:
                  isWF
                    ? '#666'
                    : colors.inkLight,

                fontFamily:
                  font('body'),

                fontSize:
                  FontSizes.xs,
              },
            ]}
          >
            {
              [
                '',
                'Very poor',
                'Poor',
                'Average',
                'Good',
                'Excellent',
              ][driverRating]
            }
          </Text>
        </Card>

        <Card style={styles.section}>
          <Text
            style={[
              styles.sectionLabel,
              {
                color:
                  isWF
                    ? '#333'
                    : colors.charcoalInk,

                fontFamily:
                  font('bodyMedium'),

                fontSize:
                  FontSizes.sm,

                marginBottom:
                  Spacing.md,
              },
            ]}
          >
            Leave a comment
            <Text
              style={{
                color:
                  isWF
                    ? '#888'
                    : colors.inkFaint,
              }}
            >
              {' '}
              (optional)
            </Text>
          </Text>

          <View style={styles.tagsRow}>
            {QUICK_COMMENTS.map(
              (quickComment) => {
                const selected =
                  comment ===
                  quickComment;

                return (
                  <TouchableOpacity
                    key={quickComment}
                    style={[
                      styles.tag,
                      {
                        backgroundColor:
                          selected
                            ? isWF
                              ? '#D0D0D0'
                              : colors.petrolLight
                            : isWF
                              ? '#F0F0F0'
                              : colors.warmAsh,

                        borderColor:
                          selected
                            ? isWF
                              ? '#555'
                              : colors.petrolDeep
                            : isWF
                              ? '#CCCCCC'
                              : colors.divider,

                        borderRadius:
                          isWF
                            ? Radius.sm
                            : Radius.full,
                      },
                    ]}
                    onPress={() => {
                      setComment(
                        (previous) =>
                          previous ===
                          quickComment
                            ? ''
                            : quickComment
                      );

                      setError('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        color:
                          isWF
                            ? '#333'
                            : colors.charcoalInk,

                        fontFamily:
                          font('body'),

                        fontSize:
                          FontSizes.xs,
                      }}
                    >
                      {quickComment}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>

          <TextInput
            style={[
              styles.commentBox,
              {
                backgroundColor:
                  isWF
                    ? '#F8F8F8'
                    : colors.warmAsh,

                color:
                  isWF
                    ? '#1A1A1A'
                    : colors.charcoalInk,

                fontFamily:
                  font('body'),

                fontSize:
                  FontSizes.sm,

                borderColor:
                  isWF
                    ? '#CCCCCC'
                    : colors.divider,

                borderRadius:
                  isWF
                    ? Radius.sm
                    : Radius.md,
              },
            ]}
            placeholder="Tell us about your experience..."
            placeholderTextColor={
              isWF
                ? '#AAAAAA'
                : colors.inkFaint
            }
            value={comment}
            onChangeText={(value) => {
              setComment(value);
              setError('');
            }}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />

          <Text
            style={[
              styles.characterCount,
              {
                color:
                  isWF
                    ? '#999'
                    : colors.inkFaint,

                fontFamily:
                  font('body'),

                fontSize:
                  FontSizes.xs,
              },
            ]}
          >
            {comment.length}/500
          </Text>
        </Card>

        {error ? (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor:
                  isWF
                    ? '#E8E8E8'
                    : '#FDECEC',

                borderColor:
                  isWF
                    ? '#BBBBBB'
                    : colors.signalRed,
              },
            ]}
          >
            <Feather
              name="alert-circle"
              size={18}
              color={
                isWF
                  ? '#555'
                  : colors.signalRed
              }
            />

            <Text
              style={[
                styles.errorText,
                {
                  color:
                    isWF
                      ? '#555'
                      : colors.signalRed,

                  fontFamily:
                    font('body'),

                  fontSize:
                    FontSizes.sm,
                },
              ]}
            >
              {error}
            </Text>
          </View>
        ) : null}

        {alreadyReviewed ? (
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor:
                  isWF
                    ? '#E8E8E8'
                    : colors.petrolLight,

                borderColor:
                  isWF
                    ? '#BBBBBB'
                    : colors.petrolDeep,
              },
            ]}
          >
            <Feather
              name="check-circle"
              size={18}
              color={
                isWF
                  ? '#555'
                  : colors.petrolDeep
              }
            />

            <Text
              style={{
                flex: 1,
                color:
                  isWF
                    ? '#555'
                    : colors.charcoalInk,

                fontFamily:
                  font('body'),

                fontSize:
                  FontSizes.sm,
              }}
            >
              This order has already been
              reviewed.
            </Text>
          </View>
        ) : null}

        {!alreadyReviewed ? (
          <Button
            label="Submit Review"
            onPress={handleSubmit}
            loading={loading}
            size="lg"
          />
        ) : (
          <Button
            label="View Receipt"
            onPress={handleSkip}
            size="lg"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  screenTitle: {
    textAlign: 'center',
  },

  skipButton: {
    width: 40,
    alignItems: 'flex-end',
    paddingVertical: Spacing.sm,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.md,
  },

  intro: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },

  introTitle: {
    textAlign: 'center',
  },

  introText: {
    textAlign: 'center',
  },

  section: {
    gap: Spacing.sm,
  },

  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },

  driverInfo: {
    flex: 1,
  },

  driverName: {
    marginBottom: 3,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionLabel: {
    marginBottom: Spacing.xs,
  },

  starRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },

  ratingLabel: {
    marginTop: Spacing.xs,
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },

  tag: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
  },

  commentBox: {
    padding: Spacing.md,
    borderWidth: 1,
    minHeight: 100,
  },

  characterCount: {
    textAlign: 'right',
    marginTop: -Spacing.xs,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.md,
  },

  errorText: {
    flex: 1,
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.md,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },

  loadingText: {
    textAlign: 'center',
  },

  doneContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing['2xl'],
  },

  doneIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  doneTitle: {
    textAlign: 'center',
  },

  doneSub: {
    textAlign: 'center',
    lineHeight: 24,
  },

  doneRating: {
    textAlign: 'center',
  },
});