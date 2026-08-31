import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDesignMode } from '../context/DesignModeContext';
import { FontSizes, Radius, Spacing } from '../theme/tokens';

type Status =
  | 'pending'
  | 'finding_driver'
  | 'driver_assigned'
  | 'en_route'
  | 'arriving'
  | 'delivered'
  | 'cancelled'
  | 'scheduled';

const STATUS_CONFIG: Record<
  Status,
  { label: string; bgKey: string; textKey: string }
> = {
  pending: { label: 'Pending', bgKey: 'amberLight', textKey: 'amberDark' },
  finding_driver: { label: 'Finding Driver', bgKey: 'amberLight', textKey: 'amberDark' },
  driver_assigned: { label: 'Driver Assigned', bgKey: 'petrolLight', textKey: 'petrolMid' },
  en_route: { label: 'En Route', bgKey: 'petrolLight', textKey: 'petrolMid' },
  arriving: { label: 'Arriving Soon', bgKey: 'amberLight', textKey: 'amberDark' },
  delivered: { label: 'Delivered', bgKey: 'greenLight', textKey: 'dieselGreen' },
  cancelled: { label: 'Cancelled', bgKey: 'signalRed', textKey: 'white' },
  scheduled: { label: 'Scheduled', bgKey: 'petrolLight', textKey: 'petrolMid' },
};

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { colors, font, isWireframe } = useDesignMode();
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  const bg = isWireframe ? '#E0E0E0' : (colors as any)[config.bgKey] ?? colors.amberLight;
  const tc = isWireframe ? '#333333' : (colors as any)[config.textKey] ?? colors.charcoalInk;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderRadius: isWireframe ? Radius.sm : Radius.full,
          paddingVertical: size === 'sm' ? 2 : Spacing.xs,
          paddingHorizontal: size === 'sm' ? Spacing.sm : Spacing.md,
          borderWidth: isWireframe ? 1 : 0,
          borderColor: isWireframe ? '#AAAAAA' : 'transparent',
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: tc,
            fontSize: size === 'sm' ? FontSizes.xs : FontSizes.sm,
            fontFamily: font('bodyMedium'),
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
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '500',
  },
});
