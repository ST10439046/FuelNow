import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useDesignMode } from '../../context/DesignModeContext';
import { FontSizes, Spacing, Radius } from '../../theme/tokens';
import { orderRepository } from '../../repositories/OrderRepository';

interface Props {
  navigation: any;
  route: any;
}

export default function ProofOfDeliveryScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();
  const order = route.params?.order;

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Camera Permission',
        'Camera access is required to capture proof of delivery.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const submitDelivery = async () => {
    if (!order?.id) {
      Alert.alert('Error', 'Order information is missing.');
      return;
    }

    if (!enteredPin.trim()) {
      Alert.alert('PIN Required', 'Enter the customer delivery PIN.');
      return;
    }

    if (!photoUri) {
      Alert.alert(
        'Proof Required',
        'Please capture a photo before completing the delivery.'
      );
      return;
    }

    try {
      setSubmitting(true);

      await orderRepository.confirmDeliveryWithPin(
        order.id,
        enteredPin.trim(),
        photoUri
      );

      navigation.replace('DeliveryComplete', {
        order,
      });
    } catch (error) {
      console.error('ProofOfDeliveryScreen: failed to confirm delivery', error);

      Alert.alert(
        'Delivery Failed',
        error instanceof Error
          ? error.message
          : 'Unable to confirm the delivery. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          disabled={submitting}
        >
          <Feather
            name="arrow-left"
            size={22}
            color={isWF ? '#222' : colors.charcoalInk}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            {
              color: isWF ? '#1A1A1A' : colors.charcoalInk,
              fontFamily: font('displayBold'),
              fontSize: FontSizes.lg,
            },
          ]}
        >
          Proof of Delivery
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.orderCard,
            {
              backgroundColor: isWF ? '#FFFFFF' : colors.white,
              borderColor: isWF ? '#D0D0D0' : colors.divider,
            },
          ]}
        >
          <Text
            style={[
              styles.orderLabel,
              {
                color: isWF ? '#777' : colors.inkLight,
                fontFamily: font('bodyMedium'),
              },
            ]}
          >
            Order
          </Text>

          <Text
            style={[
              styles.orderId,
              {
                color: isWF ? '#111' : colors.charcoalInk,
                fontFamily: font('displayBold'),
              },
            ]}
          >
            #{order?.id ?? 'Unknown'}
          </Text>

          {order?.customerName && (
            <Text
              style={[
                styles.customerName,
                {
                  color: isWF ? '#555' : colors.inkLight,
                  fontFamily: font('body'),
                },
              ]}
            >
              {order.customerName}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: isWF ? '#1A1A1A' : colors.charcoalInk,
                fontFamily: font('displayBold'),
              },
            ]}
          >
            Delivery PIN
          </Text>

          <Text
            style={[
              styles.sectionDescription,
              {
                color: isWF ? '#666' : colors.inkLight,
                fontFamily: font('body'),
              },
            ]}
          >
            Ask the customer for their delivery PIN and enter it below.
          </Text>

          <View
            style={[
              styles.pinInput,
              {
                backgroundColor: isWF ? '#FFFFFF' : colors.white,
                borderColor: isWF ? '#BBBBBB' : colors.divider,
              },
            ]}
          >
            <Feather
              name="key"
              size={20}
              color={isWF ? '#555' : colors.petrolDeep}
            />

            <View style={styles.pinInputContainer}>
              <Text
                style={[
                  styles.pinLabel,
                  {
                    color: isWF ? '#888' : colors.inkFaint,
                    fontFamily: font('body'),
                  },
                ]}
              >
                Delivery PIN
              </Text>

              <Text
                style={[
                  styles.pinValue,
                  {
                    color: isWF ? '#111' : colors.charcoalInk,
                    fontFamily: font('displayBold'),
                  },
                ]}
              >
                {enteredPin || 'Enter PIN'}
              </Text>
            </View>
          </View>

          <View style={styles.pinButtons}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(
              (digit) => (
                <TouchableOpacity
                  key={digit}
                  style={[
                    styles.pinButton,
                    {
                      backgroundColor: isWF ? '#FFFFFF' : colors.white,
                      borderColor: isWF ? '#CCCCCC' : colors.divider,
                    },
                  ]}
                  onPress={() => {
                    if (enteredPin.length < 6) {
                      setEnteredPin((current) => current + digit);
                    }
                  }}
                  disabled={submitting}
                >
                  <Text
                    style={[
                      styles.pinButtonText,
                      {
                        color: isWF ? '#222' : colors.charcoalInk,
                        fontFamily: font('displayBold'),
                      },
                    ]}
                  >
                    {digit}
                  </Text>
                </TouchableOpacity>
              )
            )}

            <TouchableOpacity
              style={[
                styles.pinButton,
                {
                  backgroundColor: isWF ? '#E8E8E8' : colors.warmAsh,
                  borderColor: isWF ? '#CCCCCC' : colors.divider,
                },
              ]}
              onPress={() =>
                setEnteredPin((current) => current.slice(0, -1))
              }
              disabled={submitting}
            >
              <Feather
                name="delete"
                size={20}
                color={isWF ? '#222' : colors.charcoalInk}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: isWF ? '#1A1A1A' : colors.charcoalInk,
                fontFamily: font('displayBold'),
              },
            ]}
          >
            Delivery Photo
          </Text>

          <Text
            style={[
              styles.sectionDescription,
              {
                color: isWF ? '#666' : colors.inkLight,
                fontFamily: font('body'),
              },
            ]}
          >
            Capture a photo as proof that the fuel was delivered.
          </Text>

          {photoUri ? (
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: photoUri }}
                style={styles.photo}
                resizeMode="cover"
              />

              <TouchableOpacity
                style={[
                  styles.retakeButton,
                  {
                    backgroundColor: isWF ? '#333' : colors.petrolDeep,
                  },
                ]}
                onPress={takePhoto}
                disabled={submitting}
              >
                <Feather name="camera" size={18} color="#FFFFFF" />

                <Text
                  style={[
                    styles.retakeText,
                    {
                      fontFamily: font('bodyMedium'),
                    },
                  ]}
                >
                  Retake Photo
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.cameraButton,
                {
                  backgroundColor: isWF ? '#FFFFFF' : colors.white,
                  borderColor: isWF ? '#AAAAAA' : colors.petrolDeep,
                },
              ]}
              onPress={takePhoto}
              disabled={submitting}
            >
              <Feather
                name="camera"
                size={28}
                color={isWF ? '#333' : colors.petrolDeep}
              />

              <Text
                style={[
                  styles.cameraButtonText,
                  {
                    color: isWF ? '#333' : colors.petrolDeep,
                    fontFamily: font('bodyMedium'),
                  },
                ]}
              >
                Take Delivery Photo
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: isWF ? '#333333' : colors.petrolDeep,
              opacity: submitting ? 0.6 : 1,
            },
          ]}
          onPress={submitDelivery}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Feather name="check-circle" size={20} color="#FFFFFF" />

              <Text
                style={[
                  styles.submitText,
                  {
                    fontFamily: font('bodyMedium'),
                  },
                ]}
              >
                Complete Delivery
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },

  headerSpacer: {
    width: 40,
  },

  content: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },

  orderCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },

  orderLabel: {
    fontSize: FontSizes.xs,
    marginBottom: 4,
  },

  orderId: {
    fontSize: FontSizes.lg,
  },

  customerName: {
    fontSize: FontSizes.sm,
    marginTop: 4,
  },

  section: {
    marginBottom: Spacing.lg,
  },

  sectionTitle: {
    fontSize: FontSizes.base,
    marginBottom: Spacing.xs,
  },

  sectionDescription: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },

  pinInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },

  pinInputContainer: {
    marginLeft: Spacing.md,
  },

  pinLabel: {
    fontSize: FontSizes.xs,
  },

  pinValue: {
    fontSize: FontSizes.base,
    marginTop: 2,
  },

  pinButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },

  pinButton: {
    width: '18%',
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pinButtonText: {
    fontSize: FontSizes.lg,
  },

  photoContainer: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },

  photo: {
    width: '100%',
    height: 200,
    borderRadius: Radius.lg,
  },

  retakeButton: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },

  retakeText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
  },

  cameraButton: {
    height: 140,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },

  cameraButtonText: {
    fontSize: FontSizes.sm,
  },

  submitButton: {
    marginTop: 'auto',
    minHeight: 54,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },

  submitText: {
    color: '#FFFFFF',
    fontSize: FontSizes.base,
  },
});