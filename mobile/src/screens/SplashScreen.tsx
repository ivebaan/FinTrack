import React from "react";
import { Image, StyleSheet, View } from "react-native";

export function SplashScreen() {
  return (
    <View style={styles.screen}>
      <Image
        source={require("../../assets/fintrack-logo.png")}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="FinTrack"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center"
  },
  logo: {
    width: "76%",
    height: 220
  }
});
