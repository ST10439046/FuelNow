import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../../context/DesignModeContext';
import { FontSizes, Spacing, Radius } from '../../theme/tokens';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { MOCK_USER } from '../../services/mockApi';

interface Props { navigation: any }

const LANGUAGES = ['English', 'Afrikaans', 'isiZulu'];

export default function ProfileScreen({ navigation }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [language, setLanguage] = useState('English');

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={{ gap: Spacing.sm }}>
      <Text style={[styles.sectionLabel, { color: isWF ? '#888' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.xs }]}>
        {title.toUpperCase()}
      </Text>
      <Card padded={false} style={{ overflow: 'hidden' }}>
        {children}
      </Card>
    </View>
  );

  const Row = ({
    icon, label, value, onPress, danger = false, isSwitch = false, switchVal, onSwitch,
  }: {
    icon: string; label: string; value?: string; onPress?: () => void;
    danger?: boolean; isSwitch?: boolean; switchVal?: boolean; onSwitch?: (v: boolean) => void;
  }) => (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: isWF ? '#EEEEEE' : colors.divider }]}
      onPress={onPress}
      disabled={isSwitch}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? (isWF ? '#D0D0D0' : '#FEE2E2') : (isWF ? '#E0E0E0' : colors.petrolLight) }]}>
        <Feather name={icon as any} size={16} color={danger ? (isWF ? '#555' : colors.signalRed) : (isWF ? '#444' : colors.petrolDeep)} />
      </View>
      <Text style={[styles.rowLabel, { color: danger ? (isWF ? '#555' : colors.signalRed) : (isWF ? '#1A1A1A' : colors.charcoalInk), fontFamily: font('body'), fontSize: FontSizes.base, flex: 1 }]}>
        {label}
      </Text>
      {isSwitch ? (
        <Switch
          value={switchVal}
          onValueChange={onSwitch}
          trackColor={{ true: isWF ? '#888' : '#F97316', false: isWF ? '#CCC' : colors.divider }}
          thumbColor="#FFFFFF"
        />
      ) : value ? (
        <Text style={[{ color: isWF ? '#888' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.sm }]}>{value}</Text>
      ) : (
        <Feather name="chevron-right" size={18} color={isWF ? '#BBBBBB' : colors.inkFaint} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isWF ? '#F0F0F0' : colors.warmAsh }]}>
      <View style={styles.topBar}>
        <Text style={[styles.title, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('displayBold'), fontSize: FontSizes.xl }]}>
          Profile
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: isWF ? '#D0D0D0' : colors.petrolDeep }]}>
              {isWF ? (
                <Feather name="user" size={24} color="#555" />
              ) : (
                <Text style={{ fontSize: 32 }}>👤</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[{ color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('displayBold'), fontSize: FontSizes.lg }]}>
                {MOCK_USER.name}
              </Text>
              <Text style={[{ color: isWF ? '#555' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.sm }]}>
                {MOCK_USER.email}
              </Text>
              <Text style={[{ color: isWF ? '#555' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.sm }]}>
                {MOCK_USER.phone}
              </Text>
            </View>
            <TouchableOpacity style={[styles.editBtn, { backgroundColor: isWF ? '#E0E0E0' : colors.petrolLight }]}>
              <Feather name="edit-2" size={16} color={isWF ? '#444' : colors.petrolDeep} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Personal info */}
        <Section title="Account">
          <Row icon="user" label="Personal Information" onPress={() => {}} />
          <Row icon="shield" label="Change Password" onPress={() => {}} />
          <Row icon="phone" label="Phone Number" value={MOCK_USER.phone} onPress={() => {}} />
        </Section>

        {/* Saved addresses */}
        <Section title="Addresses">
          {MOCK_USER.savedAddresses.map((addr) => (
            <Row
              key={addr.id}
              icon={addr.label === 'Home' ? 'home' : 'briefcase'}
              label={`${addr.label} — ${addr.street}`}
              onPress={() => {}}
            />
          ))}
          <Row icon="plus" label="Add new address" onPress={() => {}} />
        </Section>

        {/* Payment */}
        <Section title="Payment Methods">
          {MOCK_USER.paymentMethods.map((pm) => (
            <Row
              key={pm.id}
              icon={pm.type === 'mobile_money' ? 'smartphone' : 'credit-card'}
              label={pm.label}
              value={pm.isDefault ? 'Default' : undefined}
              onPress={() => {}}
            />
          ))}
          <Row icon="plus" label="Add payment method" onPress={() => navigation.navigate('AddCard')} />
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <Row icon="bell" label="Push notifications" isSwitch switchVal={pushEnabled} onSwitch={setPushEnabled} />
          <Row icon="message-square" label="SMS updates" isSwitch switchVal={smsEnabled} onSwitch={setSmsEnabled} />
        </Section>

        {/* Language */}
        <View style={{ gap: Spacing.sm }}>
          <Text style={[styles.sectionLabel, { color: isWF ? '#888' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.xs }]}>
            LANGUAGE / TAAL / ULIMI
          </Text>
          <Card padded={false}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.langRow, { borderBottomColor: isWF ? '#EEE' : colors.divider }]}
                onPress={() => setLanguage(lang)}
              >
                <Text style={[{ color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('body'), fontSize: FontSizes.base, flex: 1 }]}>
                  {lang}
                </Text>
                {language === lang && (
                  <View style={[styles.checkCircle, { backgroundColor: isWF ? '#888' : colors.petrolDeep }]}>
                    <Feather name="check" size={12} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </Card>
        </View>

        {/* App info */}
        <Section title="App">
          <Row icon="help-circle" label="Help & Support" onPress={() => {}} />
          <Row icon="file-text" label="Terms of Service" onPress={() => {}} />
          <Row icon="lock" label="Privacy Policy" onPress={() => {}} />
          <Row icon="info" label="App version" value="1.0.0 (mockup)" />
        </Section>

        {/* Logout */}
        <Button
          label="Sign Out"
          onPress={() => navigation.replace('Login')}
          variant="danger"
          size="md"
          style={{ marginTop: Spacing.sm }}
          icon={<Feather name="log-out" size={16} color="#FFFFFF" />}
        />

        <Text style={[{ textAlign: 'center', color: isWF ? '#AAAAAA' : colors.inkFaint, fontFamily: font('body'), fontSize: FontSizes.xs, marginTop: Spacing.md }]}>
          FuelNow v1.0.0 · Design mockup only · Not for production use
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { padding: Spacing.base, paddingTop: Spacing.md },
  title: {},
  scroll: { padding: Spacing.base, paddingBottom: Spacing['4xl'], gap: Spacing.lg },
  profileCard: {},
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  editBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { paddingLeft: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderBottomWidth: 1 },
  rowIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  rowLabel: {},
  langRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
