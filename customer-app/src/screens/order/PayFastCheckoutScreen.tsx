import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Feather } from "@expo/vector-icons";
import { useDesignMode } from "../../context/DesignModeContext";
import { FontSizes, Spacing, Radius } from "../../theme/tokens";
import { supabase } from "../../services/supabase";

interface Props {
  navigation: any;
  route: any;
}

function cleanPayFastData(
  data: Record<string, string>
): Record<string, string> {
  const cleaned: Record<string, string> = {};

  for (const key of Object.keys(data)) {
    const val = data[key];

    if (
      val !== undefined &&
      val !== null &&
      String(val).trim() !== ""
    ) {
      cleaned[key] = String(val).trim();
    }
  }

  return cleaned;
}

export default function PayFastCheckoutScreen({
  navigation,
  route,
}: Props) {
  const { colors, font, isWireframe: isWF } =
    useDesignMode();

  const {
    paymentUrl =
      "https://sandbox.payfast.co.za/eng/process",
    paymentData: rawPaymentData = {},
    orderId,
  } = route.params || {};

  const paymentData =
    cleanPayFastData(rawPaymentData);

  const paymentHandledRef =
    useRef(false);

  const pollingRef =
    useRef(false);

  const [waitingForConfirmation, setWaitingForConfirmation] =
    useState(false);

  const [confirmationError, setConfirmationError] =
    useState("");

  const [pollingSeconds, setPollingSeconds] =
    useState(0);

  const escapeHtml = (
    value: string
  ): string => {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
  />

  <style>
    body {
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Helvetica,
        Arial,
        sans-serif;

      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      min-height: 100vh;
      margin: 0;

      background-color: #F8F9FA;
      color: #333333;
    }

    .loader {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #00B4D8;
      border-radius: 50%;

      width: 40px;
      height: 40px;

      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }

      100% {
        transform: rotate(360deg);
      }
    }
  </style>
</head>

<body>
  <div class="loader"></div>

  <p style="font-weight: 500; font-size: 15px;">
    Connecting securely to PayFast...
  </p>

  <form
    id="payfast_form"
    method="POST"
    action="${escapeHtml(paymentUrl)}"
  >
    ${Object.entries(paymentData)
      .map(
        ([key, value]) =>
          `<input
            type="hidden"
            name="${escapeHtml(key)}"
            value="${escapeHtml(
              String(value)
            )}"
          />`
      )
      .join("\n    ")}
  </form>

  <script>
    setTimeout(function() {
      var f =
        document.getElementById(
          "payfast_form"
        );

      if (f) {
        f.submit();
      }
    }, 150);
  </script>
</body>
</html>
`;

  useEffect(() => {
    if (
      Platform.OS === "web" &&
      paymentUrl &&
      paymentData
    ) {
      try {
        const form =
          document.createElement("form");

        form.method = "POST";
        form.action = paymentUrl;
        form.target = "_self";

        Object.entries(paymentData).forEach(
          ([key, val]) => {
            const input =
              document.createElement("input");

            input.type = "hidden";
            input.name = key;
            input.value = String(val);

            form.appendChild(input);
          }
        );

        document.body.appendChild(form);
        form.submit();
      } catch (err) {
        console.error(
          "Web PayFast auto-submit error:",
          err
        );
      }
    }
  }, [paymentUrl, paymentData]);

  const handleClose = () => {
    if (paymentHandledRef.current) {
      return;
    }

    navigation.goBack();
  };

  /**
   * Wait for the PayFast ITN to update
   * the actual Supabase order.
   */
  const waitForPaymentConfirmation =
    async () => {
      if (
        !orderId ||
        pollingRef.current
      ) {
        return;
      }

      pollingRef.current = true;
      paymentHandledRef.current = true;

      setWaitingForConfirmation(true);
      setConfirmationError("");
      setPollingSeconds(0);

      console.log(
        "PayFast returned successfully.",
        "Waiting for Supabase payment confirmation:",
        orderId
      );

      const maxAttempts = 30;

      for (
        let attempt = 0;
        attempt < maxAttempts;
        attempt++
      ) {
        try {
          setPollingSeconds(
            attempt + 1
          );

          const {
            data,
            error,
          } = await supabase.rpc(
            "get_customer_order_payment_status",
            {
              p_order_id: orderId,
            }
          );

          if (error) {
            console.warn(
              "Payment status check failed:",
              error.message
            );
          } else {
            console.log(
              "Payment confirmation status:",
              data
            );

            const orderStatus =
              data?.order_status;

            const paymentStatus =
              data?.payment_status;

            if (
              orderStatus === "PAID" ||
              paymentStatus === "COMPLETE"
            ) {
              console.log(
                "Payment confirmed. Opening OrderPlaced."
              );

              navigation.replace(
                "OrderPlaced",
                {
                  orderId,
                }
              );

              pollingRef.current =
                false;

              return;
            }
          }
        } catch (error) {
          console.warn(
            "Payment confirmation polling error:",
            error
          );
        }

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              1000
            )
        );
      }

      pollingRef.current = false;

      setWaitingForConfirmation(
        false
      );

      setConfirmationError(
        "Your payment was returned successfully, but PayFast has not yet confirmed the payment with FuelNow. Please wait a moment and try again."
      );

      /**
       * Allow the user to retry the
       * confirmation check without
       * opening PayFast again.
       */
      paymentHandledRef.current =
        false;
    };

  const handlePaymentCancel = () => {
    if (paymentHandledRef.current) {
      return;
    }

    paymentHandledRef.current = true;

    console.log(
      "PayFast payment cancelled."
    );

    navigation.goBack();
  };

  /**
   * This is the critical WebView fix.
   *
   * It catches the FuelNow custom URL
   * BEFORE Android WebView attempts
   * to load it.
   */
  const handleShouldStartLoad = (
    request: any
  ) => {
    const url =
      request?.url || "";

    console.log(
      "PayFast navigation request:",
      url
    );

    if (
      url.startsWith(
        "fuelnow://payment/success"
      )
    ) {
      void waitForPaymentConfirmation();

      return false;
    }

    if (
      url.startsWith(
        "fuelnow://payment/cancel"
      )
    ) {
      handlePaymentCancel();

      return false;
    }

    return true;
  };

  const handleNavigationChange = (
    navState: any
  ) => {
    const url =
      navState?.url || "";

    console.log(
      "PayFast navigation URL:",
      url
    );

    /**
     * These are fallback checks.
     *
     * The normal success/cancel path
     * should already have been intercepted
     * by onShouldStartLoadWithRequest.
     */
    if (
      url.startsWith(
        "fuelnow://payment/success"
      )
    ) {
      void waitForPaymentConfirmation();
      return;
    }

    if (
      url.startsWith(
        "fuelnow://payment/cancel"
      )
    ) {
      handlePaymentCancel();
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isWF
            ? "#F0F0F0"
            : colors.warmAsh,
        },
      ]}
      edges={[
        "top",
        "left",
        "right",
      ]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: isWF
              ? "#FFFFFF"
              : colors.white,

            borderBottomColor: isWF
              ? "#E0E0E0"
              : colors.divider,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeBtn}
        >
          <Feather
            name="x"
            size={22}
            color={
              isWF
                ? "#333333"
                : colors.charcoalInk
            }
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.title,
            {
              color: isWF
                ? "#1A1A1A"
                : colors.charcoalInk,

              fontFamily:
                font("bodyMedium"),
            },
          ]}
        >
          Secure PayFast Payment
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {waitingForConfirmation ? (
        <View
          style={[
            styles.confirmationContainer,
            {
              backgroundColor:
                isWF
                  ? "#F0F0F0"
                  : colors.warmAsh,
            },
          ]}
        >
          <View
            style={[
              styles.confirmationIcon,
              {
                backgroundColor:
                  colors.petrolLight,
              },
            ]}
          >
            <Feather
              name="check"
              size={30}
              color={colors.petrolDeep}
            />
          </View>

          <Text
            style={[
              styles.confirmationTitle,
              {
                color:
                  colors.charcoalInk,
                fontFamily:
                  font("display"),
              },
            ]}
          >
            Payment received
          </Text>

          <Text
            style={[
              styles.confirmationText,
              {
                color:
                  colors.inkLight,
                fontFamily:
                  font("body"),
              },
            ]}
          >
            PayFast has returned your
            payment. We&apos;re confirming
            the transaction with FuelNow.
          </Text>

          <ActivityIndicator
            size="large"
            color={colors.petrolDeep}
            style={{
              marginTop: Spacing.lg,
            }}
          />

          <Text
            style={[
              styles.confirmationSubtext,
              {
                color:
                  colors.inkLight,
                fontFamily:
                  font("body"),
              },
            ]}
          >
            Checking payment status...
            {" "}
            {pollingSeconds}s
          </Text>
        </View>
      ) : confirmationError ? (
        <View
          style={[
            styles.confirmationContainer,
            {
              backgroundColor:
                isWF
                  ? "#F0F0F0"
                  : colors.warmAsh,
            },
          ]}
        >
          <View
            style={[
              styles.errorIcon,
              {
                backgroundColor:
                  isWF
                    ? "#EEEEEE"
                    : "#FDECEC",
              },
            ]}
          >
            <Feather
              name="clock"
              size={30}
              color={
                isWF
                  ? "#555555"
                  : colors.signalRed
              }
            />
          </View>

          <Text
            style={[
              styles.confirmationTitle,
              {
                color:
                  colors.charcoalInk,
                fontFamily:
                  font("display"),
              },
            ]}
          >
            Payment confirmation pending
          </Text>

          <Text
            style={[
              styles.confirmationText,
              {
                color:
                  colors.inkLight,
                fontFamily:
                  font("body"),
              },
            ]}
          >
            {confirmationError}
          </Text>

          <TouchableOpacity
            style={[
              styles.retryButton,
              {
                backgroundColor:
                  colors.petrolDeep,
                borderRadius:
                  Radius.md,
              },
            ]}
            onPress={() => {
              void waitForPaymentConfirmation();
            }}
          >
            <Text
              style={[
                styles.retryText,
                {
                  fontFamily:
                    font("bodyMedium"),
                },
              ]}
            >
              Check Again
            </Text>
          </TouchableOpacity>
        </View>
      ) : Platform.OS === "web" ? (
        <View
          style={
            styles.webContainer
          }
        >
          <ActivityIndicator
            size="large"
            color={
              colors.petrolDeep
            }
          />

          <Text
            style={[
              styles.webText,
              {
                color:
                  colors.charcoalInk,
                fontFamily:
                  font("body"),
              },
            ]}
          >
            Redirecting to PayFast
            Secure Checkout...
          </Text>

          <TouchableOpacity
            style={[
              styles.manualBtn,
              {
                backgroundColor:
                  colors.petrolDeep,
                borderRadius:
                  Radius.md,
              },
            ]}
            onPress={() => {
              if (
                paymentUrl &&
                paymentData
              ) {
                const form =
                  document.createElement(
                    "form"
                  );

                form.method =
                  "POST";

                form.action =
                  paymentUrl;

                form.target =
                  "_self";

                Object.entries(
                  paymentData
                ).forEach(
                  ([key, val]) => {
                    const input =
                      document.createElement(
                        "input"
                      );

                    input.type =
                      "hidden";

                    input.name =
                      key;

                    input.value =
                      String(val);

                    form.appendChild(
                      input
                    );
                  }
                );

                document.body.appendChild(
                  form
                );

                form.submit();
              }
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontFamily:
                  font(
                    "bodyMedium"
                  ),
              }}
            >
              Click here if you are
              not redirected
              automatically
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <WebView
            source={{ html }}
            originWhitelist={["*"]}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mixedContentMode="always"
            startInLoadingState
            renderLoading={() => (
              <View
                style={
                  styles.loadingContainer
                }
              >
                <ActivityIndicator
                  size="large"
                  color={
                    colors.petrolDeep
                  }
                />
              </View>
            )}
            onShouldStartLoadWithRequest={
              handleShouldStartLoad
            }
            onNavigationStateChange={
              handleNavigationChange
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
  },

  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: FontSizes.md,
  },

  loadingContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9FA",
  },

  confirmationContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },

  confirmationIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },

  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },

  confirmationTitle: {
    fontSize: FontSizes.xl,
    textAlign: "center",
  },

  confirmationText: {
    fontSize: FontSizes.base,
    lineHeight: 23,
    textAlign: "center",
    maxWidth: 420,
    marginTop: Spacing.sm,
  },

  confirmationSubtext: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.md,
  },

  retryButton: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: FontSizes.base,
  },

  webContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },

  webText: {
    fontSize: FontSizes.base,
    marginTop: Spacing.sm,
    textAlign: "center",
  },

  manualBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
});