import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/auth-context';
import { RaceSettingsProvider } from '@/contexts/race-settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

function HomeHeaderButton() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/')}
      style={styles.homeButton}
      accessibilityRole="button"
      accessibilityLabel="Go to home"
    >
      <Text style={styles.homeButtonText}>Home</Text>
    </Pressable>
  );
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <RaceSettingsProvider>
        <AuthProvider>
          <Stack
            screenOptions={({ route }) => ({
              headerShown: route.name !== '(tabs)',
              headerStyle: { backgroundColor: '#090B0F' },
              headerTintColor: '#C7FF35',
              headerTitleStyle: { color: '#F4F6FA', fontWeight: '700' as const },
              headerBackTitle: 'Back',
              headerBackVisible: true,
              headerRight: route.name !== '(tabs)' ? () => <HomeHeaderButton /> : undefined,
              contentStyle: { backgroundColor: '#090B0F' },
            })}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen
              name="race-advanced"
              options={{
                title: 'Race zones',
                headerShown: true,
                presentation: 'modal',
              }}
            />
          </Stack>
        </AuthProvider>
      </RaceSettingsProvider>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  homeButton: {
    backgroundColor: '#121B23',
    borderWidth: 1,
    borderColor: '#2A3745',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 0,
  },
  homeButtonText: {
    color: '#ff0000',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
