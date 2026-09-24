import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useDesignMode } from "../../context/DesignModeContext";
import {
  FontSizes,
  Spacing,
  Radius,
} from "../../theme/tokens";

import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";

import {
  orderRepository,
  OrderModel,
} from "../../repositories/OrderRepository";

interface Props {
  navigation: any;
}

type FilterType =
  | "ALL"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "PENDING_PAYMENT";

interface FilterOption {
  key: FilterType;
  label: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  {
    key: "ALL",
    label: "All",
  },
  {
    key: "ACTIVE",
    label: "Active",
  },
  {
    key: "COMPLETED",
    label: "Completed",
  },
  {
    key: "CANCELLED",
    label: "Cancelled",
  },
  {
    key: "PENDING_PAYMENT",
    label: "Payment Pending",
  },
];

const ACTIVE_STATUSES = [
  "PAID",
  "FINDING_DRIVER",
  "ACCEPTED",
  "NAVIGATING",
  "ARRIVED",
  "DISPENSING",
  "DELIVERED",
];

function formatDate(
  iso: string,
): string {
  const d = new Date(iso);

  return d.toLocaleDateString(
    "en-ZA",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

function getStatusLabel(
  status: OrderModel["status"],
): string {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Payment Pending";

    case "PAID":
    case "FINDING_DRIVER":
      return "Finding Driver";

    case "ACCEPTED":
      return "Driver Assigned";

    case "NAVIGATING":
      return "Driver En Route";

    case "ARRIVED":
      return "Driver Arrived";

    case "DISPENSING":
      return "Fuel Being Dispensed";

    case "DELIVERED":
      return "Delivery Awaiting PIN";

    case "COMPLETED":
      return "Completed";

    case "CANCELLED":
      return "Cancelled";

    default:
      return status;
  }
}

function matchesFilter(
  order: OrderModel,
  filter: FilterType,
): boolean {
  switch (filter) {
    case "ACTIVE":
      return ACTIVE_STATUSES.includes(
        order.status,
      );

    case "COMPLETED":
      return (
        order.status ===
        "COMPLETED"
      );

    case "CANCELLED":
      return (
        order.status ===
        "CANCELLED"
      );

    case "PENDING_PAYMENT":
      return (
        order.status ===
        "PENDING_PAYMENT"
      );

    case "ALL":
    default:
      return true;
  }
}

function matchesSearch(
  order: OrderModel,
  search: string,
): boolean {
  const query =
    search.trim().toLowerCase();

  if (!query) {
    return true;
  }

  const searchableFields = [
    order.id,
    order.orderNumber,
    order.status,
    getStatusLabel(
      order.status,
    ),
    order.item?.fuelType,
    String(
      order.item?.litres ?? "",
    ),
    order.deliveryAddress?.street,
    order.deliveryAddress?.suburb,
    order.deliveryAddress?.city,
    order.deliveryAddress?.province,
    order.deliveryAddress?.postalCode,
  ];

  return searchableFields.some(
    (field) =>
      String(field ?? "")
        .toLowerCase()
        .includes(query),
  );
}

export default function OrderHistoryScreen({
  navigation,
}: Props) {
  const {
    colors,
    font,
    isWireframe: isWF,
  } = useDesignMode();

  const [
    orders,
    setOrders,
  ] = useState<OrderModel[]>(
    [],
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    activeFilter,
    setActiveFilter,
  ] = useState<FilterType>(
    "ALL",
  );

  const loadOrders =
    async () => {
      try {
        const data =
          await orderRepository.getOrders();

        setOrders(data);
      } catch (error) {
        console.error(
          "OrderHistoryScreen: failed to load orders:",
          error,
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadOrders();

    const interval =
      setInterval(
        () => {
          loadOrders();
        },
        5000,
      );

    return () =>
      clearInterval(interval);
  }, []);

  const filteredOrders =
    useMemo(() => {
      return orders
        .filter((order) =>
          matchesFilter(
            order,
            activeFilter,
          ),
        )
        .filter((order) =>
          matchesSearch(
            order,
            searchQuery,
          ),
        );
    }, [
      orders,
      activeFilter,
      searchQuery,
    ]);

  const clearSearch =
    () => {
      setSearchQuery("");
    };

  const renderFilterChip =
    ({
      item,
    }: {
      item: FilterOption;
    }) => {
      const selected =
        activeFilter ===
        item.key;

      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            setActiveFilter(
              item.key,
            )
          }
          style={[
            styles.filterChip,
            {
              backgroundColor:
                selected
                  ? isWF
                    ? "#555555"
                    : colors.petrolDeep
                  : isWF
                    ? "#E0E0E0"
                    : colors.white,

              borderColor:
                selected
                  ? isWF
                    ? "#555555"
                    : colors.petrolDeep
                  : isWF
                    ? "#CCCCCC"
                    : colors.divider,
            },
          ]}
        >
          <Text
            style={{
              color: selected
                ? "#FFFFFF"
                : isWF
                  ? "#555555"
                  : colors.charcoalInk,

              fontFamily:
                font(
                  selected
                    ? "bodyMedium"
                    : "body",
                ),

              fontSize:
                FontSizes.xs,
            }}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      );
    };

  const renderItem = ({
    item,
  }: {
    item: OrderModel;
  }) => {
    const isDeliveredAwaitingPin =
      item.status ===
      "DELIVERED";

    const isCompleted =
      item.status ===
      "COMPLETED";

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate(
            "OrderDetails",
            {
              orderId:
                item.id,
            },
          )
        }
      >
        <Card
          style={
            styles.orderCard
          }
        >
          <View
            style={
              styles.orderHeader
            }
          >
            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={[
                  styles.orderId,
                  {
                    color: isWF
                      ? "#888888"
                      : colors.inkFaint,

                    fontFamily:
                      isWF
                        ? undefined
                        : "Inter_400Regular",

                    fontSize:
                      FontSizes.xs,
                  },
                ]}
              >
                #
                {item.orderNumber ||
                  item.id}
              </Text>

              <Text
                style={[
                  styles.fuelType,
                  {
                    color: isWF
                      ? "#1A1A1A"
                      : colors.charcoalInk,

                    fontFamily:
                      font(
                        "bodyMedium",
                      ),

                    fontSize:
                      FontSizes.base,
                  },
                ]}
              >
                {item.item.litres}L{" "}
                {
                  item.item
                    .fuelType
                }
              </Text>

              <Text
                style={[
                  styles.address,
                  {
                    color: isWF
                      ? "#666666"
                      : colors.inkLight,

                    fontFamily:
                      font(
                        "body",
                      ),

                    fontSize:
                      FontSizes.xs,
                  },
                ]}
              >
                {
                  item
                    .deliveryAddress
                    .street
                }
                ,{" "}
                {
                  item
                    .deliveryAddress
                    .city
                }
              </Text>
            </View>

            <View
              style={{
                alignItems:
                  "flex-end",

                gap:
                  Spacing.xs,
              }}
            >
              <Text
                style={[
                  styles.total,
                  {
                    color: isWF
                      ? "#1A1A1A"
                      : colors.ignitionAmber,

                    fontFamily:
                      isWF
                        ? undefined
                        : "Inter_600SemiBold",

                    fontSize:
                      FontSizes.md,
                  },
                ]}
              >
                R
                {item.totalAmount.toFixed(
                  2,
                )}
              </Text>

              <StatusBadge
                status={
                  item.status as any
                }
                size="sm"
              />

              {isDeliveredAwaitingPin && (
                <Text
                  style={{
                    color: isWF
                      ? "#666666"
                      : colors.petrolDeep,

                    fontFamily:
                      font(
                        "bodyMedium",
                      ),

                    fontSize:
                      FontSizes.xs,

                    maxWidth:
                      125,

                    textAlign:
                      "right",
                  }}
                >
                  PIN confirmation
                  required
                </Text>
              )}

              {isCompleted && (
                <Text
                  style={{
                    color: isWF
                      ? "#666666"
                      : colors.dieselGreen,

                    fontFamily:
                      font(
                        "bodyMedium",
                      ),

                    fontSize:
                      FontSizes.xs,
                  }}
                >
                  Delivery confirmed
                </Text>
              )}
            </View>
          </View>

          <View
            style={[
              styles.orderFooter,
              {
                borderTopColor:
                  isWF
                    ? "#DDDDDD"
                    : colors.divider,
              },
            ]}
          >
            <View
              style={{
                flexDirection:
                  "row",

                alignItems:
                  "center",

                gap: 4,
              }}
            >
              <Feather
                name="calendar"
                size={12}
                color={
                  isWF
                    ? "#888888"
                    : colors.inkFaint
                }
              />

              <Text
                style={{
                  color: isWF
                    ? "#666666"
                    : colors.inkLight,

                  fontFamily:
                    font(
                      "body",
                    ),

                  fontSize:
                    FontSizes.xs,
                }}
              >
                {formatDate(
                  item.createdAt,
                )}
              </Text>
            </View>

            {item.rating !=
              null && (
              <View
                style={{
                  flexDirection:
                    "row",

                  alignItems:
                    "center",

                  gap: 3,
                }}
              >
                <Feather
                  name="star"
                  size={12}
                  color={
                    isWF
                      ? "#888888"
                      : colors.ignitionAmber
                  }
                />

                <Text
                  style={{
                    color: isWF
                      ? "#666666"
                      : colors.inkLight,

                    fontFamily:
                      font(
                        "body",
                      ),

                    fontSize:
                      FontSizes.xs,
                  }}
                >
                  {item.rating}/5
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.reorderBtn,
                {
                  backgroundColor:
                    isWF
                      ? "#D0D0D0"
                      : colors.petrolLight,

                  borderRadius:
                    isWF
                      ? Radius.sm
                      : Radius.full,
                },
              ]}
              onPress={(
                event,
              ) => {
                event.stopPropagation?.();

                navigation.navigate(
                  "FuelSelection",
                  {
                    reorder:
                      item,
                  },
                );
              }}
            >
              <Feather
                name="refresh-cw"
                size={12}
                color={
                  isWF
                    ? "#444444"
                    : colors.petrolDeep
                }
              />

              <Text
                style={{
                  color: isWF
                    ? "#444444"
                    : colors.petrolDeep,

                  fontFamily:
                    font(
                      "bodyMedium",
                    ),

                  fontSize:
                    FontSizes.xs,
                }}
              >
                Reorder
              </Text>
            </TouchableOpacity>

            <Feather
              name="chevron-right"
              size={18}
              color={
                isWF
                  ? "#777777"
                  : colors.inkFaint
              }
            />
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            isWF
              ? "#F0F0F0"
              : colors.warmAsh,
        },
      ]}
    >
      <View
        style={
          styles.topBar
        }
      >
        <View>
          <Text
            style={[
              styles.title,
              {
                color: isWF
                  ? "#1A1A1A"
                  : colors.charcoalInk,

                fontFamily:
                  font(
                    "displayBold",
                  ),

                fontSize:
                  FontSizes.xl,
              },
            ]}
          >
            Order History
          </Text>

          {!loading && (
            <Text
              style={{
                color: isWF
                  ? "#777777"
                  : colors.inkLight,

                fontFamily:
                  font("body"),

                fontSize:
                  FontSizes.xs,

                marginTop: 3,
              }}
            >
              {filteredOrders.length}{" "}
              {filteredOrders.length ===
              1
                ? "order"
                : "orders"}
            </Text>
          )}
        </View>
      </View>

      <View
        style={
          styles.controls
        }
      >
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor:
                isWF
                  ? "#FFFFFF"
                  : colors.white,

              borderColor:
                isWF
                  ? "#CCCCCC"
                  : colors.divider,
            },
          ]}
        >
          <Feather
            name="search"
            size={18}
            color={
              isWF
                ? "#777777"
                : colors.inkLight
            }
          />

          <TextInput
            value={
              searchQuery
            }
            onChangeText={
              setSearchQuery
            }
            placeholder="Search orders..."
            placeholderTextColor={
              isWF
                ? "#999999"
                : colors.inkFaint
            }
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={[
              styles.searchInput,
              {
                color:
                  isWF
                    ? "#222222"
                    : colors.charcoalInk,

                fontFamily:
                  font("body"),

                fontSize:
                  FontSizes.sm,
              },
            ]}
          />

          {searchQuery.length >
            0 && (
            <TouchableOpacity
              onPress={
                clearSearch
              }
              style={
                styles.clearSearch
              }
              hitSlop={{
                top: 8,
                bottom: 8,
                left: 8,
                right: 8,
              }}
            >
              <Feather
                name="x-circle"
                size={17}
                color={
                  isWF
                    ? "#777777"
                    : colors.inkLight
                }
              />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={
            FILTER_OPTIONS
          }
          keyExtractor={(
            item,
          ) => item.key}
          renderItem={
            renderFilterChip
          }
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.filterList
          }
        />
      </View>

      {loading ? (
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color={
              isWF
                ? "#888888"
                : colors.petrolDeep
            }
          />

          <Text
            style={{
              color: isWF
                ? "#777777"
                : colors.inkLight,

              fontFamily:
                font("body"),

              fontSize:
                FontSizes.sm,

              marginTop:
                Spacing.md,
            }}
          >
            Loading orders...
          </Text>
        </View>
      ) : (
        <FlatList
          data={
            filteredOrders
          }
          keyExtractor={(
            item,
          ) => item.id}
          renderItem={
            renderItem
          }
          contentContainerStyle={
            styles.list
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View
              style={
                styles.emptyState
              }
            >
              <View
                style={[
                  styles.emptyIcon,
                  {
                    backgroundColor:
                      isWF
                        ? "#E0E0E0"
                        : colors.petrolLight,
                  },
                ]}
              >
                <Feather
                  name={
                    searchQuery ||
                    activeFilter !==
                      "ALL"
                      ? "search"
                      : "package"
                  }
                  size={26}
                  color={
                    isWF
                      ? "#666666"
                      : colors.petrolDeep
                  }
                />
              </View>

              <Text
                style={{
                  color: isWF
                    ? "#333333"
                    : colors.charcoalInk,

                  fontFamily:
                    font(
                      "display",
                    ),

                  fontSize:
                    FontSizes.base,

                  marginTop:
                    Spacing.md,
                }}
              >
                {searchQuery ||
                activeFilter !==
                  "ALL"
                  ? "No matching orders"
                  : "No orders yet"}
              </Text>

              <Text
                style={{
                  color: isWF
                    ? "#777777"
                    : colors.inkLight,

                  fontFamily:
                    font("body"),

                  fontSize:
                    FontSizes.sm,

                  textAlign:
                    "center",

                  lineHeight:
                    20,

                  marginTop:
                    Spacing.xs,

                  maxWidth: 280,
                }}
              >
                {searchQuery ||
                activeFilter !==
                  "ALL"
                  ? "Try changing your search or filter."
                  : "Place your first fuel order and it will appear here."}
              </Text>

              {(searchQuery ||
                activeFilter !==
                  "ALL") && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery(
                      "",
                    );
                    setActiveFilter(
                      "ALL",
                    );
                  }}
                  style={[
                    styles.resetBtn,
                    {
                      backgroundColor:
                        isWF
                          ? "#555555"
                          : colors.petrolDeep,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color:
                        "#FFFFFF",

                      fontFamily:
                        font(
                          "bodyMedium",
                        ),

                      fontSize:
                        FontSizes.sm,
                    }}
                  >
                    Clear filters
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
    },

    topBar: {
      padding:
        Spacing.base,

      paddingTop:
        Spacing.md,

      paddingBottom:
        Spacing.sm,
    },

    title: {},

    controls: {
      paddingHorizontal:
        Spacing.base,

      paddingBottom:
        Spacing.sm,
    },

    searchContainer: {
      flexDirection:
        "row",

      alignItems:
        "center",

      borderWidth: 1,

      borderRadius:
        Radius.lg,

      minHeight: 48,

      paddingHorizontal:
        Spacing.md,
    },

    searchInput: {
      flex: 1,

      minHeight: 46,

      paddingHorizontal:
        Spacing.sm,

      paddingVertical: 0,
    },

    clearSearch: {
      width: 30,

      height: 30,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    filterList: {
      gap:
        Spacing.xs,

      paddingVertical:
        Spacing.sm,
    },

    filterChip: {
      paddingHorizontal:
        Spacing.md,

      paddingVertical:
        9,

      borderRadius:
        Radius.full,

      borderWidth: 1,
    },

    list: {
      padding:
        Spacing.base,

      paddingTop:
        Spacing.sm,

      paddingBottom:
        Spacing["4xl"],

      gap:
        Spacing.md,
    },

    orderCard: {
      gap: 0,
    },

    orderHeader: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "flex-start",

      marginBottom:
        Spacing.sm,
    },

    orderId: {},

    fuelType: {
      marginTop: 2,
    },

    address: {
      marginTop: 2,
    },

    total: {},

    orderFooter: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      borderTopWidth: 1,

      paddingTop:
        Spacing.sm,

      marginTop:
        Spacing.sm,
    },

    reorderBtn: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 4,

      paddingVertical: 4,

      paddingHorizontal: 10,
    },

    loadingContainer: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      padding:
        Spacing["2xl"],
    },

    emptyState: {
      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal:
        Spacing["2xl"],

      paddingTop:
        Spacing["3xl"],
    },

    emptyIcon: {
      width: 58,

      height: 58,

      borderRadius: 29,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    resetBtn: {
      marginTop:
        Spacing.md,

      paddingHorizontal:
        Spacing.lg,

      paddingVertical:
        10,

      borderRadius:
        Radius.full,
    },
  });