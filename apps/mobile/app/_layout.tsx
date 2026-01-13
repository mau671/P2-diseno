import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import './i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemedView } from '@/components/themed-view';
import { AuthProvider } from '@/context/auth-context';
import { ThemePreferenceProvider, useThemePreference } from '@/context/theme-preference';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

const queryClient = new QueryClient();

export const unstable_settings = {
  anchor: '(tabs)',
};

function LoadingScreen() {
  const systemScheme = useColorScheme() ?? 'light';
  const colors = Colors[systemScheme];
  return (
    <ThemeProvider value={systemScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ThemedView style={{ flex: 1, backgroundColor: colors.background }} />
    </ThemeProvider>
  );
}

// ✅ Fix: children opcional para que <ThemeInitializer /> no obligue a pasar hijos
function ThemeInitializer({ children }: React.PropsWithChildren) {
  const { resolvedScheme, loaded } = useThemePreference();

  if (!loaded) {
    return <LoadingScreen />;
  }

  const customTheme = resolvedScheme === 'dark' 
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: Colors.dark.background,
          card: Colors.dark.card,
          text: Colors.dark.text,
          border: Colors.dark.cardBorder,
          primary: Colors.dark.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: Colors.light.background,
          card: Colors.light.card,
          text: Colors.light.text,
          border: Colors.light.cardBorder,
          primary: Colors.light.primary,
        },
      };

  return (
    <ThemeProvider value={customTheme}>
      <StatusBar 
        style={resolvedScheme === 'dark' ? 'light' : 'dark'} 
        backgroundColor={Colors[resolvedScheme].background}
      />
      <AuthProviderWrapper />
    </ThemeProvider>
  );
}

function AuthProviderWrapper() {
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Stack 
          screenOptions={{ 
            headerShown: false,
            animation: 'none',
            contentStyle: {
              backgroundColor: colors.background,
            },
          }}
        >
          <Stack.Screen 
            name="(tabs)" 
            options={{
              animation: 'none',
            }}
          />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
          <Stack.Screen 
            name="auth/login" 
            options={{
              animation: 'none',
            }}
          />
          <Stack.Screen 
            name="auth/signup"
            options={{
              animation: 'none',
            }}
          />
          <Stack.Screen 
            name="auth/forgot-password"
            options={{
              animation: 'none',
            }}
          />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <ThemeInitializer>
        {/* Content moved to AuthProviderWrapper */}
      </ThemeInitializer>
    </ThemePreferenceProvider>
  );
}
