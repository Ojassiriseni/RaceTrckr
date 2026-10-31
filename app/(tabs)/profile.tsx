import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

export default function ProfileTab() {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Enter email and password.');
      return;
    }
    setBusy(true);
    try {
      const res =
        mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
      if (res.ok) {
        setPassword('');
        Alert.alert(
          mode === 'signup' ? 'Welcome' : 'Signed in',
          'Your race data will be synced to your RaceTrckr account.'
        );
      } else {
        Alert.alert('Could not continue', res.error);
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (user) {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>Crew access</Text>
          <Text style={styles.title}>Driver profile</Text>

          <View style={styles.panel}>
            <Text style={styles.label}>Signed in as</Text>
            <Text style={styles.emailText}>{user.email}</Text>
            <Text style={styles.hint}>
              Your account and runs are synced through Supabase. Export from the Data tab for a backup.
            </Text>
          </View>

          <TouchableOpacity onPress={() => signOut()} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Crew access</Text>
        <Text style={styles.title}>Driver profile</Text>
        <Text style={styles.subtitle}>
          {mode === 'signin'
            ? 'Sign in to save completed races and keep a personal lap history.'
            : 'Create an account to sync your race data to the cloud.'}
        </Text>

        <View style={styles.formCard}>
          <TextInput
            placeholder="Email"
            placeholderTextColor={theme.colors.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={styles.input}
          />
          <TextInput
            placeholder="Password (min 6 characters)"
            placeholderTextColor={theme.colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          <TouchableOpacity
            onPress={submit}
            disabled={busy}
            style={[styles.primaryBtn, busy && styles.primaryBtnDisabled]}
          >
            {busy ? (
              <ActivityIndicator color={theme.colors.ink} />
            ) : (
              <Text style={styles.primaryBtnText}>
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')} style={styles.linkWrap}>
            <Text style={styles.linkText}>
              {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 32,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -0.8,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    marginBottom: 20,
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    padding: 18,
  },
  input: {
    backgroundColor: theme.colors.ink,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: theme.colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 15,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: theme.colors.ink,
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  linkWrap: {
    marginTop: 16,
  },
  linkText: {
    color: theme.colors.primary,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
  },
  panel: {
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },
  label: {
    color: theme.colors.muted,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  emailText: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  hint: {
    color: theme.colors.muted,
    fontSize: 13,
    marginTop: 12,
    lineHeight: 18,
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: theme.colors.text,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
