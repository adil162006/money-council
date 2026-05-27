import React from "react";
import { Redirect } from "expo-router";
import { useAuthStore } from "../store/authStore";

export default function Index() {
  const token = useAuthStore(state => state.token);
  const isProfileCompleted = useAuthStore(state => state.isProfileCompleted);

  if (!token) {
    // No active session -> Show Auth Stack (starts at welcome)
    return <Redirect href="/auth/welcome" />;
  }

  if (!isProfileCompleted) {
    // Authenticated but profile is not completed -> Onboarding Stack
    return <Redirect href="/onboarding/complete-profile" />;
  }

  // Authenticated + Onboarded -> App Home (bottom tabs)
  return <Redirect href="/(tabs)/dashboard" />;
}
