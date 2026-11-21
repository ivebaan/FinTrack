import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Card } from "../components/Card";
import { FormField } from "../components/FormField";
import { PrimaryButton } from "../components/PrimaryButton";
import type { RegistrationInput } from "../types";

export function RegistrationScreen({
  loading,
  error,
  onRegister,
  onCancel
}: {
  loading: boolean;
  error: string | null;
  onRegister: (input: RegistrationInput) => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [tin, setTin] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  return (
    <Card>
      <Text style={styles.title}>Create account</Text>
      {error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
      <FormField value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
      <FormField value={password} onChangeText={setPassword} placeholder="Password (12+ characters)" secureTextEntry />
      <FormField value={businessName} onChangeText={setBusinessName} placeholder="Registered business name" />
      <FormField value={tin} onChangeText={setTin} placeholder="Business TIN" keyboardType="number-pad" />
      <FormField value={address} onChangeText={setAddress} placeholder="Business address" />
      <FormField value={contactNumber} onChangeText={setContactNumber} placeholder="Contact number" keyboardType="phone-pad" />
      <PrimaryButton
        label={loading ? "Creating…" : "Create account"}
        disabled={loading}
        onPress={() => onRegister({
          email: email.trim(),
          password,
          registeredBusinessName: businessName.trim(),
          businessTin: tin.trim(),
          legalForm: "SOLE_PROPRIETORSHIP",
          businessAddress: address.trim(),
          taxClassification: "NON_VAT",
          contactNumber: contactNumber.trim(),
          consentVersion: "fintrack-consent-v1",
          consentTimestamp: new Date().toISOString()
        })}
        testID="register-submit"
      />
      <TouchableOpacity accessibilityRole="button" style={styles.back} onPress={onCancel}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12, color: "#18382d" },
  error: { backgroundColor: "#fff1f1", color: "#8f1d1d", borderRadius: 8, padding: 10, marginBottom: 10 },
  back: { alignItems: "center", paddingTop: 14 },
  backText: { color: "#126b48", fontWeight: "700" }
});
