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
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen
              name="race-advanced"
              options={{
                title: 'Race zones',
                headerStyle: { backgroundColor: '#050816' },
                headerTintColor: '#38bdf8',
                headerTitleStyle: { color: '#fff', fontWeight: '700' as const },
                presentation: 'modal'
              }}
            />
          </Stack>
        </AuthProvider>
      </RaceSettingsProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
