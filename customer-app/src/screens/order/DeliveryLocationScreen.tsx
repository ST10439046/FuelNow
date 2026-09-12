import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import DeliveryMap from "../../components/DeliveryMap";
import { geocodeAddress } from "../../services/geocoding";

import {
  userRepository,
  AddressModel,
} from "../../repositories/UserRepository";

import { useDesignMode } from "../../context/DesignModeContext";
import { FontSizes, Spacing, Radius } from "../../theme/tokens";

import Button from "../../components/Button";

interface Props {
  navigation: any;
  route?: any;
}

/*
 * Default map location.
 * Used only if an address doesn't have coordinates yet.
 * Durban North.
 */

export default function DeliveryLocationScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();

  const params = route?.params ?? {};

  const [allAddresses, setAllAddresses] = useState<AddressModel[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<AddressModel | null>(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  /*
   * Load the customer's REAL saved addresses
   * from Supabase through UserRepository.
   */
  useEffect(() => {
    loadAddresses();
  }, []);

  /*
   * If the selected address does not yet have coordinates,
   * geocode it in the background so the map displays the real pin.
   */
  useEffect(() => {
    if (selectedAddr && !selectedAddr.coordinates) {
      const fullAddr = [
        selectedAddr.street,
        selectedAddr.suburb,
        selectedAddr.city,
        selectedAddr.province,
      ]
        .filter(Boolean)
        .join(", ");

      if (fullAddr.trim()) {
        geocodeAddress(fullAddr)
          .then((res) => {
            if (res) {
              setSelectedAddr((prev) =>
                prev && prev.id === selectedAddr.id
                  ? {
                      ...prev,
                      coordinates: {
                        lat: res.latitude,
                        lng: res.longitude,
                      },
                    }
                  : prev,
              );
            }
          })
          .catch((err) => {
            console.warn("DeliveryLocation geocoding warning:", err);
          });
      }
    }
  }, [selectedAddr?.id]);

  const loadAddresses = async () => {
    try {
      setLoading(true);

      const addresses = await userRepository.getAddresses();

      setAllAddresses(addresses);

      if (addresses.length > 0) {
        /*
         * Prefer the customer's default address.
         * Otherwise use the first address.
         */
        const defaultAddress =
          addresses.find((address) => address.isDefault) ?? addresses[0];

        setSelectedAddr(defaultAddress);
      }
    } catch (error) {
      console.error("DeliveryLocation: failed to load addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  /*
   * Called whenever the customer selects
   * a different saved address.
   */
  const handleSelectAddress = (address: AddressModel) => {
    setSelectedAddr(address);
  };

  /*
   * Continue to delivery time while carrying
   * the selected address ID forward.
   */
  const handleContinue = () => {
    if (!selectedAddr) {
      return;
    }

    navigation.navigate("DeliveryTime", {
      ...params,

      /*
       * This is the real address ID from
       * public.addresses.address_id
       */
      deliveryAddressId: selectedAddr.id,

      /*
       * Also pass the address itself in case
       * the next screen needs to display it.
       */
      deliveryAddress: selectedAddr,
    });
  };

  const handleAddAddress = () => {
    navigation.navigate("AddAddress", {
      ...params,
    });
  };

  /*
   * Filter the customer's actual addresses.
   */
  const filteredAddresses = allAddresses.filter((address) => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return true;
    }

    const fullAddress = [
      address.label,
      address.street,
      address.suburb,
      address.city,
      address.province,
      address.postalCode,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return fullAddress.includes(query);
  });

  /*
   * Convert the selected address into a map region.
   */

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isWF ? "#F0F0F0" : colors.warmAsh,
        },
      ]}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Feather
            name="arrow-left"
            size={22}
            color={isWF ? "#333" : colors.charcoalInk}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.screenTitle,
            {
              color: isWF ? "#1A1A1A" : colors.charcoalInk,
              fontFamily: font("display"),
              fontSize: FontSizes.md,
            },
          ]}
        >
          Delivery Location
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {/* =====================================================
          REAL MAP
      ===================================================== */}

      <View style={styles.mapContainer}>
        <DeliveryMap coordinates={selectedAddr?.coordinates ?? null} />

        {selectedAddr && (
          <View
            style={[
              styles.mapAddressCard,
              {
                backgroundColor: isWF ? "#FFFFFF" : colors.white,
              },
            ]}
          >
            <View
              style={[
                styles.mapPinIcon,
                {
                  backgroundColor: isWF ? "#E0E0E0" : colors.petrolLight,
                },
              ]}
            >
              <Feather
                name="map-pin"
                size={18}
                color={isWF ? "#555" : colors.petrolDeep}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.mapAddressTitle,
                  {
                    color: isWF ? "#333" : colors.charcoalInk,
                    fontFamily: font("bodyMedium"),
                  },
                ]}
              >
                {selectedAddr.label}
              </Text>

              <Text
                style={[
                  styles.mapAddressText,
                  {
                    color: isWF ? "#666" : colors.inkLight,
                    fontFamily: font("body"),
                  },
                ]}
                numberOfLines={2}
              >
                {selectedAddr.street}
                {selectedAddr.suburb ? `, ${selectedAddr.suburb}` : ""}
                {selectedAddr.city ? `, ${selectedAddr.city}` : ""}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* =====================================================
          BOTTOM SHEET
      ===================================================== */}

      <View
        style={[
          styles.sheet,
          {
            backgroundColor: isWF ? "#F0F0F0" : colors.warmAsh,
          },
        ]}
      >
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetScrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          scrollEnabled={true}
        >
          {/* =================================================
              SEARCH
          ================================================= */}

          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: isWF ? "#FFFFFF" : colors.white,
                borderColor: isWF ? "#CCC" : colors.divider,
                borderRadius: isWF ? Radius.sm : Radius.full,
              },
            ]}
          >
            <Feather
              name="search"
              size={16}
              color={isWF ? "#888" : colors.inkLight}
            />

            <TextInput
              style={[
                styles.searchInput,
                {
                  color: isWF ? "#1A1A1A" : colors.charcoalInk,
                  fontFamily: font("body"),
                  fontSize: FontSizes.sm,
                },
              ]}
              placeholder="Search your saved addresses..."
              placeholderTextColor={isWF ? "#AAAAAA" : colors.inkFaint}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* =================================================
              CURRENT LOCATION
          ================================================= */}

          <TouchableOpacity
            style={[
              styles.gpsOption,
              {
                borderColor: isWF ? "#CCC" : colors.divider,
              },
            ]}
          >
            <View
              style={[
                styles.gpsIcon,
                {
                  backgroundColor: isWF ? "#E0E0E0" : colors.petrolLight,
                },
              ]}
            >
              <Feather
                name="crosshair"
                size={18}
                color={isWF ? "#555" : colors.petrolDeep}
              />
            </View>

            <View>
              <Text
                style={{
                  color: isWF ? "#1A1A1A" : colors.charcoalInk,
                  fontFamily: font("bodyMedium"),
                  fontSize: FontSizes.base,
                }}
              >
                Use current location
              </Text>

              <Text
                style={{
                  color: isWF ? "#666" : colors.inkLight,
                  fontFamily: font("body"),
                  fontSize: FontSizes.xs,
                }}
              >
                Use your phone's GPS location
              </Text>
            </View>
          </TouchableOpacity>

          {/* =================================================
              SAVED ADDRESSES
          ================================================= */}

          <Text
            style={[
              styles.sectionTitle,
              {
                color: isWF ? "#333" : colors.charcoalInk,
                fontFamily: font("display"),
                fontSize: FontSizes.base,
                marginTop: Spacing.lg,
              },
            ]}
          >
            Saved Addresses
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="small"
                color={isWF ? "#555" : colors.petrolDeep}
              />

              <Text
                style={{
                  marginTop: Spacing.sm,
                  color: isWF ? "#666" : colors.inkLight,
                  fontFamily: font("body"),
                  fontSize: FontSizes.sm,
                }}
              >
                Loading your addresses...
              </Text>
            </View>
          ) : filteredAddresses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather
                name="map-pin"
                size={32}
                color={isWF ? "#888" : colors.inkLight}
              />

              <Text
                style={{
                  marginTop: Spacing.sm,
                  color: isWF ? "#555" : colors.charcoalInk,
                  fontFamily: font("bodyMedium"),
                  fontSize: FontSizes.sm,
                }}
              >
                No saved addresses found
              </Text>
            </View>
          ) : (
            filteredAddresses.map((addr) => {
              const isSelected = addr.id === selectedAddr?.id;

              const labelIcon =
                addr.label === "Home"
                  ? "home"
                  : addr.label === "Work"
                    ? "briefcase"
                    : "map-pin";

              return (
                <TouchableOpacity
                  key={addr.id}
                  style={[
                    styles.addrCard,
                    {
                      backgroundColor: isSelected
                        ? isWF
                          ? "#E0E0E0"
                          : colors.petrolLight
                        : isWF
                          ? "#FFFFFF"
                          : colors.white,

                      borderColor: isSelected
                        ? isWF
                          ? "#555"
                          : colors.petrolDeep
                        : isWF
                          ? "#CCCCCC"
                          : colors.divider,

                      borderRadius: isWF ? Radius.sm : Radius.lg,

                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                  onPress={() => handleSelectAddress(addr)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.addrIcon,
                      {
                        backgroundColor: isSelected
                          ? isWF
                            ? "#C0C0C0"
                            : colors.petrolDeep
                          : isWF
                            ? "#E8E8E8"
                            : colors.petrolLight,
                      },
                    ]}
                  >
                    <Feather
                      name={labelIcon as any}
                      size={16}
                      color={
                        isSelected
                          ? "#FFFFFF"
                          : isWF
                            ? "#555"
                            : colors.petrolDeep
                      }
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: isWF ? "#333" : colors.charcoalInk,
                          fontFamily: font("bodyMedium"),
                          fontSize: FontSizes.sm,
                        }}
                      >
                        {addr.label}
                      </Text>

                      {addr.isDefault && (
                        <Text
                          style={{
                            color: isWF ? "#666" : colors.petrolDeep,
                            fontFamily: font("bodyMedium"),
                            fontSize: FontSizes.xs,
                          }}
                        >
                          Default
                        </Text>
                      )}
                    </View>

                    <Text
                      style={{
                        color: isWF ? "#666" : colors.inkLight,
                        fontFamily: font("body"),
                        fontSize: FontSizes.xs,
                        marginTop: 2,
                      }}
                    >
                      {addr.street}
                      {addr.suburb ? `, ${addr.suburb}` : ""}
                      {addr.city ? `, ${addr.city}` : ""}
                    </Text>
                  </View>

                  {isSelected && (
                    <View
                      style={[
                        styles.checkIcon,
                        {
                          backgroundColor: isWF ? "#888" : colors.petrolDeep,
                        },
                      ]}
                    >
                      <Feather name="check" size={14} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}

          {/* =================================================
              ADD ADDRESS
          ================================================= */}

          <TouchableOpacity
            style={[
              styles.addNewBtn,
              {
                borderColor: isWF ? "#AAAAAA" : colors.petrolDeep,
                borderRadius: isWF ? Radius.sm : Radius.lg,
              },
            ]}
            onPress={handleAddAddress}
          >
            <Feather
              name="plus"
              size={18}
              color={isWF ? "#555" : colors.petrolDeep}
            />

            <Text
              style={{
                color: isWF ? "#444" : colors.petrolDeep,
                fontFamily: font("bodyMedium"),
                fontSize: FontSizes.base,
              }}
            >
              Add new address
            </Text>
          </TouchableOpacity>

          {/* =================================================
              CONTINUE
          ================================================= */}

          <Button
            label="Deliver here"
            onPress={handleContinue}
            size="lg"
            style={{
              marginTop: Spacing.xl,
            }}
            disabled={!selectedAddr}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.base,
    paddingTop: Spacing.md,
  },

  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  screenTitle: {},

  mapContainer: {
    height: 240,
    flexShrink: 0,
    position: "relative",
    overflow: "hidden",
  },

  map: {
    width: "100%",
    height: "100%",
  },

  mapAddressCard: {
    position: "absolute",
    left: Spacing.md,
    right: Spacing.md,
    bottom: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: Radius.lg,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  mapPinIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },

  mapAddressTitle: {
    fontSize: FontSizes.sm,
  },

  mapAddressText: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },

  searchInput: {
    flex: 1,
  },

  gpsOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderBottomWidth: 1,
    marginBottom: Spacing.sm,
  },

  gpsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    marginBottom: Spacing.md,
  },

  addrCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },

  addrIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  addNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginTop: Spacing.sm,
  },

  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },

  sheet: {
    flex: 1,
    minHeight: 0,
    padding: Spacing.base,
    paddingTop: Spacing.md,
  },

  sheetScroll: {
    flex: 1,
    minHeight: 0,
  },

  sheetScrollContent: {
    paddingBottom: Spacing["3xl"],
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },
});
