import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../../context/DesignModeContext';
import { FontSizes, Spacing, Radius } from '../../theme/tokens';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';

interface Props {
  navigation: any;
  route?: any;
}

const SA_PROVINCES = [
  { code: 'GP', label: 'Gauteng' },
  { code: 'WC', label: 'Western Cape' },
  { code: 'KZN', label: 'KwaZulu-Natal' },
  { code: 'EC', label: 'Eastern Cape' },
  { code: 'LP', label: 'Limpopo' },
  { code: 'MP', label: 'Mpumalanga' },
  { code: 'NW', label: 'North West' },
  { code: 'FS', label: 'Free State' },
  { code: 'NC', label: 'Northern Cape' },
];

const ADDRESS_LABELS = [
  { id: 'home', icon: 'home', label: 'Home' },
  { id: 'work', icon: 'briefcase', label: 'Work' },
  { id: 'other', icon: 'map-pin', label: 'Other' },
];

export default function AddAddressScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();
  const insets = useSafeAreaInsets();
  // If editing an existing address, pre-fill from route params
  const existing = route?.params?.existing ?? null;
  const onSave = route?.params?.onSave ?? null;

  const [label, setLabel] = useState<string>(existing?.label ?? 'home');
  const [unitNumber, setUnitNumber] = useState(existing?.unitNumber ?? '');
  const [streetNumber, setStreetNumber] = useState(existing?.streetNumber ?? '');
  const [streetName, setStreetName] = useState(existing?.streetName ?? '');
  const [suburb, setSuburb] = useState(existing?.suburb ?? '');
  const [city, setCity] = useState(existing?.city ?? '');
  const [province, setProvince] = useState(existing?.province ?? 'GP');
  const [postalCode, setPostalCode] = useState(existing?.postalCode ?? '');
  const [instructions, setInstructions] = useState(existing?.instructions ?? '');
  const [showProvinces, setShowProvinces] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!streetNumber.trim()) e.streetNumber = 'Street number is required';
    if (!streetName.trim()) e.streetName = 'Street name is required';
    if (!suburb.trim()) e.suburb = 'Suburb is required';
    if (!city.trim()) e.city = 'City is required';
    if (!postalCode.trim()) e.postalCode = 'Postal code is required';
    else if (!/^\d{4}$/.test(postalCode)) e.postalCode = 'Enter a valid 4-digit SA postal code';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const fullStreet = unitNumber
      ? `${unitNumber}/${streetNumber} ${streetName}`
      : `${streetNumber} ${streetName}`;

    const newAddress = {
      id: `addr_${Date.now()}`,
      label: ADDRESS_LABELS.find((l) => l.id === label)?.label ?? 'Other',
      street: fullStreet,
      suburb,
      city,
      province,
      postalCode,
      instructions: instructions.trim() || undefined,
    };

    if (onSave) {
      onSave(newAddress);
    }

    // Navigate back to delivery location with the new address selected
    navigation.navigate('DeliveryLocation', { newAddress });
  };

  const selectedProvince = SA_PROVINCES.find((p) => p.code === province);

  const bg = isWF ? '#F0F0F0' : colors.warmAsh;
  const cardBg = isWF ? '#FFFFFF' : colors.white;
  const borderColor = isWF ? '#CCCCCC' : colors.divider;
  const labelActive = isWF ? '#4A4A4A' : colors.petrolDeep;
  const labelActiveBg = isWF ? '#E0E0E0' : colors.petrolLight;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={isWF ? '#333' : colors.charcoalInk} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('display'), fontSize: FontSizes.md }]}>
          {existing ? 'Edit Address' : 'Add New Address'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
          {/* Address label picker */}
          <Text style={[styles.sectionLabel, { color: isWF ? '#666' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.xs }]}>
            SAVE AS
          </Text>
          <View style={styles.labelRow}>
            {ADDRESS_LABELS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.labelBtn,
                  {
                    backgroundColor: label === opt.id ? labelActiveBg : cardBg,
                    borderColor: label === opt.id ? labelActive : borderColor,
                    borderRadius: isWF ? Radius.sm : Radius.lg,
                    borderWidth: label === opt.id ? 2 : 1,
                  },
                ]}
                onPress={() => setLabel(opt.id)}
                activeOpacity={0.8}
              >
                <Feather
                  name={opt.icon as any}
                  size={18}
                  color={label === opt.id ? labelActive : isWF ? '#888' : colors.inkLight}
                />
                <Text style={[{
                  color: label === opt.id ? labelActive : isWF ? '#555' : colors.charcoalInk,
                  fontFamily: font(label === opt.id ? 'bodyMedium' : 'body'),
                  fontSize: FontSizes.sm,
                }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Unit / complex number */}
          <Text style={[styles.sectionLabel, { color: isWF ? '#666' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.xs, marginTop: Spacing.lg }]}>
            ADDRESS DETAILS
          </Text>
          <Card padded style={{ gap: Spacing.md }}>
            <Input
              label="Flat / Unit / Complex number (optional)"
              placeholder="e.g. Apt 4B, Unit 12, Block C"
              value={unitNumber}
              onChangeText={setUnitNumber}
              icon="layers"
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Street number *"
                  placeholder="e.g. 14"
                  value={streetNumber}
                  onChangeText={setStreetNumber}
                  keyboardType="number-pad"
                  error={errors.streetNumber}
                />
              </View>
              <View style={{ flex: 2, marginLeft: Spacing.sm }}>
                <Input
                  label="Street name *"
                  placeholder="e.g. Kenneth Kaunda Road"
                  value={streetName}
                  onChangeText={setStreetName}
                  error={errors.streetName}
                />
              </View>
            </View>

            <Input
              label="Suburb *"
              placeholder="e.g. Durban North"
              value={suburb}
              onChangeText={setSuburb}
              error={errors.suburb}
              icon="map"
            />

            <View style={styles.row}>
              <View style={{ flex: 1.4 }}>
                <Input
                  label="City *"
                  placeholder="e.g. Pretoria"
                  value={city}
                  onChangeText={setCity}
                  error={errors.city}
                />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <Input
                  label="Postal code *"
                  placeholder="0181"
                  value={postalCode}
                  onChangeText={setPostalCode}
                  keyboardType="number-pad"
                  maxLength={4}
                  error={errors.postalCode}
                />
              </View>
            </View>

            {/* Province selector */}
            <View>
              <Text style={[styles.inputLabel, { color: isWF ? '#333' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.sm }]}>
                Province *
              </Text>
              <TouchableOpacity
                style={[
                  styles.provincePicker,
                  {
                    backgroundColor: isWF ? '#F8F8F8' : colors.warmAsh,
                    borderColor: showProvinces ? (isWF ? '#555' : colors.petrolDeep) : borderColor,
                    borderRadius: isWF ? Radius.sm : Radius.md,
                  },
                ]}
                onPress={() => setShowProvinces(!showProvinces)}
              >
                <Feather name="flag" size={16} color={isWF ? '#888' : colors.inkLight} />
                <Text style={[{ flex: 1, color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('body'), fontSize: FontSizes.base }]}>
                  {selectedProvince ? `${selectedProvince.label} (${selectedProvince.code})` : 'Select province'}
                </Text>
                <Feather name={showProvinces ? 'chevron-up' : 'chevron-down'} size={16} color={isWF ? '#888' : colors.inkLight} />
              </TouchableOpacity>

              {showProvinces && (
                <View style={[styles.provinceDropdown, { backgroundColor: cardBg, borderColor, borderRadius: isWF ? Radius.sm : Radius.md }]}>
                  {SA_PROVINCES.map((p) => (
                    <TouchableOpacity
                      key={p.code}
                      style={[
                        styles.provinceOption,
                        {
                          backgroundColor: province === p.code ? (isWF ? '#E0E0E0' : colors.petrolLight) : 'transparent',
                          borderBottomColor: borderColor,
                        },
                      ]}
                      onPress={() => { setProvince(p.code); setShowProvinces(false); }}
                    >
                      <Text style={[{
                        color: province === p.code ? (isWF ? '#333' : colors.petrolDeep) : (isWF ? '#1A1A1A' : colors.charcoalInk),
                        fontFamily: font(province === p.code ? 'bodyMedium' : 'body'),
                        fontSize: FontSizes.base,
                      }]}>
                        {p.label}
                      </Text>
                      <Text style={[{ color: isWF ? '#888' : colors.inkFaint, fontFamily: font('body'), fontSize: FontSizes.xs }]}>
                        {p.code}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </Card>

          {/* Delivery instructions */}
          <Text style={[styles.sectionLabel, { color: isWF ? '#666' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.xs, marginTop: Spacing.lg }]}>
            DELIVERY INSTRUCTIONS (OPTIONAL)
          </Text>
          <Card padded style={{ gap: Spacing.sm }}>
            {/* Quick instruction tags */}
            <View style={styles.tagRow}>
              {['Ring the bell', 'Call on arrival', 'Leave at gate', 'Meet at door', 'Gate code below'].map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: instructions.includes(tag) ? (isWF ? '#D8D8D8' : colors.petrolLight) : (isWF ? '#F0F0F0' : colors.warmAsh),
                      borderColor: instructions.includes(tag) ? (isWF ? '#555' : colors.petrolDeep) : borderColor,
                      borderRadius: isWF ? Radius.sm : Radius.full,
                    },
                  ]}
                  onPress={() => {
                    setInstructions((prev: string) =>
                      prev.includes(tag) ? prev.replace(tag, '').trim() : `${prev} ${tag}`.trim()
                    );
                  }}
                >
                  <Text style={[{
                    color: instructions.includes(tag) ? (isWF ? '#333' : colors.petrolDeep) : (isWF ? '#555' : colors.inkLight),
                    fontFamily: font('body'),
                    fontSize: FontSizes.xs,
                  }]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Additional instructions"
              placeholder="e.g. Gate code: #1234. Green double-storey. Park in visitors bay."
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={3}
              icon="message-circle"
            />
          </Card>

          <Button
            label={existing ? 'Update Address' : 'Save Address'}
            onPress={handleSave}
            size="lg"
            style={{ marginTop: Spacing.md }}
          />
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    maxHeight: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    paddingTop: Spacing.md,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: {},
  scroll: { padding: Spacing.base, paddingBottom: Spacing.md, gap: Spacing.md },
  footer: {
    padding: Spacing.base,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  sectionLabel: { letterSpacing: 0.5, marginBottom: Spacing.sm },
  labelRow: { flexDirection: 'row', gap: Spacing.sm },
  labelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  inputLabel: { marginBottom: Spacing.xs },
  provincePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
  },
  provinceDropdown: {
    borderWidth: 1,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  provinceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  tag: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1 },
  mapPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    borderRadius: Radius.lg,
    gap: 0,
  },
});
