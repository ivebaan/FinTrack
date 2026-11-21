import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card } from "../components/Card";
import { FormField } from "../components/FormField";
import { PrimaryButton } from "../components/PrimaryButton";

export function LoginScreen({
  loading,
  error,
  onLogin,
  onRegister,
  onBack
}: {
  loading: boolean;
  error: string | null;
  onLogin: (email: string, password: string) => void;
  onRegister: () => void;
  onBack: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <Card>
      <Text style={styles.title}>Sign in</Text>
      {error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
      <FormField
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        testID="login-email"
      />
      <FormField
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        autoComplete="password"
        testID="login-password"
      />
      <PrimaryButton
        label={loading ? "Signing in…" : "Sign in"}
        disabled={loading}
        onPress={() => onLogin(email.trim(), password)}
        testID="login-submit"
      />
      <View style={styles.links}>
        <TouchableOpacity accessibilityRole="button" onPress={onRegister}>
          <Text style={styles.linkText}>Create account</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" onPress={onBack}>
          <Text style={styles.linkText}>Back</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12, color: "#18382d" },
  error: { backgroundColor: "#fff1f1", color: "#8f1d1d", borderRadius: 8, padding: 10, marginBottom: 10 },
  links: { flexDirection: "row", justifyContent: "space-between", paddingTop: 12 },
  linkText: { color: "#126b48", fontWeight: "700" }
});
