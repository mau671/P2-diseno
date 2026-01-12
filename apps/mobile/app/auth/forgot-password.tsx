import { useState } from 'react';
import { StyleSheet, ScrollView, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';
import { useThemePreference } from '@/context/theme-preference';
import { Colors } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const { resolvedScheme } = useThemePreference();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.errors.resetFailed'));
    } finally {
      setLoading(false);
    }
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
            <ThemedText type="title" style={styles.title}>{t('auth.forgot.title')}</ThemedText>
            <ThemedText style={styles.subtitle}>{t('auth.forgot.description')}</ThemedText>
          </View>

          <ThemedView style={styles.form}>
            {error ? (
              <View style={[styles.errorContainer, { backgroundColor: `${colors.error}20`, borderColor: `${colors.error}40` }]}>
                <ThemedText style={[styles.errorText, { color: colors.error }]}>{error}</ThemedText>
              </View>
            ) : null}

            {success ? (
              <View style={[styles.successContainer, { backgroundColor: `${colors.success}20`, borderColor: `${colors.success}40` }]}>
                <ThemedText style={[styles.successText, { color: colors.success }]}>{t('auth.forgot.success')}</ThemedText>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('auth.forgot.email')}</ThemedText>
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
                  editable={!loading && !success}
                />
              </ThemedView>
            </View>

            <TouchableOpacity 
              style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading || !email || success}
            >
              <ThemedText style={[styles.buttonText, { color: colors.primaryText }]}>
                {loading ? t('auth.forgot.loading') : t('auth.forgot.submit')}
              </ThemedText>
            </TouchableOpacity>

            <View style={styles.footer}>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <ThemedText style={[styles.linkText, { color: colors.primary }]}>{t('auth.forgot.backToLogin')}</ThemedText>
              </TouchableOpacity>
            </View>
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
  successContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  successText: {
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
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 8,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
