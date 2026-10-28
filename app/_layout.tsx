import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/auth-context';
import { RaceSettingsProvider } from '@/contexts/race-settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#090B0F' },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen
              name="race-advanced"
              options={{
                title: 'Race zones',
                headerShown: true,
                headerStyle: { backgroundColor: '#090B0F' },
                headerTintColor: '#C7FF35',
                headerTitleStyle: { color: '#F4F6FA', fontWeight: '700' as const },
                presentation: 'modal'
              }}
            />
          </Stack>
        </AuthProvider>
      </RaceSettingsProvider>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
