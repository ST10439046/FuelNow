import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../context/DesignModeContext';
import { FontSizes, Spacing } from '../theme/tokens';

type TabName = 'Home' | 'Orders' | 'Rewards' | 'Profile';

interface TabBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

const TABS: Array<{ name: TabName; icon: string; label: string }> = [
  { name: 'Home', icon: 'home', label: 'Home' },
  { name: 'Orders', icon: 'package', label: 'Orders' },
  { name: 'Rewards', icon: 'award', label: 'Rewards' },
  { name: 'Profile', icon: 'user', label: 'Profile' },
];

export default function TabBar({ activeTab, onTabPress }: TabBarProps) {
  const { colors, font, isWireframe } = useDesignMode();

  const bgColor = isWireframe ? '#FFFFFF' : colors.white;
  const activeColor = isWireframe ? '#333333' : colors.petrolDeep;
  const inactiveColor = isWireframe ? '#999999' : colors.inkFaint;
  const activeDotColor = isWireframe ? '#666666' : colors.ignitionAmber;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          borderTopColor: isWireframe ? '#CCCCCC' : colors.divider,
          borderTopWidth: 1,
        },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = tab.name === activeTab;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => onTabPress(tab.name)}
            activeOpacity={0.7}
          >
            {isActive && (
              <View
                style={[styles.activeDot, { backgroundColor: activeDotColor }]}
              />
            )}
            {isWireframe ? (
              <View
                style={[
                  styles.wireframeIcon,
                  { borderColor: isActive ? '#333333' : '#BBBBBB' },
                ]}
              />
            ) : (
              <Feather
                name={tab.icon as any}
                size={22}
                color={isActive ? activeColor : inactiveColor}
              />
            )}
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? activeColor : inactiveColor,
                  fontFamily: font(isActive ? 'bodyMedium' : 'body'),
                  fontSize: FontSizes.xs,
                  fontWeight: isActive ? '600' : '400',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingBottom: Platform.OS === 'ios' ? 20 : Spacing.sm,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    position: 'relative',
    paddingTop: Spacing.sm,
  },
  activeDot: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    borderRadius: 2,
  },
  wireframeIcon: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderRadius: 4,
  },
  label: {
    marginTop: 2,
  },
});
