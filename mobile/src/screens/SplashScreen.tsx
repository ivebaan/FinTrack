import React from "react";
import { Image, StyleSheet, View } from "react-native";

export function SplashScreen() {
  return (
    <View style={styles.screen}>
      <Image
        source={require("../../assets/background-splash.jpg")}
        style={styles.background}
        resizeMode="cover"
        accessibilityLabel="FinTrack splash background"
      />
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
    alignItems: "center",
    justifyContent: "center"
  },
  background: {
    position: "absolute",
    width: "100%",
    height: "100%"
  },
  logo: {
    width: "76%",
    height: 220
  }
});
