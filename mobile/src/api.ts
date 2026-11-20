import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiRequest(path: string, options: RequestInit = {}) {
  const accessToken = await SecureStore.getItemAsync("fintrack_access_token");
  const tenantId = await SecureStore.getItemAsync("fintrack_active_tenant");
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (tenantId) headers.set("X-Tenant-ID", tenantId);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const body = await response.json().catch(() => ({ error: "INTERNAL_ERROR" }));
  if (!response.ok) throw new Error(body.error ?? "REQUEST_FAILED");
  return body as any;
}

export async function saveSession(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync("fintrack_access_token", accessToken);
  await SecureStore.setItemAsync("fintrack_refresh_token", refreshToken);
}

export async function clearSession() {
  await SecureStore.deleteItemAsync("fintrack_access_token");
  await SecureStore.deleteItemAsync("fintrack_refresh_token");
  await SecureStore.deleteItemAsync("fintrack_active_tenant");
}
