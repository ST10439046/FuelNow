import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import {
  useDesignMode,
} from '../context/DesignModeContext';

import {
  FontSizes,
  Radius,
  Spacing,
} from '../theme/tokens';

type Status =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'FINDING_DRIVER'
  | 'ACCEPTED'
  | 'NAVIGATING'
  | 'ARRIVED'
  | 'DISPENSING'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'pending'
  | 'finding_driver'
  | 'driver_assigned'
  | 'en_route'
  | 'arriving'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'scheduled';

interface StatusConfig {
  label: string;
  bgKey: string;
  textKey: string;
}

const STATUS_CONFIG: Record<
  Status,
  StatusConfig
> = {
  PENDING_PAYMENT: {
    label: 'Pending Payment',
    bgKey: 'amberLight',
    textKey: 'amberDark',
  },

  PAID: {
    label: 'Paid',
    bgKey: 'greenLight',
    textKey: 'dieselGreen',
  },

  FINDING_DRIVER: {
    label: 'Finding Driver',
    bgKey: 'amberLight',
    textKey: 'amberDark',
  },

  ACCEPTED: {
    label: 'Driver Assigned',
    bgKey: 'petrolLight',
    textKey: 'petrolMid',
  },

  NAVIGATING: {
    label: 'En Route',
    bgKey: 'petrolLight',
    textKey: 'petrolMid',
  },

  ARRIVED: {
    label: 'Driver Arrived',
    bgKey: 'amberLight',
    textKey: 'amberDark',
  },

  DISPENSING: {
    label: 'Dispensing Fuel',
    bgKey: 'petrolLight',
    textKey: 'petrolMid',
  },

  DELIVERED: {
    label: 'Delivered',
    bgKey: 'greenLight',
    textKey: 'dieselGreen',
  },

  COMPLETED: {
    label: 'Completed',
    bgKey: 'greenLight',
    textKey: 'dieselGreen',
  },

  CANCELLED: {
    label: 'Cancelled',
    bgKey: 'signalRed',
    textKey: 'white',
  },

  pending: {
    label: 'Pending',
    bgKey: 'amberLight',
    textKey: 'amberDark',
  },

  finding_driver: {
    label: 'Finding Driver',
    bgKey: 'amberLight',
    textKey: 'amberDark',
  },

  driver_assigned: {
    label: 'Driver Assigned',
    bgKey: 'petrolLight',
    textKey: 'petrolMid',
  },

  en_route: {
    label: 'En Route',
    bgKey: 'petrolLight',
    textKey: 'petrolMid',
  },

  arriving: {
    label: 'Arriving Soon',
    bgKey: 'amberLight',
    textKey: 'amberDark',
  },

  delivered: {
    label: 'Delivered',
    bgKey: 'greenLight',
    textKey: 'dieselGreen',
  },

  completed: {
    label: 'Completed',
    bgKey: 'greenLight',
    textKey: 'dieselGreen',
  },

  cancelled: {
    label: 'Cancelled',
    bgKey: 'signalRed',
    textKey: 'white',
  },

  scheduled: {
    label: 'Scheduled',
    bgKey: 'petrolLight',
    textKey: 'petrolMid',
  },
};

function normalizeStatus(
  status: string,
): Status {
  const normalized =
    status.trim();

  if (
    normalized in
    STATUS_CONFIG
  ) {
    return normalized as Status;
  }

  return 'pending';
}

interface StatusBadgeProps {
  status:
    | Status
    | string;

  size?: 'sm' | 'md';
}

export default function StatusBadge({
  status,
  size = 'md',
}: StatusBadgeProps) {
  const {
    colors,
    font,
    isWireframe,
  } = useDesignMode();

  const normalizedStatus =
    normalizeStatus(
      status,
    );

  const config =
    STATUS_CONFIG[
      normalizedStatus
    ];

  const bg =
    isWireframe
      ? '#E0E0E0'
      : (colors as any)[
          config.bgKey
        ] ??
        colors.amberLight;

  const tc =
    isWireframe
      ? '#333333'
      : (colors as any)[
          config.textKey
        ] ??
        colors.charcoalInk;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor:
            bg,

          borderRadius:
            isWireframe
              ? Radius.sm
              : Radius.full,

          paddingVertical:
            size === 'sm'
              ? 2
              : Spacing.xs,

          paddingHorizontal:
            size === 'sm'
              ? Spacing.sm
              : Spacing.md,

          borderWidth:
            isWireframe
              ? 1
              : 0,

          borderColor:
            isWireframe
              ? '#AAAAAA'
              : 'transparent',
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: tc,

            fontSize:
              size === 'sm'
                ? FontSizes.xs
                : FontSizes.sm,

            fontFamily:
              font('bodyMedium'),
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf:
      'flex-start',
  },

  text: {
    fontWeight:
      '500',
  },
});