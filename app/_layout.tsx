import { Redirect, Stack, useSegments } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';

export default function RootLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>QR</Text>
        </View>

        <Text style={styles.loadingTitle}>QR Attendance</Text>

        <ActivityIndicator
          size="small"
          color={COLORS.accent}
          style={styles.loader}
        />

        <Text style={styles.loadingText}>
          Loading your account...
        </Text>
      </View>
    );
  }

  const path = segments?.[0];
  const inAuthGroup = path === 'login' || path === 'register';
  const inTabsGroup = path === '(tabs)';

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!session && inTabsGroup && <Redirect href="/login" />}
      {session && inAuthGroup && <Redirect href="/(tabs)" />}

      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },

  loadingLogo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.accent,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },

  loadingLogoText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.card,
  },

  loadingTitle: {
    marginTop: 16,
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  loader: {
    marginTop: 20,
  },

  loadingText: {
    marginTop: 9,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
