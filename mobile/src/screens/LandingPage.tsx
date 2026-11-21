import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";

export function LandingPage({
  onLogin,
  onRegister
}: {
  onLogin: () => void;
  onRegister: () => void;
}) {
  return (
    <Card>
      <Image
        source={require("../../assets/fintrack-logo.png")}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="FinTrack logo"
      />
      <Text style={styles.kicker}>BOOKKEEPING FOR SMALL BUSINESSES</Text>
      <Text style={styles.title}>Stay organized, keep records, and know what comes next.</Text>
      <Text style={styles.description}>
        FinTrack helps Philippine non-VAT micro and small businesses track their business and verification status.
      </Text>
      <PrimaryButton label="Get started" onPress={onRegister} testID="landing-register" />
      <TouchableOpacity accessibilityRole="button" style={styles.link} onPress={onLogin}>
        <Text style={styles.linkText}>I already have an account</Text>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  logo: { width: "100%", height: 160, alignSelf: "center", marginBottom: 8, borderRadius: 12 },
  kicker: { color: "#126b48", fontSize: 12, fontWeight: "800", letterSpacing: 1, marginBottom: 10 },
  title: { color: "#18382d", fontSize: 28, lineHeight: 34, fontWeight: "800", marginBottom: 12 },
  description: { color: "#45564f", lineHeight: 22 },
  link: { alignItems: "center", paddingVertical: 14 },
  linkText: { color: "#126b48", fontWeight: "700" }
});
