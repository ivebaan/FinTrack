import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { apiRequest, clearSession, hasSession, login, register, saveSession } from "./src/api";

type Me = {
  businesses: Array<{
    tenantId: string;
    name: string;
    role: string;
    verificationStatus: string;
  }>;
};

const disclaimer =
  "FinTrack supports bookkeeping and compliance tracking. It does not guarantee tax compliance or provide tax advice.";

export default function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<"login" | "register" | "workspace">("login");

  useEffect(() => {
    hasSession()
      .then((authenticated) => {
        if (!authenticated) {
          setScreen("login");
          return null;
        }
        setScreen("workspace");
        return apiRequest("/v1/me");
      })
      .then((profile) => {
        if (profile) setMe(profile);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const business = me?.businesses[0];

  async function handleLogin(email: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const session = await login(email, password);
      await saveSession(session.accessToken, session.refreshToken);
      setScreen("workspace");
      setMe(await apiRequest("/v1/me"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "SIGN_IN_FAILED");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(input: RegistrationInput) {
    setLoading(true);
    setError(null);
    try {
      await register(input);
      setScreen("login");
      setError("Registration received. Verify your email, then sign in.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "REGISTRATION_FAILED");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await clearSession();
    setMe(null);
    setScreen("login");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand} accessibilityRole="header">FinTrack</Text>
        {loading && <Text>Loading your workspace…</Text>}
        {error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
        {screen === "login" && <LoginForm loading={loading} onLogin={handleLogin} onRegister={() => setScreen("register")} />}
        {screen === "register" && <RegistrationForm loading={loading} onRegister={handleRegister} onCancel={() => setScreen("login")} />}
        {screen === "workspace" && business && (
          <View style={styles.card}>
            <Text style={styles.title}>What should I do next?</Text>
            <Text style={styles.status}>
              Status: {business.verificationStatus}
            </Text>
            {business.verificationStatus === "EMAIL_PENDING" && (
              <ChecklistItem testID="next-email" title="Verify your email" detail="Check your inbox for an expiring verification link." />
            )}
            {business.verificationStatus === "TIN_PENDING" && (
              <ChecklistItem testID="next-profile" title="Review business and tax profile" detail="Confirm the submitted TIN and non-VAT classification." />
            )}
            {business.verificationStatus === "MANUAL_REVIEW" && (
              <ChecklistItem testID="next-review" title="Verification is under review" detail="You can still view limited information while the administrator reviews it." />
            )}
            {business.verificationStatus === "APPROVED" && (
              <ChecklistItem testID="next-record" title="Start your first record" detail="Add a counterparty, sale or expense." />
            )}
          </View>
        )}
        {screen === "workspace" && (
          <TouchableOpacity accessibilityRole="button" style={styles.secondaryButton} onPress={handleLogout}>
            <Text style={styles.secondaryText}>Sign out</Text>
          </TouchableOpacity>
        )}
        <View style={[styles.card, styles.notice]}>
          <Text style={styles.noticeTitle}>Important notice</Text>
          <Text>{disclaimer}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ChecklistItem({ title, detail, testID }: { title: string; detail: string; testID: string }) {
  return (
    <View style={styles.checklistItem} testID={testID}>
      <Text style={styles.checklistTitle}>{title}</Text>
      <Text>{detail}</Text>
      <TouchableOpacity accessibilityRole="button" style={styles.secondaryButton}>
        <Text style={styles.secondaryText}>Open</Text>
      </TouchableOpacity>
    </View>
  );
}

type RegistrationInput = {
  email: string;
  password: string;
  registeredBusinessName: string;
  businessTin: string;
  legalForm: "SOLE_PROPRIETORSHIP" | "PARTNERSHIP" | "NON_VAT_CORPORATION";
  businessAddress: string;
  taxClassification: "NON_VAT";
  contactNumber: string;
  consentVersion: string;
  consentTimestamp: string;
};

function LoginForm({
  loading,
  onLogin,
  onRegister
}: {
  loading: boolean;
  onLogin: (email: string, password: string) => void;
  onRegister: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Sign in</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        testID="login-email"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        autoComplete="password"
        testID="login-password"
      />
      <TouchableOpacity
        accessibilityRole="button"
        style={styles.button}
        disabled={loading}
        onPress={() => onLogin(email.trim(), password)}
        testID="login-submit"
      >
        <Text style={styles.buttonText}>{loading ? "Signing in…" : "Sign in"}</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" style={styles.linkButton} onPress={onRegister}>
        <Text style={styles.secondaryText}>Create a business account</Text>
      </TouchableOpacity>
    </View>
  );
}

function RegistrationForm({
  loading,
  onRegister,
  onCancel
}: {
  loading: boolean;
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
    <View style={styles.card}>
      <Text style={styles.title}>Create account</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password (12+ characters)" secureTextEntry />
      <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} placeholder="Registered business name" />
      <TextInput style={styles.input} value={tin} onChangeText={setTin} placeholder="Business TIN" keyboardType="number-pad" />
      <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Business address" />
      <TextInput style={styles.input} value={contactNumber} onChangeText={setContactNumber} placeholder="Contact number" keyboardType="phone-pad" />
      <TouchableOpacity
        accessibilityRole="button"
        style={styles.button}
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
      >
        <Text style={styles.buttonText}>{loading ? "Creating…" : "Create account"}</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" style={styles.linkButton} onPress={onCancel}>
        <Text style={styles.secondaryText}>Back to sign in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7faf9" },
  container: { padding: 20, gap: 12 },
  brand: { fontSize: 28, fontWeight: "800", color: "#126b48", marginBottom: 8 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#dce7e2" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8, color: "#18382d" },
  status: { marginBottom: 8, color: "#45564f" },
  error: { backgroundColor: "#fff1f1", color: "#8f1d1d", borderRadius: 8, padding: 10 },
  input: { borderWidth: 1, borderColor: "#b8c8c1", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, backgroundColor: "#fff" },
  button: { backgroundColor: "#126b48", borderRadius: 10, padding: 13, alignItems: "center", marginTop: 12 },
  buttonText: { color: "#fff", fontWeight: "700" },
  linkButton: { paddingVertical: 12, alignItems: "center", marginTop: 4 },
  secondaryButton: { borderWidth: 1, borderColor: "#126b48", borderRadius: 8, paddingVertical: 8, alignItems: "center", marginTop: 10 },
  secondaryText: { color: "#126b48", fontWeight: "700" },
  checklistItem: { borderTopWidth: 1, borderTopColor: "#edf2ef", paddingVertical: 12 },
  checklistTitle: { fontWeight: "700", color: "#18382d", marginBottom: 4 },
  notice: { backgroundColor: "#fff8df", borderColor: "#e7d58e" },
  noticeTitle: { fontWeight: "800", marginBottom: 4, color: "#604900" }
});
