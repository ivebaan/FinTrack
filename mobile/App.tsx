import React, { useEffect, useState } from "react";
import * as ExpoSplashScreen from "expo-splash-screen";
import { AppShell } from "./src/components/AppShell";
import { SplashScreen } from "./src/screens/SplashScreen";
import { LandingPage } from "./src/screens/LandingPage";
import { LoginScreen } from "./src/screens/LoginScreen";
import { RegistrationScreen } from "./src/screens/RegistrationScreen";
import { WorkspaceScreen } from "./src/screens/WorkspaceScreen";
import { apiRequest, clearSession, login, register, saveSession } from "./src/api";
import type { Me, RegistrationInput } from "./src/types";

type Screen = "landing" | "login" | "register" | "workspace";

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("landing");
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function prepareApp() {
      await ExpoSplashScreen.preventAutoHideAsync();
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await ExpoSplashScreen.hideAsync();
      if (isMounted) setAppReady(true);
    }

    prepareApp().catch(() => {
      if (isMounted) setAppReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!appReady) return <SplashScreen />;

  async function handleLogin(email: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const session = await login(email, password);
      await saveSession(session.accessToken, session.refreshToken);
      setMe(await apiRequest("/v1/me"));
      setScreen("workspace");
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
    setScreen("landing");
  }

  return (
    <AppShell>
      {screen === "landing" && (
        <LandingPage
          onLogin={() => setScreen("login")}
          onRegister={() => setScreen("register")}
        />
      )}
      {screen === "login" && (
        <LoginScreen
          loading={loading}
          error={error}
          onLogin={handleLogin}
          onRegister={() => setScreen("register")}
          onBack={() => setScreen("landing")}
        />
      )}
      {screen === "register" && (
        <RegistrationScreen
          loading={loading}
          error={error}
          onRegister={handleRegister}
          onCancel={() => setScreen("landing")}
        />
      )}
      {screen === "workspace" && (
        <WorkspaceScreen me={me} onLogout={handleLogout} />
      )}
    </AppShell>
  );
}
