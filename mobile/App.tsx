import React, { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { apiRequest } from "./src/api";

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

  useEffect(() => {
    apiRequest("/v1/me")
      .then(setMe)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const business = me?.businesses[0];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand} accessibilityRole="header">FinTrack</Text>
        {loading && <Text>Loading your workspace…</Text>}
        {error && (
          <View style={styles.card} accessibilityRole="alert">
            <Text style={styles.title}>Sign in required</Text>
            <Text>{error}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Open sign in"
              style={styles.button}
              testID="open-sign-in"
              onPress={() => setError("Sign-in screen is ready for API integration")}
            >
              <Text style={styles.buttonText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        )}
        {business && (
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7faf9" },
  container: { padding: 20, gap: 12 },
  brand: { fontSize: 28, fontWeight: "800", color: "#126b48", marginBottom: 8 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#dce7e2" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8, color: "#18382d" },
  status: { marginBottom: 8, color: "#45564f" },
  button: { backgroundColor: "#126b48", borderRadius: 10, padding: 13, alignItems: "center", marginTop: 12 },
  buttonText: { color: "#fff", fontWeight: "700" },
  secondaryButton: { borderWidth: 1, borderColor: "#126b48", borderRadius: 8, paddingVertical: 8, alignItems: "center", marginTop: 10 },
  secondaryText: { color: "#126b48", fontWeight: "700" },
  checklistItem: { borderTopWidth: 1, borderTopColor: "#edf2ef", paddingVertical: 12 },
  checklistTitle: { fontWeight: "700", color: "#18382d", marginBottom: 4 },
  notice: { backgroundColor: "#fff8df", borderColor: "#e7d58e" },
  noticeTitle: { fontWeight: "800", marginBottom: 4, color: "#604900" }
});
