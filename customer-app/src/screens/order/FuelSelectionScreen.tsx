import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useDesignMode } from "../../context/DesignModeContext";
import { FontSizes, Spacing, Radius } from "../../theme/tokens";
import Card from "../../components/Card";
import Button from "../../components/Button";
import {
  fuelRateRepository,
  FuelRateModel,
} from "../../repositories/FuelRateRepository";

const FUEL_TYPES: FuelRateModel["type"][] = [
  "Petrol 93",
  "Petrol 95",
  "Diesel 50ppm",
  "Diesel 500ppm",
];

interface Props {
  navigation: any;
  route?: any;
}

export default function FuelSelectionScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();

  const [rates, setRates] = useState<FuelRateModel[]>([]);
  const [selectedType, setSelectedType] =
    useState<FuelRateModel["type"]>("Petrol 95");

  const [inputMode, setInputMode] = useState<"rand" | "litres">("litres");
  const [inputValue, setInputValue] = useState("40");

  useEffect(() => {
    loadFuelRates();
  }, []);

  const loadFuelRates = async () => {
    try {
      const result = await fuelRateRepository.getRates();

      console.log("Fuel rates loaded:", result);

      setRates(result);
    } catch (error) {
      console.error("Failed to load fuel rates:", error);
    }
  };

  const currentRate = rates.find((rate) => rate.type === selectedType);

  const pricePerLitre = currentRate?.pricePerLitre ?? 0;

  const litres =
    inputMode === "litres"
      ? parseFloat(inputValue) || 0
      : pricePerLitre > 0
        ? (parseFloat(inputValue) || 0) / pricePerLitre
        : 0;

  const randTotal =
    inputMode === "rand" ? parseFloat(inputValue) || 0 : litres * pricePerLitre;

  const deliveryFee = 49.0;
  const grandTotal = randTotal + deliveryFee;

  const handleContinue = () => {
    if (!currentRate) {
      Alert.alert(
        "Fuel rate unavailable",
        "The selected fuel type is not currently available. Please try again.",
      );
      return;
    }

    /*
     * This is the important part.
     *
     * Your FuelRateRepository must expose the database
     * fuel_type_id as currentRate.id.
     */
    const fuelTypeId = currentRate.id;

    if (!fuelTypeId) {
      console.error(
        "FuelSelection: selected fuel has no database ID.",
        currentRate,
      );

      Alert.alert(
        "Fuel type unavailable",
        "The selected fuel type could not be identified. Please try again.",
      );

      return;
    }

    console.log("Selected fuel:", selectedType);
    console.log("Selected fuel type ID:", fuelTypeId);
    console.log("Selected price:", pricePerLitre);
    console.log("Litres:", litres);
    console.log("Fuel subtotal:", randTotal);
    console.log("Grand total:", grandTotal);

    navigation.navigate("DeliveryLocation", {
      ...route?.params,

      /*
       * REAL UUID from public.fuel_types.fuel_type_id
       */
      fuelTypeId,

      /*
       * Display information
       */
      fuelType: selectedType,
      litres: +litres.toFixed(2),
      pricePerLitre,
      subtotal: +randTotal.toFixed(2),
    });
  };

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
          Select Fuel
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.label,
            {
              color: isWF ? "#333" : colors.charcoalInk,
              fontFamily: font("bodyMedium"),
              fontSize: FontSizes.sm,
            },
          ]}
        >
          Fuel type
        </Text>

        <View style={styles.typeGrid}>
          {FUEL_TYPES.map((type) => {
            const rate = rates.find((r) => r.type === type);

            const isSelected = type === selectedType;

            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeCard,
                  {
                    backgroundColor: isSelected
                      ? isWF
                        ? "#D0D0D0"
                        : colors.petrolDeep
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
                  },
                ]}
                onPress={() => setSelectedType(type)}
                activeOpacity={0.8}
              >
                {isWF ? (
                  <Feather
                    name="droplet"
                    size={18}
                    color={isSelected ? "#111" : colors.inkLight}
                    style={{ marginBottom: 4 }}
                  />
                ) : (
                  <Text
                    style={{
                      fontSize: 20,
                      marginBottom: 4,
                    }}
                  >
                    {type.startsWith("Diesel") ? "🛢️" : "⛽"}
                  </Text>
                )}

                <Text
                  style={[
                    styles.typeName,
                    {
                      color: isSelected
                        ? isWF
                          ? "#111"
                          : "#FFFFFF"
                        : isWF
                          ? "#333"
                          : colors.charcoalInk,

                      fontFamily: font("bodyMedium"),
                      fontSize: FontSizes.xs,
                    },
                  ]}
                >
                  {type}
                </Text>

                {rate && (
                  <Text
                    style={[
                      styles.typePrice,
                      {
                        color: isSelected
                          ? isWF
                            ? "#333"
                            : colors.ignitionAmber
                          : isWF
                            ? "#666"
                            : colors.inkLight,

                        fontFamily: isWF ? undefined : "Inter_500Medium",

                        fontSize: FontSizes.xs,
                      },
                    ]}
                  >
                    R{rate.pricePerLitre.toFixed(2)}/L
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View
          style={[
            styles.toggleContainer,
            {
              backgroundColor: isWF ? "#E0E0E0" : colors.petrolLight,

              borderRadius: isWF ? Radius.sm : Radius.full,
            },
          ]}
        >
          {(["litres", "rand"] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.toggleBtn,
                {
                  backgroundColor:
                    inputMode === mode
                      ? isWF
                        ? "#B0B0B0"
                        : colors.petrolDeep
                      : "transparent",

                  borderRadius: isWF ? Radius.sm : Radius.full,
                },
              ]}
              onPress={() => setInputMode(mode)}
            >
              <Text
                style={[
                  styles.toggleText,
                  {
                    color:
                      inputMode === mode
                        ? "#FFFFFF"
                        : isWF
                          ? "#555"
                          : colors.inkLight,

                    fontFamily:
                      inputMode === mode ? font("bodyMedium") : font("body"),

                    fontSize: FontSizes.sm,
                  },
                ]}
              >
                {mode === "litres" ? "Enter Litres" : "Enter Rand"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Card style={styles.inputCard}>
          <Text
            style={[
              styles.label,
              {
                color: isWF ? "#333" : colors.charcoalInk,

                fontFamily: font("bodyMedium"),
                fontSize: FontSizes.sm,
              },
            ]}
          >
            {inputMode === "litres" ? "Volume (Litres)" : "Amount (ZAR)"}
          </Text>

          <View
            style={[
              styles.inputRow,
              {
                borderColor: isWF ? "#CCCCCC" : colors.divider,

                borderRadius: isWF ? Radius.sm : Radius.md,
              },
            ]}
          >
            <Text
              style={[
                styles.inputPrefix,
                {
                  color: isWF ? "#888" : colors.inkLight,

                  fontFamily: isWF ? undefined : "Inter_600SemiBold",
                },
              ]}
            >
              {inputMode === "litres" ? "L" : "R"}
            </Text>

            <TextInput
              style={[
                styles.amountInput,
                {
                  color: isWF ? "#1A1A1A" : colors.charcoalInk,

                  fontFamily: isWF ? undefined : "Inter_600SemiBold",
                },
              ]}
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={isWF ? "#AAAAAA" : colors.inkFaint}
            />
          </View>
        </Card>

        <Card
          style={StyleSheet.flatten([
            styles.totalCard,
            {
              borderLeftWidth: 4,
              borderLeftColor: isWF ? "#888" : colors.ignitionAmber,
            },
          ])}
        >
          <View style={styles.totalRow}>
            <Text
              style={[
                styles.totalLabel,
                {
                  color: isWF ? "#555" : colors.inkLight,

                  fontFamily: font("body"),
                  fontSize: FontSizes.sm,
                },
              ]}
            >
              {inputMode === "litres" ? "Rand equivalent" : "Litres equivalent"}
            </Text>

            <Text
              style={[
                styles.totalValue,
                {
                  color: isWF ? "#333" : colors.charcoalInk,

                  fontFamily: isWF ? undefined : "Inter_500Medium",

                  fontSize: FontSizes.base,
                },
              ]}
            >
              {inputMode === "litres"
                ? `R${randTotal.toFixed(2)}`
                : `${litres.toFixed(2)}L`}
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text
              style={[
                styles.totalLabel,
                {
                  color: isWF ? "#555" : colors.inkLight,

                  fontFamily: font("body"),
                  fontSize: FontSizes.sm,
                },
              ]}
            >
              Rate
            </Text>

            <Text
              style={[
                styles.totalValue,
                {
                  color: isWF ? "#333" : colors.charcoalInk,

                  fontFamily: isWF ? undefined : "Inter_500Medium",

                  fontSize: FontSizes.base,
                },
              ]}
            >
              R{pricePerLitre.toFixed(2)}/L
            </Text>
          </View>

          <View
            style={[
              styles.divider,
              {
                backgroundColor: isWF ? "#DDDDDD" : colors.divider,
              },
            ]}
          />

          <View style={styles.totalRow}>
            <Text
              style={[
                styles.totalLabel,
                {
                  color: isWF ? "#555" : colors.inkLight,

                  fontFamily: font("body"),
                  fontSize: FontSizes.sm,
                },
              ]}
            >
              Delivery fee
            </Text>

            <Text
              style={[
                styles.totalValue,
                {
                  color: isWF ? "#333" : colors.charcoalInk,

                  fontFamily: isWF ? undefined : "Inter_500Medium",

                  fontSize: FontSizes.base,
                },
              ]}
            >
              R{deliveryFee.toFixed(2)}
            </Text>
          </View>

          <View
            style={[
              styles.divider,
              {
                backgroundColor: isWF ? "#DDDDDD" : colors.divider,
              },
            ]}
          />

          <View style={styles.totalRow}>
            <Text
              style={[
                styles.grandLabel,
                {
                  color: isWF ? "#1A1A1A" : colors.charcoalInk,

                  fontFamily: font("bodyBold"),
                  fontSize: FontSizes.base,
                },
              ]}
            >
              Total
            </Text>

            <Text
              style={[
                styles.grandValue,
                {
                  color: isWF ? "#1A1A1A" : colors.ignitionAmber,

                  fontFamily: isWF ? undefined : "Inter_700Bold",

                  fontSize: FontSizes.lg,
                },
              ]}
            >
              R{grandTotal.toFixed(2)}
            </Text>
          </View>
        </Card>

        <Button
          label="Continue"
          onPress={handleContinue}
          size="lg"
          disabled={litres <= 0 || !currentRate?.id}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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

  scroll: {
    padding: Spacing.base,
    paddingBottom: Spacing["3xl"],
  },

  label: {
    marginBottom: Spacing.sm,
  },

  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },

  typeCard: {
    width: "47%",
    padding: Spacing.md,
    borderWidth: 1.5,
    alignItems: "center",
    gap: 4,
  },

  typeName: {
    textAlign: "center",
  },

  typePrice: {},

  toggleContainer: {
    flexDirection: "row",
    padding: 4,
    marginBottom: Spacing.lg,
  },

  toggleBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },

  toggleText: {},

  inputCard: {
    marginBottom: Spacing.md,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },

  inputPrefix: {},

  amountInput: {
    flex: 1,
  },

  totalCard: {
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  totalLabel: {},

  totalValue: {},

  grandLabel: {},

  grandValue: {},

  divider: {
    height: 1,
    marginVertical: 4,
  },
});
