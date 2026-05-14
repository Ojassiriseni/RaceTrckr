import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

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
        mode === 'signin'
          ? await signIn(email, password)
          : await signUp(email, password);
      if (res.ok) {
        setPassword('');
        Alert.alert(mode === 'signup' ? 'Welcome' : 'Signed in', 'Your race data will be saved to this device.');
      } else {
        Alert.alert('Could not continue', res.error);
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={screen}>
        <ActivityIndicator color="#38bdf8" size="large" />
      </View>
    );
  }

  if (user) {
    return (
      <View style={[screen, pad]}>
        <Text style={title}>Profile</Text>
        <View style={card}>
          <Text style={label}>Signed in as</Text>
          <Text style={emailText}>{user.email}</Text>
          <Text style={hint}>
            Accounts and runs are stored on this device. Export from the Data tab
            for a backup.
          </Text>
        </View>
        <TouchableOpacity onPress={() => signOut()} style={logoutBtn}>
          <Text style={logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[screen, pad]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={title}>Profile</Text>
      <Text style={sub}>
        {mode === 'signin'
          ? 'Sign in to save completed races.'
          : 'Create an account (stored on this device).'}
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#64748b"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        style={input}
      />
      <TextInput
        placeholder="Password (min 6 characters)"
        placeholderTextColor="#64748b"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={input}
      />

      <TouchableOpacity
        onPress={submit}
        disabled={busy}
        style={[primaryBtn, busy && { opacity: 0.6 }]}
      >
        {busy ? (
          <ActivityIndicator color="#0f172a" />
        ) : (
          <Text style={primaryBtnText}>
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        style={{ marginTop: 16 }}
      >
        <Text style={link}>
          {mode === 'signin'
            ? 'Need an account? Sign up'
            : 'Already have an account? Sign in'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const screen = { flex: 1 as const, backgroundColor: '#050816' };
const pad = { padding: 20, paddingTop: 56 };
const title = {
  color: '#fff',
  fontSize: 28,
  fontWeight: '800' as const,
  marginBottom: 8
};
const sub = { color: '#94a3b8', fontSize: 15, marginBottom: 20, lineHeight: 22 };
const input = {
  backgroundColor: '#0f172a',
  borderRadius: 12,
  padding: 14,
  color: '#fff',
  marginBottom: 12,
  borderWidth: 1,
  borderColor: '#1e293b'
};
const primaryBtn = {
  backgroundColor: '#38bdf8',
  paddingVertical: 15,
  borderRadius: 14,
  alignItems: 'center' as const,
  marginTop: 8
};
const primaryBtnText = { color: '#0f172a', fontWeight: '800' as const, fontSize: 16 };
const link = { color: '#38bdf8', textAlign: 'center' as const, fontSize: 15 };
const card = {
  backgroundColor: '#0f172a',
  borderRadius: 16,
  padding: 18,
  borderWidth: 1,
  borderColor: '#1e293b',
  marginBottom: 20
};
const label = { color: '#64748b', fontSize: 12, marginBottom: 4 };
const emailText = { color: '#fff', fontSize: 18, fontWeight: '700' as const };
const hint = { color: '#64748b', fontSize: 13, marginTop: 12, lineHeight: 18 };
const logoutBtn = {
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: '#475569',
  paddingVertical: 14,
  borderRadius: 14,
  alignItems: 'center' as const
};
const logoutText = { color: '#e2e8f0', fontWeight: '700' as const };
