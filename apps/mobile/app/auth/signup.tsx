import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';
import { useAuth } from '@/hooks/use-auth';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignupScreen() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const { resolvedScheme } = useThemePreference();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.register.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.register.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.errors.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/auth/login');
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
            <ThemedText type="title" style={styles.title}>{t('auth.register.createYourAccount')}</ThemedText>
            <ThemedText style={styles.subtitle}>{t('auth.register.enterEmailToCreate')}</ThemedText>
          </View>

          <ThemedView style={styles.form}>
            {error ? (
              <View style={[styles.errorContainer, { backgroundColor: `${colors.error}20`, borderColor: `${colors.error}40` }]}>
                <ThemedText style={[styles.errorText, { color: colors.error }]}>{error}</ThemedText>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('auth.register.email')}</ThemedText>
              <ThemedView style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground }]}>
                <TextInput
                  style={[styles.inputText, { color: colors.text }]}
                  placeholder={t('auth.register.emailPlaceholder')}
                  placeholderTextColor={colors.icon}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </ThemedView>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.passwordRow}>
                <View style={styles.passwordInput}>
                  <ThemedText style={styles.label}>{t('auth.register.password')}</ThemedText>
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
                      editable={!loading}
                    />
                  </ThemedView>
                </View>
                <View style={styles.passwordInput}>
                  <ThemedText style={styles.label}>{t('auth.register.confirmPassword')}</ThemedText>
                  <ThemedView style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground }]}>
                    <TextInput
                      style={[styles.inputText, { color: colors.text }]}
                      placeholder="••••••••"
                      placeholderTextColor={colors.icon}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                  </ThemedView>
                </View>
              </View>
              <ThemedText style={[styles.helperText, { color: colors.icon }]}>{t('auth.register.passwordMinLength')}</ThemedText>
            </View>

            <TouchableOpacity 
              style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading || !email || !password || !confirmPassword}
            >
              <ThemedText style={[styles.buttonText, { color: colors.primaryText }]}>
                {loading ? t('auth.register.loading') : t('auth.register.submit')}
              </ThemedText>
            </TouchableOpacity>

            <View style={styles.footer}>
              <ThemedText style={[styles.footerText, { color: colors.icon }]}>{t('auth.register.hasAccount')} </ThemedText>
              <TouchableOpacity onPress={handleBack}>
                <ThemedText style={[styles.linkText, { color: colors.primary }]}>{t('auth.register.loginLink')}</ThemedText>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.skipButton} onPress={() => router.replace('/(tabs)')}>
              <ThemedText style={[styles.skipButtonText, { color: colors.icon }]}>{t('auth.continueWithoutSignUp')}</ThemedText>
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
  passwordRow: {
    flexDirection: 'row',
    gap: 12,
  },
  passwordInput: {
    flex: 1,
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
  helperText: {
    fontSize: 13,
    marginTop: 4,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButton: {
    ...Platform.select({
      web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
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
