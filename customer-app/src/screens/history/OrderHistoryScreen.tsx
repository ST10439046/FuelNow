import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useDesignMode } from "../../context/DesignModeContext";
import { FontSizes, Spacing, Radius } from "../../theme/tokens";
import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import {
  orderRepository,
  OrderModel,
} from "../../repositories/OrderRepository";

interface Props {
  navigation: any;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function OrderHistoryScreen({ navigation }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();
  const [orders, setOrders] = useState<OrderModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderRepository.getOrders().then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  const renderItem = ({ item }: { item: OrderModel }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() =>
        navigation.navigate("OrderDetails", {
          orderId: item.id,
        })
      }
    >
      <Card style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.orderId,
                {
                  color: isWF ? "#888" : colors.inkFaint,
                  fontFamily: isWF ? undefined : "Inter_400Regular",
                  fontSize: FontSizes.xs,
                },
              ]}
            >
              #{item.orderNumber || item.id}
            </Text>

            <Text
              style={[
                styles.fuelType,
                {
                  color: isWF ? "#1A1A1A" : colors.charcoalInk,
                  fontFamily: font("bodyMedium"),
                  fontSize: FontSizes.base,
                },
              ]}
            >
              {item.item.litres}L {item.item.fuelType}
            </Text>

            <Text
              style={[
                styles.address,
                {
                  color: isWF ? "#666" : colors.inkLight,
                  fontFamily: font("body"),
                  fontSize: FontSizes.xs,
                },
              ]}
            >
              {item.deliveryAddress.street}, {item.deliveryAddress.city}
            </Text>
          </View>

          <View style={{ alignItems: "flex-end", gap: Spacing.xs }}>
            <Text
              style={[
                styles.total,
                {
                  color: isWF ? "#1A1A1A" : colors.ignitionAmber,
                  fontFamily: isWF ? undefined : "Inter_600SemiBold",
                  fontSize: FontSizes.md,
                },
              ]}
            >
              R{item.totalAmount.toFixed(2)}
            </Text>

            <StatusBadge status={item.status as any} size="sm" />
          </View>
        </View>

        <View
          style={[
            styles.orderFooter,
            {
              borderTopColor: isWF ? "#DDD" : colors.divider,
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Feather
              name="calendar"
              size={12}
              color={isWF ? "#888" : colors.inkFaint}
            />

            <Text
              style={{
                color: isWF ? "#666" : colors.inkLight,
                fontFamily: font("body"),
                fontSize: FontSizes.xs,
              }}
            >
              {formatDate(item.createdAt)}
            </Text>
          </View>

          {item.rating != null && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Feather
                name="star"
                size={12}
                color={isWF ? "#888" : colors.ignitionAmber}
              />

              <Text
                style={{
                  color: isWF ? "#666" : colors.inkLight,
                  fontFamily: font("body"),
                  fontSize: FontSizes.xs,
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
                backgroundColor: isWF ? "#D0D0D0" : colors.petrolLight,
                borderRadius: isWF ? Radius.sm : Radius.full,
              },
            ]}
            onPress={(event) => {
              event.stopPropagation?.();

              navigation.navigate("FuelSelection", {
                reorder: item,
              });
            }}
          >
            <Feather
              name="refresh-cw"
              size={12}
              color={isWF ? "#444" : colors.petrolDeep}
            />

            <Text
              style={{
                color: isWF ? "#444" : colors.petrolDeep,
                fontFamily: font("bodyMedium"),
                fontSize: FontSizes.xs,
              }}
            >
              Reorder
            </Text>
          </TouchableOpacity>

          <Feather
            name="chevron-right"
            size={18}
            color={isWF ? "#777" : colors.inkFaint}
          />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isWF ? "#F0F0F0" : colors.warmAsh },
      ]}
    >
      <View style={styles.topBar}>
        <Text
          style={[
            styles.title,
            {
              color: isWF ? "#1A1A1A" : colors.charcoalInk,
              fontFamily: font("displayBold"),
              fontSize: FontSizes.xl,
            },
          ]}
        >
          Order History
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator
          color={isWF ? "#888" : colors.petrolDeep}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text
              style={[
                {
                  textAlign: "center",
                  color: isWF ? "#888" : colors.inkLight,
                  fontFamily: font("body"),
                  fontSize: FontSizes.base,
                  marginTop: 60,
                },
              ]}
            >
              No orders yet. Place your first order!
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { padding: Spacing.base, paddingTop: Spacing.md },
  title: {},
  list: {
    padding: Spacing.base,
    paddingBottom: Spacing["4xl"],
    gap: Spacing.md,
  },
  orderCard: { gap: 0 },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  orderId: {},
  fuelType: { marginTop: 2 },
  address: { marginTop: 2 },
  total: {},
  orderFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  reorderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
});
