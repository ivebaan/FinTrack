import React, { type PropsWithChildren } from "react";
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";

export function AppShell({ children, landingOnly = false, authOnly = false }: PropsWithChildren<{ landingOnly?: boolean; authOnly?: boolean }>) {
  if (authOnly) {
    return (
      <SafeAreaView style={styles.safeAuth}>
        <StatusBar barStyle="dark-content" />
        <ScrollView
          style={styles.authScroll}
          contentContainerStyle={styles.authContainer}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (landingOnly) {
    return (
      <SafeAreaView style={styles.safeLanding}>
        <StatusBar barStyle="dark-content" />
        <ScrollView
          style={styles.landingScroll}
          contentContainerStyle={styles.landingContainer}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand} accessibilityRole="header">FinTrack</Text>
        {children}
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Important notice</Text>
          <Text>
            FinTrack supports bookkeeping and compliance tracking. It does not guarantee tax compliance or provide tax advice.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7faf9" },
  safeAuth: { flex: 1, backgroundColor: "#fff" },
  authScroll: { flex: 1, backgroundColor: "#fff" },
  authContainer: { flexGrow: 1 },
  safeLanding: { flex: 1, backgroundColor: "#fff" },
  landingScroll: { flex: 1, backgroundColor: "#fff" },
  landingContainer: { flexGrow: 1, alignItems: "center" },
  container: { padding: 20, gap: 12 },
  brand: { fontSize: 28, fontWeight: "800", color: "#126b48", marginBottom: 8 },
  notice: {
    backgroundColor: "#fff8df",
    borderColor: "#e7d58e",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16
  },
  noticeTitle: { fontWeight: "800", marginBottom: 4, color: "#604900" }
});
