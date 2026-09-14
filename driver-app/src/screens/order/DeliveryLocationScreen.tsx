import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../../context/DesignModeContext';
import { FontSizes, Spacing, Radius } from '../../theme/tokens';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { userRepository, AddressModel as Address } from '../../repositories/UserRepository';

interface Props { navigation: any; route?: any }

const NEW_ADDRESSES: Address[] = [
  {
    id: 'addr_003',
    label: 'Other',
    street: '22 Buitenkant Street',
    suburb: 'Gardens',
    city: 'Cape Town',
    province: 'Western Cape',
    postalCode: '8001',
    coordinates: { lat: -33.9258, lng: 18.4232 },
  },
];

const ALL_ADDRESSES = [...MOCK_USER.savedAddresses, ...NEW_ADDRESSES];

// Mock map for location screen
function LocationMap({ isWireframe, selectedAddr }: { isWireframe: boolean; selectedAddr: Address }) {
  if (isWireframe) {
    return (
      <View style={[styles.map, { backgroundColor: '#D8D8D8' }]}>
        <Text style={{ color: '#888', fontSize: FontSizes.sm, textAlign: 'center', marginTop: 60 }}>[ Map — Delivery Pin ]</Text>
      </View>
    );
  }
  return (
    <View style={[styles.map, { backgroundColor: '#F5F5F0' }]}>
      {/* City blocks */}
      <View style={[{ position: 'absolute', top: 15, left: 20, width: 90, height: 40, backgroundColor: '#E8E8E0', borderRadius: 4 }]} />
      <View style={[{ position: 'absolute', top: 15, right: 30, width: 100, height: 40, backgroundColor: '#E8E8E0', borderRadius: 4 }]} />
      <View style={[{ position: 'absolute', top: 120, left: 30, width: 110, height: 50, backgroundColor: '#E8E8E0', borderRadius: 4 }]} />

      {/* Park green zone */}
      <View style={[{ position: 'absolute', top: 120, right: 20, width: 80, height: 40, backgroundColor: '#E0EAE2', borderRadius: 8 }]} />

      {/* Grid Roads */}
      <View style={[{ position: 'absolute', top: 75, left: 0, right: 0, height: 8, backgroundColor: '#FFFFFF' }]} />
      <View style={[{ position: 'absolute', left: '42%', top: 0, bottom: 0, width: 8, backgroundColor: '#FFFFFF' }]} />

      {/* Water body */}
      <View style={[{ position: 'absolute', bottom: -15, right: -15, width: 80, height: 50, borderRadius: 40, backgroundColor: '#BACDD8' }]} />

      {/* Street labels */}
      <Text style={{ position: 'absolute', top: 64, left: 10, fontSize: 8, color: '#A0A090', fontWeight: 'bold' }}>
        KENNETH KAUNDA RD
      </Text>

      {/* Pin */}
      <View style={[{ position: 'absolute', top: '35%', left: '38%' }]}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 }}>
            <Feather name="map-pin" size={18} color="#FFFFFF" />
          </View>
          <View style={{ width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#F97316' }} />
        </View>
      </View>
    </View>
  );
}

export default function DeliveryLocationScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();
  const params = route?.params ?? {};
  // Accept a newly-added address returned from AddAddressScreen
  const extraAddr: Address | undefined = route?.params?.newAddress;
  const [allAddresses, setAllAddresses] = useState<Address[]>(() => {
    if (extraAddr && !ALL_ADDRESSES.find((a) => a.id === extraAddr.id)) {
      return [...ALL_ADDRESSES, extraAddr];
    }
    return ALL_ADDRESSES;
  });
  const [selectedAddr, setSelectedAddr] = useState<Address>(
    extraAddr ?? MOCK_USER.savedAddresses[0]
  );
  const [search, setSearch] = useState('');

  const handleContinue = () => {
    navigation.navigate('DeliveryTime', { ...params, deliveryAddressId: selectedAddr.id });
  };

  const handleAddAddress = () => {
    navigation.navigate('AddAddress', {
      ...params,
      onSave: (addr: Address) => {
        setAllAddresses((prev) => [...prev, addr]);
        setSelectedAddr(addr);
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isWF ? '#F0F0F0' : colors.warmAsh }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={isWF ? '#333' : colors.charcoalInk} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('display'), fontSize: FontSizes.md }]}>
          Delivery Location
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <LocationMap isWireframe={isWF} selectedAddr={selectedAddr} />

      <View style={[styles.sheet, { backgroundColor: isWF ? '#F0F0F0' : colors.warmAsh }]}>
        <ScrollView contentContainerStyle={{ paddingBottom: Spacing['3xl'] }} showsVerticalScrollIndicator={false}>
          {/* Search */}
          <View style={[styles.searchBar, { backgroundColor: isWF ? '#FFFFFF' : colors.white, borderColor: isWF ? '#CCC' : colors.divider, borderRadius: isWF ? Radius.sm : Radius.full }]}>
            <Feather name="search" size={16} color={isWF ? '#888' : colors.inkLight} />
            <TextInput
              style={[styles.searchInput, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('body'), fontSize: FontSizes.sm }]}
              placeholder="Search for an address..."
              placeholderTextColor={isWF ? '#AAAAAA' : colors.inkFaint}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* GPS option */}
          <TouchableOpacity style={[styles.gpsOption, { borderColor: isWF ? '#CCC' : colors.divider }]}>
            <View style={[styles.gpsIcon, { backgroundColor: isWF ? '#E0E0E0' : colors.petrolLight }]}>
              <Feather name="crosshair" size={18} color={isWF ? '#555' : colors.petrolDeep} />
            </View>
            <View>
              <Text style={[{ color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.base }]}>
                Use current location
              </Text>
              <Text style={[{ color: isWF ? '#666' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.xs }]}>
                Durban North, Durban — detected
              </Text>
            </View>
          </TouchableOpacity>

          {/* Saved addresses */}
          <Text style={[styles.sectionTitle, { color: isWF ? '#333' : colors.charcoalInk, fontFamily: font('display'), fontSize: FontSizes.base, marginTop: Spacing.lg }]}>
            Saved Addresses
          </Text>

          {allAddresses.map((addr) => {
            const isSelected = addr.id === selectedAddr.id;
            const labelIcon = addr.label === 'Home' ? 'home' : addr.label === 'Work' ? 'briefcase' : 'map-pin';
            return (
              <TouchableOpacity
                key={addr.id}
                style={[
                  styles.addrCard,
                  {
                    backgroundColor: isSelected ? (isWF ? '#E0E0E0' : colors.petrolLight) : (isWF ? '#FFFFFF' : colors.white),
                    borderColor: isSelected ? (isWF ? '#555' : colors.petrolDeep) : (isWF ? '#CCCCCC' : colors.divider),
                    borderRadius: isWF ? Radius.sm : Radius.lg,
                    borderWidth: isSelected ? 1.5 : 1,
                  },
                ]}
                onPress={() => setSelectedAddr(addr)}
                activeOpacity={0.8}
              >
                <View style={[styles.addrIcon, { backgroundColor: isSelected ? (isWF ? '#C0C0C0' : colors.petrolDeep) : (isWF ? '#E8E8E8' : colors.petrolLight) }]}>
                  <Feather name={labelIcon as any} size={16} color={isSelected ? '#FFFFFF' : (isWF ? '#555' : colors.petrolDeep)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[{ color: isWF ? '#333' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.sm }]}>
                    {addr.label}
                  </Text>
                  <Text style={[{ color: isWF ? '#666' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.xs }]}>
                    {addr.street}, {addr.suburb}, {addr.city}
                  </Text>
                </View>
                {isSelected && (
                  <View style={[styles.checkIcon, { backgroundColor: isWF ? '#888' : colors.petrolDeep }]}>
                    <Feather name="check" size={14} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Add new */}
          <TouchableOpacity
            style={[styles.addNewBtn, { borderColor: isWF ? '#AAAAAA' : colors.petrolDeep, borderRadius: isWF ? Radius.sm : Radius.lg }]}
            onPress={handleAddAddress}
          >
            <Feather name="plus" size={18} color={isWF ? '#555' : colors.petrolDeep} />
            <Text style={[{ color: isWF ? '#444' : colors.petrolDeep, fontFamily: font('bodyMedium'), fontSize: FontSizes.base }]}>
              Add new address
            </Text>
          </TouchableOpacity>

          <Button label="Deliver here" onPress={handleContinue} size="lg" style={{ marginTop: Spacing.xl }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, paddingTop: Spacing.md },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  screenTitle: {},
  map: { height: 200, position: 'relative', overflow: 'hidden' },
  sheet: { flex: 1, padding: Spacing.base, paddingTop: Spacing.md },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderWidth: 1, marginBottom: Spacing.md },
  searchInput: { flex: 1 },
  gpsOption: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderBottomWidth: 1, marginBottom: Spacing.sm },
  gpsIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { marginBottom: Spacing.md },
  addrCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, marginBottom: Spacing.sm },
  addrIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  checkIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addNewBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderWidth: 1.5, borderStyle: 'dashed', marginTop: Spacing.sm },
});
