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
import * as Location from "expo-location";

import DeliveryMap, { Coordinates } from "../../components/DeliveryMap";

import { geocodeAddress, reverseGeocode } from "../../services/geocoding";

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

export default function DeliveryLocationScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();

  const params = route?.params ?? {};

  const [allAddresses, setAllAddresses] = useState<AddressModel[]>([]);

  const [selectedAddr, setSelectedAddr] = useState<AddressModel | null>(null);

  const [mapCoordinates, setMapCoordinates] = useState<Coordinates | null>(
    null,
  );

  const [mapAddress, setMapAddress] = useState<string>("");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [locationLoading, setLocationLoading] = useState(false);

  /*
   * Load saved addresses when the screen opens.
   */
  useEffect(() => {
    loadAddresses();
  }, []);

  /*
   * Keep the map synchronized with the currently
   * selected saved address.
   */
  useEffect(() => {
    if (!selectedAddr) {
      setMapCoordinates(null);
      setMapAddress("");
      return;
    }

    if (selectedAddr.coordinates) {
      setMapCoordinates({
        lat: selectedAddr.coordinates.lat,
        lng: selectedAddr.coordinates.lng,
      });

      setMapAddress(buildAddressText(selectedAddr));
      return;
    }

    /*
     * Older saved addresses may not have coordinates.
     * Try to geocode the address so the map can still
     * display the location.
     */
    const fullAddress = [
      selectedAddr.street,
      selectedAddr.suburb,
      selectedAddr.city,
      selectedAddr.province,
      selectedAddr.postalCode,
      "South Africa",
    ]
      .filter(Boolean)
      .join(", ");

    if (!fullAddress.trim()) {
      return;
    }

    let cancelled = false;

    const resolveAddress = async () => {
      try {
        const result = await geocodeAddress(fullAddress);

        if (!result || cancelled) {
          return;
        }

        const coordinates = {
          lat: result.latitude,
          lng: result.longitude,
        };

        setMapCoordinates(coordinates);
        setMapAddress(result.displayName || buildAddressText(selectedAddr));
      } catch (error) {
        console.warn("DeliveryLocation geocoding warning:", error);
      }
    };

    resolveAddress();

    return () => {
      cancelled = true;
    };
  }, [selectedAddr]);

  /*
   * Creates a readable address for the map card.
   */
  const buildAddressText = (address: AddressModel) => {
    return [
      address.street,
      address.suburb,
      address.city,
      address.province,
      address.postalCode,
    ]
      .filter(Boolean)
      .join(", ");
  };

  /*
   * Load the customer's saved addresses.
   */
  const loadAddresses = async () => {
    try {
      setLoading(true);

      const addresses = await userRepository.getAddresses();

      setAllAddresses(addresses);

      if (addresses.length > 0) {
        const defaultAddress =
          addresses.find((address) => address.isDefault) ?? addresses[0];

        setSelectedAddr(defaultAddress);
      } else {
        setSelectedAddr(null);
        setMapCoordinates(null);
        setMapAddress("");
      }
    } catch (error) {
      console.error("DeliveryLocation: failed to load addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  /*
   * Select one of the customer's saved addresses.
   */
  const handleSelectAddress = (address: AddressModel) => {
    setSelectedAddr(address);

    if (address.coordinates) {
      setMapCoordinates({
        lat: address.coordinates.lat,
        lng: address.coordinates.lng,
      });

      setMapAddress(buildAddressText(address));
    }
  };

  /*
   * Get the user's current GPS position.
   *
   * This intentionally does not overwrite the saved
   * Supabase address. It only changes the map position
   * for the current screen.
   */
  const handleUseCurrentLocation = async () => {
    try {
      setLocationLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.warn("Location permission was not granted.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coordinates = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      console.log("Current GPS location:", coordinates);

      setMapCoordinates(coordinates);

      try {
        const result = await reverseGeocode(coordinates.lat, coordinates.lng);

        if (result) {
          setMapAddress(result.displayName);

          console.log("Current location address:", result.displayName);
        } else {
          setMapAddress(
            `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`,
          );
        }
      } catch (error) {
        console.warn("Current location reverse geocoding failed:", error);

        setMapAddress(
          `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`,
        );
      }
    } catch (error) {
      console.error("Failed to get current location:", error);
    } finally {
      setLocationLoading(false);
    }
  };

  /*
   * Handle a location selected directly from
   * the interactive map.
   *
   * This changes the temporary map position.
   * It does not modify the saved address in Supabase.
   */
  const handleMapLocationSelect = async (coordinates: Coordinates) => {
    setMapCoordinates(coordinates);

    setMapAddress(
      `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`,
    );

    try {
      const result = await reverseGeocode(coordinates.lat, coordinates.lng);

      if (result) {
        setMapAddress(result.displayName);
      }
    } catch (error) {
      console.warn("Map reverse geocoding failed:", error);
    }
  };

  /*
   * Continue to the delivery-time screen.
   */
  const handleContinue = () => {
    if (!selectedAddr) {
      return;
    }

    if (!params.fuelTypeId) {
      console.error("DeliveryLocation: fuelTypeId missing:", params);
    }

    console.log("DeliveryLocation forwarding params:", {
      ...params,
      deliveryAddressId: selectedAddr.id,
      deliveryAddress: selectedAddr,
      mapCoordinates,
    });

    navigation.navigate("DeliveryTime", {
      ...params,
      deliveryAddressId: selectedAddr.id,
      deliveryAddress: selectedAddr,
    });
  };

  /*
   * Open the Add Address screen while preserving
   * the fuel/order parameters.
   */
  const handleAddAddress = () => {
    navigation.navigate("AddAddress", {
      ...params,
    });
  };

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

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isWF ? "#F0F0F0" : colors.warmAsh,
        },
      ]}
    >
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
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

        <View
          style={{
            width: 40,
          }}
        />
      </View>

      <View style={styles.mapContainer}>
        <DeliveryMap
          coordinates={mapCoordinates}
          interactive
          onLocationSelect={handleMapLocationSelect}
        />

        {selectedAddr || mapAddress ? (
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

            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={[
                  styles.mapAddressTitle,
                  {
                    color: isWF ? "#333" : colors.charcoalInk,
                    fontFamily: font("bodyMedium"),
                  },
                ]}
              >
                {selectedAddr?.label ?? "Selected location"}
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
                {mapAddress ||
                  (selectedAddr
                    ? buildAddressText(selectedAddr)
                    : "Location selected")}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

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
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          scrollEnabled
        >
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

          <TouchableOpacity
            style={[
              styles.gpsOption,
              {
                borderColor: isWF ? "#CCC" : colors.divider,
              },
            ]}
            onPress={handleUseCurrentLocation}
            activeOpacity={0.8}
            disabled={locationLoading}
          >
            <View
              style={[
                styles.gpsIcon,
                {
                  backgroundColor: isWF ? "#E0E0E0" : colors.petrolLight,
                },
              ]}
            >
              {locationLoading ? (
                <ActivityIndicator
                  size="small"
                  color={isWF ? "#555" : colors.petrolDeep}
                />
              ) : (
                <Feather
                  name="crosshair"
                  size={18}
                  color={isWF ? "#555" : colors.petrolDeep}
                />
              )}
            </View>

            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={{
                  color: isWF ? "#1A1A1A" : colors.charcoalInk,
                  fontFamily: font("bodyMedium"),
                  fontSize: FontSizes.base,
                }}
              >
                {locationLoading
                  ? "Finding your location..."
                  : "Use current location"}
              </Text>

              <Text
                style={{
                  color: isWF ? "#666" : colors.inkLight,
                  fontFamily: font("body"),
                  fontSize: FontSizes.xs,
                  marginTop: 2,
                }}
              >
                Use your phone's GPS location
              </Text>
            </View>

            <Feather
              name="chevron-right"
              size={18}
              color={isWF ? "#888" : colors.inkLight}
            />
          </TouchableOpacity>

          <View
            style={[
              styles.mapHint,
              {
                backgroundColor: isWF ? "#E8E8E8" : colors.petrolLight,
              },
            ]}
          >
            <Feather
              name="info"
              size={15}
              color={isWF ? "#666" : colors.petrolDeep}
            />

            <Text
              style={[
                styles.mapHintText,
                {
                  color: isWF ? "#555" : colors.petrolDeep,
                  fontFamily: font("body"),
                },
              ]}
            >
              Tap the map or move the pin to choose a location.
            </Text>
          </View>

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

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
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

          <TouchableOpacity
            style={[
              styles.addNewBtn,
              {
                borderColor: isWF ? "#AAAAAA" : colors.petrolDeep,
                borderRadius: isWF ? Radius.sm : Radius.lg,
              },
            ]}
            onPress={handleAddAddress}
            activeOpacity={0.8}
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
    borderWidth: 1,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
  },

  gpsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  mapHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },

  mapHintText: {
    flex: 1,
    fontSize: FontSizes.xs,
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
