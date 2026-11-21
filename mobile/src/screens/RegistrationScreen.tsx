import React, { useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { RegistrationInput } from "../types";

export function RegistrationScreen({
  loading,
  error,
  onRegister,
  onCancel,
  onLogin
}: {
  loading: boolean;
  error: string | null;
  onRegister: (input: RegistrationInput) => void;
  onCancel: () => void;
  onLogin: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [localError, setLocalError] = useState("");

  function handleRegister() {
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setLocalError("Please agree to the Terms of Service.");
      return;
    }

    setLocalError("");
    onRegister({
      email: email.trim(),
      password,
      registeredBusinessName: fullName.trim() || "Personal Account",
      businessTin: "000000000",
      legalForm: "SOLE_PROPRIETORSHIP",
      businessAddress: "Address not provided",
      taxClassification: "NON_VAT",
      contactNumber: contactNumber.trim(),
      consentVersion: "fintrack-consent-v1",
      consentTimestamp: new Date().toISOString()
    });
  }

  return (
    <View style={styles.screen}>
      <View style={styles.decorTop} />
      <View style={styles.decorBottom} />

      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" onPress={onCancel} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Image
          source={require("../../assets/fintrack-logo.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="FinTrack"
        />
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>Create Your Account</Text>
        <Text style={styles.subtitle}>Let's get started with FinTrack!</Text>
        {(error || localError) && (
          <Text style={styles.error} accessibilityRole="alert">{localError || error}</Text>
        )}

        <View style={styles.field}>
          <Text style={styles.fieldIcon}>♙</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full Name"
            placeholderTextColor="#8f9391"
            style={styles.input}
            autoCapitalize="words"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldIcon}>✉</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email Address"
            placeholderTextColor="#8f9391"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldIcon}>☎</Text>
          <TextInput
            value={contactNumber}
            onChangeText={setContactNumber}
            placeholder="Phone Number"
            placeholderTextColor="#8f9391"
            style={styles.input}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldIcon}>▣</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#8f9391"
            style={styles.input}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
          />
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.eyeButton}
            onPress={() => setShowPassword((visible) => !visible)}
          >
            <Text style={styles.eye}>◉</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldIcon}>▣</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm Password"
            placeholderTextColor="#8f9391"
            style={styles.input}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoComplete="password"
          />
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword((visible) => !visible)}
          >
            <Text style={styles.eye}>◉</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          style={styles.termsRow}
          onPress={() => setAgreed((checked) => !checked)}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.termsText}>I agree to the Terms of Service and Privacy Policy.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.primaryButton, loading && styles.disabled]}
          disabled={loading}
          onPress={handleRegister}
          testID="register-submit"
        >
          <Text style={styles.primaryLabel}>{loading ? "Registering…" : "Register"}</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity accessibilityRole="button" style={styles.googleButton}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleLabel}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity accessibilityRole="button" style={styles.loginLink} onPress={onLogin}>
          <Text style={styles.loginText}>Already have an account? <Text style={styles.loginBold}>Log In</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: "100%",
    minHeight: 760,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    overflow: "hidden"
  },
  decorTop: {
    position: "absolute",
    width: 190,
    height: 190,
    right: -95,
    top: -110,
    borderRadius: 95,
    backgroundColor: "#dff2e7",
    transform: [{ rotate: "-20deg" }]
  },
  decorBottom: {
    position: "absolute",
    width: 230,
    height: 230,
    left: -75,
    bottom: -175,
    borderRadius: 115,
    backgroundColor: "#bfe3ce"
  },
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4
  },
  backButton: {
    position: "absolute",
    left: -4,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  backIcon: { fontSize: 34, lineHeight: 38, color: "#1f2924" },
  logo: { width: 150, height: 64 },
  form: { width: "100%", zIndex: 1 },
  title: {
    textAlign: "center",
    color: "#202521",
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "900",
    marginTop: 2,
    marginBottom: 2
  },
  subtitle: {
    textAlign: "center",
    color: "#657069",
    fontSize: 13,
    marginBottom: 16
  },
  error: {
    backgroundColor: "#fff1f1",
    color: "#8f1d1d",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    fontSize: 12
  },
  field: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d9dfdc",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 9,
    paddingHorizontal: 12
  },
  fieldIcon: {
    width: 22,
    marginRight: 8,
    textAlign: "center",
    color: "#68736d",
    fontSize: 17
  },
  input: {
    flex: 1,
    height: "100%",
    color: "#252d29",
    fontSize: 14,
    paddingVertical: 0
  },
  eyeButton: {
    width: 32,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  eye: { color: "#68736d", fontSize: 14 },
  termsRow: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 4
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: "#8e9993",
    borderRadius: 3,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  checkboxChecked: { backgroundColor: "#087a43", borderColor: "#087a43" },
  checkmark: { color: "#fff", fontSize: 12, fontWeight: "800" },
  termsText: {
    flex: 1,
    color: "#303936",
    fontSize: 11,
    lineHeight: 15,
    flexWrap: "nowrap"
  },
  primaryButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "#087a43",
    alignItems: "center",
    justifyContent: "center"
  },
  disabled: { opacity: 0.6 },
  primaryLabel: { color: "#fff", fontSize: 15, fontWeight: "800" },
  dividerRow: {
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  divider: { width: 24, height: 1, backgroundColor: "#d6ddda" },
  orText: { color: "#8a938f", fontSize: 11, marginHorizontal: 8 },
  googleButton: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#087a43",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  googleIcon: {
    color: "#4285f4",
    fontSize: 18,
    fontWeight: "900",
    marginRight: 9
  },
  googleLabel: { color: "#087a43", fontSize: 14, fontWeight: "800" },
  loginLink: { alignItems: "center", paddingTop: 12 },
  loginText: { color: "#69736f", fontSize: 11 },
  loginBold: { color: "#087a43", fontWeight: "800" }
});
