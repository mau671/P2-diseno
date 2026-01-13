import { useState } from 'react';
import { StyleSheet, ScrollView, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { FontAwesome } from '@expo/vector-icons';
import { useThemePreference } from '@/context/theme-preference';
import { Colors } from '@/constants/theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { login, loginWithGoogle } = useAuth();
  const { resolvedScheme } = useThemePreference();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.errors.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      await loginWithGoogle();
      router.replace('/(tabs)');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.errors.loginFailed'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const colors = Colors[resolvedScheme];

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.keyboardView, { backgroundColor: colors.background }]}
    >
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>{t('auth.login.welcomeBack')}</ThemedText>
            <ThemedText style={styles.subtitle}>{t('auth.login.accessAccount')}</ThemedText>
          </View>

          <ThemedView style={styles.form}>
            {error ? (
              <View style={[styles.errorContainer, { backgroundColor: `${colors.error}20`, borderColor: `${colors.error}40` }]}>
                <ThemedText style={[styles.errorText, { color: colors.error }]}>{error}</ThemedText>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('auth.login.email')}</ThemedText>
              <ThemedView style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground }]}>
                <TextInput
                  style={[styles.inputText, { color: colors.text }]}
                  placeholder={t('auth.login.emailPlaceholder')}
                  placeholderTextColor={colors.icon}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading && !googleLoading}
                />
              </ThemedView>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('auth.login.password')}</ThemedText>
              <ThemedView style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground }]}>
                <TextInput
                  style={[styles.inputText, { color: colors.text }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.icon}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading && !googleLoading}
                />
              </ThemedView>
              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={() => router.push('/auth/forgot-password')}
              >
                <ThemedText style={[styles.forgotPasswordText, { color: colors.primary }]}>{t('auth.login.forgotPassword')}</ThemedText>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary }, (loading || googleLoading) && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading || googleLoading || !email || !password}
            >
              <ThemedText style={[styles.buttonText, { color: colors.primaryText }]}>
                {loading ? t('auth.login.loading') : t('auth.login.submit')}
              </ThemedText>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
              <ThemedText style={[styles.dividerText, { color: colors.icon }]}>{t('auth.login.orContinueWith')}</ThemedText>
              <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
            </View>

            <TouchableOpacity 
              style={[styles.button, styles.googleButton, { borderColor: colors.divider, backgroundColor: colors.card }, (loading || googleLoading) && styles.buttonDisabled]}
              onPress={handleGoogleLogin}
              disabled={loading || googleLoading}
            >
              <FontAwesome name="google" size={20} color={colors.text} style={styles.googleIcon} />
              <ThemedText style={[styles.googleButtonText, { color: colors.text }]}>
                {googleLoading ? t('common.loading') : t('auth.login.loginWithGoogle')}
              </ThemedText>
            </TouchableOpacity>

            <View style={styles.footer}>
              <ThemedText style={[styles.footerText, { color: colors.icon }]}>{t('auth.login.noAccount')} </ThemedText>
              <TouchableOpacity onPress={() => router.push('/auth/signup')}>
                <ThemedText style={[styles.linkText, { color: colors.primary }]}>{t('auth.login.registerLink')}</ThemedText>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <ThemedText style={[styles.skipButtonText, { color: colors.icon }]}>Continue without signing in</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
  },
  form: {
    gap: 20,
  },
  errorContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  errorText: {
    fontSize: 14,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
  },
  inputText: {
    fontSize: 16,
    padding: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButton: {
    borderWidth: 1,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
