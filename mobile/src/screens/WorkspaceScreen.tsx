import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card } from "../components/Card";
import type { Me } from "../types";

export function WorkspaceScreen({ me, onLogout }: { me: Me | null; onLogout: () => void }) {
  const business = me?.businesses[0];

  if (!business) {
    return (
      <Card>
        <Text style={styles.title}>Workspace</Text>
        <Text>No business profile is available for this account.</Text>
        <TouchableOpacity accessibilityRole="button" style={styles.logout} onPress={onLogout}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <Card>
        <Text style={styles.title}>What should I do next?</Text>
        <Text style={styles.status}>Status: {business.verificationStatus}</Text>
        {business.verificationStatus === "EMAIL_PENDING" && (
          <ChecklistItem title="Verify your email" detail="Check your inbox for an expiring verification link." />
        )}
        {business.verificationStatus === "TIN_PENDING" && (
          <ChecklistItem title="Review business and tax profile" detail="Confirm the submitted TIN and non-VAT classification." />
        )}
        {business.verificationStatus === "MANUAL_REVIEW" && (
          <ChecklistItem title="Verification is under review" detail="You can still view limited information while the administrator reviews it." />
        )}
        {business.verificationStatus === "APPROVED" && (
          <ChecklistItem title="Start your first record" detail="Add a counterparty, sale or expense." />
        )}
      </Card>
      <TouchableOpacity accessibilityRole="button" style={styles.logout} onPress={onLogout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

function ChecklistItem({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.item}>
      <Text style={styles.itemTitle}>{title}</Text>
      <Text>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8, color: "#18382d" },
  status: { marginBottom: 8, color: "#45564f" },
  item: { borderTopWidth: 1, borderTopColor: "#edf2ef", paddingVertical: 12 },
  itemTitle: { fontWeight: "700", color: "#18382d", marginBottom: 4 },
  logout: { borderWidth: 1, borderColor: "#126b48", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  logoutText: { color: "#126b48", fontWeight: "700" }
});
