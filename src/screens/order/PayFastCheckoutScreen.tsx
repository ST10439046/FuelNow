import React from "react";
import { View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";

interface Props {
  navigation: any;
  route: any;
}

export default function PayFastCheckoutScreen({ navigation, route }: Props) {
  const { paymentUrl, paymentData } = route.params;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta
    name="viewport"
    content="width=device-width,
    initial-scale=1.0"
  />
</head>

<body>
  <form
    id="payfast"
    method="POST"
    action="${escapeHtml(paymentUrl)}"
  >
    ${Object.entries(paymentData)
      .map(
        ([key, value]) => `
          <input
            type="hidden"
            name="${escapeHtml(key)}"
            value="${escapeHtml(String(value))}"
          />
        `,
      )
      .join("")}
  </form>

  <script>
    document
      .getElementById('payfast')
      .submit();
  </script>
</body>
</html>
`;

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <WebView
        source={{
          html,
        }}
        startInLoadingState
        renderLoading={() => (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIndicator size="large" />
          </View>
        )}
        onNavigationStateChange={(navState) => {
          console.log("PayFast:", navState.url);
        }}
      />
    </View>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
