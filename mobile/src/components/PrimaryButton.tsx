import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export function PrimaryButton({
  label,
  onPress,
  disabled,
  testID
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      style={[styles.button, disabled && styles.disabled]}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#126b48",
    borderRadius: 10,
    padding: 13,
    alignItems: "center",
    marginTop: 12
  },
  disabled: { opacity: 0.6 },
  label: { color: "#fff", fontWeight: "700" }
});
