import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signInUser } from '../../lib/auth';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { ThemeSwitcher } from '../../components/ThemeSwitcher';
import { Flame, Shield, ArrowRight, Sparkles } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { initializeAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    const { data, error } = await signInUser(email, password);
    setLoading(false);

    if (error) {
      setErrorMessage(error.message || 'Failed to sign in. Check your credentials.');
    } else {
      await initializeAuth();
      router.replace('/(tabs)');
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    const { data, error } = await signInUser('demo@challengr.app', 'password123');
    setLoading(false);
    if (!error) {
      await initializeAuth();
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View style={styles.brandBadge}>
            <Flame color={theme.accent} size={24} />
            <Text style={[styles.brandName, { color: theme.textPrimary }]}>Challengr</Text>
          </View>
          <ThemeSwitcher />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Log in to continue tracking your daily progress & streaks.
          </Text>
        </View>

        {/* Form Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
        >
          {errorMessage ? (
            <View style={[styles.errorBox, { backgroundColor: theme.dangerBg }]}>
              <Text style={[styles.errorText, { color: theme.danger }]}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.textPrimary,
                },
              ]}
              placeholder="alex@example.com"
              placeholderTextColor={theme.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.textPrimary,
                },
              ]}
              placeholder="••••••••"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.accent }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <View style={styles.btnContent}>
                <Text style={styles.primaryBtnText}>Sign In</Text>
                <ArrowRight color="#FFF" size={18} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.demoButton, { backgroundColor: theme.accentBg, borderColor: theme.accentBorder }]}
            onPress={handleDemoLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <View style={styles.btnContent}>
              <Sparkles color={theme.accentText} size={16} />
              <Text style={[styles.demoBtnText, { color: theme.accentText }]}>Quick Demo Access</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer Navigation */}
        <View style={styles.footerRow}>
          <Text style={{ color: theme.textMuted }}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={[styles.linkText, { color: theme.accent }]}> Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroSection: {
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
  },
  primaryButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  demoButton: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
  },
  demoBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  linkText: {
    fontWeight: '700',
  },
});
