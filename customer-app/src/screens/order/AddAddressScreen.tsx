import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";
import { Feather } from "@expo/vector-icons";

import { userRepository } from "../../repositories/UserRepository";
import { useDesignMode } from "../../context/DesignModeContext";
import { FontSizes, Spacing, Radius } from "../../theme/tokens";

import Input from "../../components/Input";
import Button from "../../components/Button";
import Card from "../../components/Card";
import DeliveryMap, { Coordinates } from "../../components/DeliveryMap";

import { geocodeAddress, reverseGeocode } from "../../services/geocoding";

interface Props {
  navigation: any;
  route?: any;
}

const SA_PROVINCES = [
  { code: "GP", label: "Gauteng" },
  { code: "WC", label: "Western Cape" },
  { code: "KZN", label: "KwaZulu-Natal" },
  { code: "EC", label: "Eastern Cape" },
  { code: "LP", label: "Limpopo" },
  { code: "MP", label: "Mpumalanga" },
  { code: "NW", label: "North West" },
  { code: "FS", label: "Free State" },
  { code: "NC", label: "Northern Cape" },
];

type AddressLabel = "Home" | "Work" | "Other" | "Site A" | "Depot";

type AddressLabelId = "home" | "work" | "other";

const ADDRESS_LABELS: {
  id: AddressLabelId;
  icon: string;
  label: AddressLabel;
}[] = [
  {
    id: "home",
    icon: "home",
    label: "Home",
  },
  {
    id: "work",
    icon: "briefcase",
    label: "Work",
  },
  {
    id: "other",
    icon: "map-pin",
    label: "Other",
  },
];

function provinceCodeFromName(value?: string): string {
  if (!value) {
    return "GP";
  }

  const normalised = value.trim().toLowerCase();

  const province = SA_PROVINCES.find(
    (item) =>
      item.code.toLowerCase() === normalised ||
      item.label.toLowerCase() === normalised,
  );

  return province?.code ?? value;
}

function provinceNameFromCode(value?: string): string {
  if (!value) {
    return "";
  }

  const province = SA_PROVINCES.find(
    (item) =>
      item.code.toLowerCase() === value.toLowerCase() ||
      item.label.toLowerCase() === value.toLowerCase(),
  );

  return province?.label ?? value;
}

export default function AddAddressScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();

  const existing = route?.params?.existing ?? null;
  const onSave = route?.params?.onSave ?? null;

  const getLabelId = (value?: string): AddressLabelId => {
    switch (value?.toLowerCase()) {
      case "work":
        return "work";

      case "other":
        return "other";

      case "home":
      default:
        return "home";
    }
  };

  const [label, setLabel] = useState<AddressLabelId>(
    getLabelId(existing?.label),
  );

  const [unitNumber, setUnitNumber] = useState(existing?.unitNumber ?? "");

  const [streetNumber, setStreetNumber] = useState(
    existing?.streetNumber ?? "",
  );

  const [streetName, setStreetName] = useState(existing?.streetName ?? "");

  const [suburb, setSuburb] = useState(existing?.suburb ?? "");

  const [city, setCity] = useState(existing?.city ?? "");

  const [province, setProvince] = useState(
    provinceCodeFromName(existing?.province),
  );

  const [postalCode, setPostalCode] = useState(existing?.postalCode ?? "");

  const [instructions, setInstructions] = useState(
    existing?.instructions ?? existing?.deliveryInstructions ?? "",
  );

  const [showProvinces, setShowProvinces] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);

  const [locationSearch, setLocationSearch] = useState("");

  const [mapCoordinates, setMapCoordinates] = useState<Coordinates | null>(
    existing?.coordinates ?? null,
  );

  const [locationLoading, setLocationLoading] = useState(false);

  const [locationMessage, setLocationMessage] = useState("");

  const [locationError, setLocationError] = useState("");

  const selectedProvince = SA_PROVINCES.find((p) => p.code === province);

  useEffect(() => {
    if (!existing?.coordinates) {
      return;
    }

    setMapCoordinates(existing.coordinates);
  }, [existing?.id]);

  const buildFullAddress = () => {
    return [
      unitNumber.trim(),
      streetNumber.trim(),
      streetName.trim(),
      suburb.trim(),
      city.trim(),
      provinceNameFromCode(province),
      postalCode.trim(),
      "South Africa",
    ]
      .filter(Boolean)
      .join(", ");
  };

  const validate = () => {
    const e: Record<string, string> = {};

    if (!streetNumber.trim()) {
      e.streetNumber = "Street number is required";
    }

    if (!streetName.trim()) {
      e.streetName = "Street name is required";
    }

    if (!suburb.trim()) {
      e.suburb = "Suburb is required";
    }

    if (!city.trim()) {
      e.city = "City is required";
    }

    if (!postalCode.trim()) {
      e.postalCode = "Postal code is required";
    } else if (!/^\d{4}$/.test(postalCode.trim())) {
      e.postalCode = "Enter a valid 4-digit SA postal code";
    }

    if (!mapCoordinates) {
      e.location =
        "Please select a location on the map or use an address search.";
    }

    setErrors(e);

    return Object.keys(e).length === 0;
  };

  const handleFindAddress = async () => {
    const query = locationSearch.trim();

    if (!query) {
      setLocationError("Enter an address, suburb, city or place to search.");
      return;
    }

    try {
      setLocationLoading(true);
      setLocationError("");
      setLocationMessage("");

      const result = await geocodeAddress(query);

      if (!result) {
        setLocationError(
          "We could not find that location. Try adding the suburb, city or postal code.",
        );
        return;
      }

      const coordinates: Coordinates = {
        lat: result.latitude,
        lng: result.longitude,
      };

      setMapCoordinates(coordinates);

      setLocationMessage("Location found. Check the map and address details.");

      await populateAddressFromCoordinates(coordinates);
    } catch (error) {
      console.error("AddAddressScreen: address search failed:", error);

      setLocationError("Unable to search for that location right now.");
    } finally {
      setLocationLoading(false);
    }
  };

  const populateAddressFromCoordinates = async (coordinates: Coordinates) => {
    try {
      const result = await reverseGeocode(coordinates.lat, coordinates.lng);

      if (!result) {
        return;
      }

      if (result.streetNumber) {
        setStreetNumber(result.streetNumber);
      }

      if (result.streetName) {
        setStreetName(result.streetName);
      }

      if (result.suburb) {
        setSuburb(result.suburb);
      }

      if (result.city) {
        setCity(result.city);
      }

      if (result.postalCode) {
        setPostalCode(result.postalCode);
      }

      if (result.province) {
        setProvince(provinceCodeFromName(result.province));
      }

      if (result.displayName) {
        setLocationSearch(result.displayName);
      }

      setLocationMessage("Address details updated from the map location.");
    } catch (error) {
      console.warn("AddAddressScreen: reverse geocoding warning:", error);
    }
  };

  const handleMapLocationSelect = async (coordinates: Coordinates) => {
    try {
      setLocationLoading(true);
      setLocationError("");

      setMapCoordinates(coordinates);

      await populateAddressFromCoordinates(coordinates);
    } catch (error) {
      console.error("AddAddressScreen: map location selection failed:", error);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError("");
      setLocationMessage("");

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocationError(
          "Location permission was not granted. Please enable location access or search for your address.",
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coordinates: Coordinates = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      console.log("AddAddressScreen: current GPS location:", coordinates);

      setMapCoordinates(coordinates);

      await populateAddressFromCoordinates(coordinates);
    } catch (error) {
      console.error("AddAddressScreen: current location failed:", error);

      setLocationError(
        "Unable to get your current location. Please search for your address instead.",
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    try {
      setSaving(true);
      setErrors({});

      const selectedLabel: AddressLabel =
        ADDRESS_LABELS.find((item) => item.id === label)?.label ?? "Other";

      const coordinates = mapCoordinates;

      if (!coordinates) {
        throw new Error(
          "A map location is required before saving the address.",
        );
      }

      const street = [unitNumber.trim(), streetNumber.trim(), streetName.trim()]
        .filter(Boolean)
        .join(" ");

      if (existing?.id) {
        const response = await userRepository.updateAddress({
          addressId: existing.id,

          label: selectedLabel,

          unitNumber: unitNumber.trim() || undefined,

          streetNumber: streetNumber.trim(),

          streetName: streetName.trim(),

          suburb: suburb.trim(),

          city: city.trim(),

          province: province.trim(),

          postalCode: postalCode.trim(),

          deliveryInstructions: instructions.trim() || undefined,

          isDefault: false,

          coordinates,
        });

        if (!response) {
          throw new Error("Unable to update the address.");
        }
      } else {
        const newAddress = await userRepository.addAddress({
          label: selectedLabel,

          unitNumber: unitNumber.trim() || undefined,

          streetNumber: streetNumber.trim(),

          streetName: streetName.trim(),

          suburb: suburb.trim(),

          city: city.trim(),

          province: province.trim(),

          postalCode: postalCode.trim(),

          instructions: instructions.trim() || undefined,

          isDefault: false,

          coordinates,

          street,
        });

        if (!newAddress) {
          throw new Error("Unable to save the address.");
        }

        onSave?.(newAddress);
      }

      navigation.goBack();
    } catch (error: any) {
      console.error("AddAddressScreen: save failed:", error);

      setErrors({
        form: error?.message ?? "Failed to save the address.",
      });
    } finally {
      setSaving(false);
    }
  };

  const bg = isWF ? "#F0F0F0" : colors.warmAsh;

  const cardBg = isWF ? "#FFFFFF" : colors.white;

  const borderColor = isWF ? "#CCCCCC" : colors.divider;

  const labelActive = isWF ? "#4A4A4A" : colors.petrolDeep;

  const labelActiveBg = isWF ? "#E0E0E0" : colors.petrolLight;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bg,
        },
      ]}
    >
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
            styles.title,
            {
              color: isWF ? "#1A1A1A" : colors.charcoalInk,

              fontFamily: font("display"),

              fontSize: FontSizes.md,
            },
          ]}
        >
          {existing ? "Edit Address" : "Add New Address"}
        </Text>

        <View
          style={{
            width: 40,
          }}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={[
            styles.sectionLabel,
            {
              color: isWF ? "#666" : colors.inkLight,

              fontFamily: font("body"),

              fontSize: FontSizes.xs,
            },
          ]}
        >
          SAVE AS
        </Text>

        <View style={styles.labelRow}>
          {ADDRESS_LABELS.map((option) => {
            const selected = label === option.id;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.labelBtn,
                  {
                    backgroundColor: selected ? labelActiveBg : cardBg,

                    borderColor: selected ? labelActive : borderColor,

                    borderRadius: isWF ? Radius.sm : Radius.lg,

                    borderWidth: selected ? 2 : 1,
                  },
                ]}
                onPress={() => setLabel(option.id)}
                activeOpacity={0.8}
              >
                <Feather
                  name={option.icon as any}
                  size={18}
                  color={
                    selected ? labelActive : isWF ? "#888" : colors.inkLight
                  }
                />

                <Text
                  style={{
                    color: selected
                      ? labelActive
                      : isWF
                        ? "#555"
                        : colors.charcoalInk,

                    fontFamily: font(selected ? "bodyMedium" : "body"),

                    fontSize: FontSizes.sm,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text
          style={[
            styles.sectionLabel,
            {
              color: isWF ? "#666" : colors.inkLight,

              fontFamily: font("body"),

              fontSize: FontSizes.xs,

              marginTop: Spacing.lg,
            },
          ]}
        >
          CHOOSE DELIVERY LOCATION
        </Text>

        <Card
          padded
          style={{
            gap: Spacing.md,
          }}
        >
          <View
            style={[
              styles.locationSearchBox,
              {
                backgroundColor: isWF ? "#F8F8F8" : colors.warmAsh,

                borderColor: locationError ? colors.signalRed : borderColor,

                borderRadius: isWF ? Radius.sm : Radius.md,
              },
            ]}
          >
            <Feather
              name="search"
              size={18}
              color={isWF ? "#777" : colors.inkLight}
            />

            <Input
              label=""
              placeholder="Enter an address, suburb or place"
              value={locationSearch}
              onChangeText={(value) => {
                setLocationSearch(value);
                setLocationError("");
              }}
              containerStyle={styles.locationInput}
            />

            <TouchableOpacity
              style={[
                styles.searchButton,
                {
                  backgroundColor: isWF ? "#555" : colors.petrolDeep,
                },
              ]}
              onPress={handleFindAddress}
              disabled={locationLoading}
              activeOpacity={0.8}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="arrow-right" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {locationError ? (
            <Text
              style={{
                color: isWF ? "#555" : colors.signalRed,

                fontFamily: font("body"),

                fontSize: FontSizes.xs,
              }}
            >
              {locationError}
            </Text>
          ) : null}

          {locationMessage ? (
            <View style={styles.locationMessage}>
              <Feather
                name="check-circle"
                size={15}
                color={isWF ? "#555" : colors.petrolDeep}
              />

              <Text
                style={{
                  flex: 1,

                  color: isWF ? "#555" : colors.petrolDeep,

                  fontFamily: font("body"),

                  fontSize: FontSizes.xs,
                }}
              >
                {locationMessage}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.currentLocationButton,
              {
                backgroundColor: isWF ? "#E8E8E8" : colors.petrolLight,

                borderColor: isWF ? "#BBBBBB" : colors.petrolDeep,

                borderRadius: isWF ? Radius.sm : Radius.md,
              },
            ]}
            onPress={handleUseCurrentLocation}
            disabled={locationLoading}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.currentLocationIcon,
                {
                  backgroundColor: isWF ? "#D0D0D0" : colors.white,
                },
              ]}
            >
              <Feather
                name="crosshair"
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
                style={{
                  color: isWF ? "#333" : colors.charcoalInk,

                  fontFamily: font("bodyMedium"),

                  fontSize: FontSizes.sm,
                }}
              >
                Use my current location
              </Text>

              <Text
                style={{
                  color: isWF ? "#666" : colors.inkLight,

                  fontFamily: font("body"),

                  fontSize: FontSizes.xs,

                  marginTop: 2,
                }}
              >
                Use your phone's GPS
              </Text>
            </View>

            <Feather
              name="chevron-right"
              size={18}
              color={isWF ? "#777" : colors.inkLight}
            />
          </TouchableOpacity>

          <View
            style={[
              styles.mapWrapper,
              {
                borderColor,
                borderRadius: isWF ? Radius.sm : Radius.lg,
              },
            ]}
          >
            <DeliveryMap
              coordinates={mapCoordinates}
              interactive
              onLocationSelect={handleMapLocationSelect}
            />

            <View
              style={[
                styles.mapHint,
                {
                  backgroundColor: isWF
                    ? "rgba(255,255,255,0.92)"
                    : "rgba(255,255,255,0.94)",
                },
              ]}
            >
              <Feather
                name="map-pin"
                size={15}
                color={isWF ? "#555" : colors.petrolDeep}
              />

              <Text
                style={{
                  color: isWF ? "#444" : colors.charcoalInk,

                  fontFamily: font("bodyMedium"),

                  fontSize: FontSizes.xs,
                }}
              >
                Tap the map to choose your delivery point
              </Text>
            </View>
          </View>

          {mapCoordinates ? (
            <View
              style={[
                styles.coordinateBadge,
                {
                  backgroundColor: isWF ? "#E8E8E8" : colors.petrolLight,
                },
              ]}
            >
              <Feather
                name="navigation"
                size={14}
                color={isWF ? "#555" : colors.petrolDeep}
              />

              <Text
                style={{
                  color: isWF ? "#555" : colors.petrolDeep,

                  fontFamily: font("body"),

                  fontSize: FontSizes.xs,
                }}
              >
                Location selected
              </Text>
            </View>
          ) : null}
        </Card>

        <Text
          style={[
            styles.sectionLabel,
            {
              color: isWF ? "#666" : colors.inkLight,

              fontFamily: font("body"),

              fontSize: FontSizes.xs,

              marginTop: Spacing.lg,
            },
          ]}
        >
          ADDRESS DETAILS
        </Text>

        <Card
          padded
          style={{
            gap: Spacing.md,
          }}
        >
          <Input
            label="Flat / Unit / Complex number (optional)"
            placeholder="e.g. Apt 4B, Unit 12, Block C"
            value={unitNumber}
            onChangeText={setUnitNumber}
            icon="layers"
          />

          <View style={styles.row}>
            <View
              style={{
                flex: 1,
              }}
            >
              <Input
                label="Street number *"
                placeholder="e.g. 14"
                value={streetNumber}
                onChangeText={setStreetNumber}
                keyboardType="number-pad"
                error={errors.streetNumber}
              />
            </View>

            <View
              style={{
                flex: 2,
                marginLeft: Spacing.sm,
              }}
            >
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
            <View
              style={{
                flex: 1.4,
              }}
            >
              <Input
                label="City *"
                placeholder="e.g. Durban"
                value={city}
                onChangeText={setCity}
                error={errors.city}
              />
            </View>

            <View
              style={{
                flex: 1,
                marginLeft: Spacing.sm,
              }}
            >
              <Input
                label="Postal code *"
                placeholder="4051"
                value={postalCode}
                onChangeText={setPostalCode}
                keyboardType="number-pad"
                maxLength={4}
                error={errors.postalCode}
              />
            </View>
          </View>

          <View>
            <Text
              style={[
                styles.inputLabel,
                {
                  color: isWF ? "#333" : colors.charcoalInk,

                  fontFamily: font("bodyMedium"),

                  fontSize: FontSizes.sm,
                },
              ]}
            >
              Province *
            </Text>

            <TouchableOpacity
              style={[
                styles.provincePicker,
                {
                  backgroundColor: isWF ? "#F8F8F8" : colors.warmAsh,

                  borderColor: showProvinces
                    ? isWF
                      ? "#555"
                      : colors.petrolDeep
                    : borderColor,

                  borderRadius: isWF ? Radius.sm : Radius.md,
                },
              ]}
              onPress={() => setShowProvinces(!showProvinces)}
            >
              <Feather
                name="flag"
                size={16}
                color={isWF ? "#888" : colors.inkLight}
              />

              <Text
                style={{
                  flex: 1,

                  color: isWF ? "#1A1A1A" : colors.charcoalInk,

                  fontFamily: font("body"),

                  fontSize: FontSizes.base,
                }}
              >
                {selectedProvince
                  ? `${selectedProvince.label} (${selectedProvince.code})`
                  : "Select province"}
              </Text>

              <Feather
                name={showProvinces ? "chevron-up" : "chevron-down"}
                size={16}
                color={isWF ? "#888" : colors.inkLight}
              />
            </TouchableOpacity>

            {showProvinces && (
              <View
                style={[
                  styles.provinceDropdown,
                  {
                    backgroundColor: cardBg,

                    borderColor,

                    borderRadius: isWF ? Radius.sm : Radius.md,
                  },
                ]}
              >
                {SA_PROVINCES.map((item) => {
                  const selected = province === item.code;

                  return (
                    <TouchableOpacity
                      key={item.code}
                      style={[
                        styles.provinceOption,
                        {
                          backgroundColor: selected
                            ? isWF
                              ? "#E0E0E0"
                              : colors.petrolLight
                            : "transparent",

                          borderBottomColor: borderColor,
                        },
                      ]}
                      onPress={() => {
                        setProvince(item.code);

                        setShowProvinces(false);
                      }}
                    >
                      <Text
                        style={{
                          color: selected
                            ? isWF
                              ? "#333"
                              : colors.petrolDeep
                            : isWF
                              ? "#1A1A1A"
                              : colors.charcoalInk,

                          fontFamily: font(selected ? "bodyMedium" : "body"),

                          fontSize: FontSizes.base,
                        }}
                      >
                        {item.label}
                      </Text>

                      <Text
                        style={{
                          color: isWF ? "#888" : colors.inkFaint,

                          fontFamily: font("body"),

                          fontSize: FontSizes.xs,
                        }}
                      >
                        {item.code}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {errors.location ? (
            <Text
              style={{
                color: isWF ? "#555" : colors.signalRed,

                fontFamily: font("body"),

                fontSize: FontSizes.xs,
              }}
            >
              {errors.location}
            </Text>
          ) : null}
        </Card>

        <Text
          style={[
            styles.sectionLabel,
            {
              color: isWF ? "#666" : colors.inkLight,

              fontFamily: font("body"),

              fontSize: FontSizes.xs,

              marginTop: Spacing.lg,
            },
          ]}
        >
          DELIVERY INSTRUCTIONS (OPTIONAL)
        </Text>

        <Card
          padded
          style={{
            gap: Spacing.sm,
          }}
        >
          <View style={styles.tagRow}>
            {[
              "Ring the bell",
              "Call on arrival",
              "Leave at gate",
              "Meet at door",
              "Gate code below",
            ].map((tag) => {
              const active = instructions.includes(tag);

              return (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: active
                        ? isWF
                          ? "#D8D8D8"
                          : colors.petrolLight
                        : isWF
                          ? "#F0F0F0"
                          : colors.warmAsh,

                      borderColor: active
                        ? isWF
                          ? "#555"
                          : colors.petrolDeep
                        : borderColor,

                      borderRadius: isWF ? Radius.sm : Radius.full,
                    },
                  ]}
                  onPress={() => {
                    setInstructions((previous: string) =>
                      previous.includes(tag)
                        ? previous.replace(tag, "").replace(/\s+/g, " ").trim()
                        : `${previous} ${tag}`.trim(),
                    );
                  }}
                >
                  <Text
                    style={{
                      color: active
                        ? isWF
                          ? "#333"
                          : colors.petrolDeep
                        : isWF
                          ? "#555"
                          : colors.inkLight,

                      fontFamily: font("body"),

                      fontSize: FontSizes.xs,
                    }}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
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

        {errors.form ? (
          <Text
            style={{
              color: isWF ? "#555" : colors.signalRed,

              fontFamily: font("body"),

              fontSize: FontSizes.sm,

              textAlign: "center",
            }}
          >
            {errors.form}
          </Text>
        ) : null}

        <Button
          label={
            saving
              ? existing
                ? "Updating Address..."
                : "Saving Address..."
              : existing
                ? "Update Address"
                : "Save Address"
          }
          onPress={handleSave}
          loading={saving}
          size="lg"
          style={{
            marginTop: Spacing.md,
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    height: Platform.OS === "web" ? ("100vh" as any) : "100%",

    maxHeight: Platform.OS === "web" ? ("100vh" as any) : "100%",

    overflow: "hidden",
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

  title: {},

  scrollView: {
    flex: 1,
    minHeight: 0,
  },

  scroll: {
    padding: Spacing.base,

    paddingBottom: Spacing["3xl"],

    gap: Spacing.md,
  },

  sectionLabel: {
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },

  labelRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },

  labelBtn: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: Spacing.xs,

    paddingVertical: Spacing.md,

    paddingHorizontal: Spacing.sm,
  },

  locationSearchBox: {
    flexDirection: "row",
    alignItems: "center",

    minHeight: 54,

    paddingLeft: Spacing.md,

    paddingRight: Spacing.xs,

    borderWidth: 1,

    gap: Spacing.xs,
  },

  locationInput: {
    flex: 1,
    marginBottom: 0,
  },

  searchButton: {
    width: 42,
    height: 42,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: Radius.md,
  },

  locationMessage: {
    flexDirection: "row",
    alignItems: "center",

    gap: Spacing.xs,
  },

  currentLocationButton: {
    flexDirection: "row",
    alignItems: "center",

    gap: Spacing.md,

    padding: Spacing.md,

    borderWidth: 1,
  },

  currentLocationIcon: {
    width: 40,
    height: 40,

    borderRadius: 20,

    alignItems: "center",
    justifyContent: "center",
  },

  mapWrapper: {
    height: 280,

    position: "relative",

    overflow: "hidden",

    borderWidth: 1,
  },

  mapHint: {
    position: "absolute",

    left: Spacing.sm,

    right: Spacing.sm,

    top: Spacing.sm,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: Spacing.xs,

    paddingVertical: Spacing.sm,

    paddingHorizontal: Spacing.md,

    borderRadius: Radius.full,
  },

  coordinateBadge: {
    flexDirection: "row",
    alignItems: "center",

    alignSelf: "flex-start",

    gap: Spacing.xs,

    paddingVertical: 6,

    paddingHorizontal: Spacing.sm,

    borderRadius: Radius.full,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  inputLabel: {
    marginBottom: Spacing.xs,
  },

  provincePicker: {
    flexDirection: "row",
    alignItems: "center",

    gap: Spacing.sm,

    paddingHorizontal: Spacing.md,

    paddingVertical: Spacing.md,

    borderWidth: 1,
  },

  provinceDropdown: {
    borderWidth: 1,

    marginTop: Spacing.xs,

    overflow: "hidden",
  },

  provinceOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    paddingHorizontal: Spacing.md,

    paddingVertical: Spacing.sm,

    borderBottomWidth: 1,
  },

  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",

    gap: Spacing.xs,
  },

  tag: {
    paddingVertical: 6,
    paddingHorizontal: 12,

    borderWidth: 1,
  },
});
