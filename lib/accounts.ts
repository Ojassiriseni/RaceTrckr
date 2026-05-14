import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const ACCOUNTS_KEY = 'racetrckr_accounts_v1';
const SESSION_KEY = 'racetrckr_session_v1';

export type StoredAccount = {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: number;
};

export type Session = { userId: string; email: string };

async function hashPassword(password: string, salt: string) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`
  );
}

async function readAccounts(): Promise<StoredAccount[]> {
  const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAccounts(accounts: StoredAccount[]) {
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export async function getSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Session;
    if (s?.userId && s?.email) return s;
    return null;
  } catch {
    return null;
  }
}

export async function signUp(
  email: string,
  password: string
): Promise<{ ok: true; session: Session } | { ok: false; error: string }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes('@') || trimmed.length < 5) {
    return { ok: false, error: 'Enter a valid email' };
  }
  if (password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters' };
  }
  const accounts = await readAccounts();
  if (accounts.some((a) => a.email === trimmed)) {
    return { ok: false, error: 'That email is already registered' };
  }
  const id = Crypto.randomUUID();
  const salt = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${Date.now()}:${Math.random()}:${id}`
  );
  const passwordHash = await hashPassword(password, salt);
  accounts.push({
    id,
    email: trimmed,
    passwordHash,
    salt,
    createdAt: Date.now()
  });
  await writeAccounts(accounts);
  const session: Session = { userId: id, email: trimmed };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { ok: true, session };
}

export async function signIn(
  email: string,
  password: string
): Promise<{ ok: true; session: Session } | { ok: false; error: string }> {
  const trimmed = email.trim().toLowerCase();
  const accounts = await readAccounts();
  const acc = accounts.find((a) => a.email === trimmed);
  if (!acc) {
    return { ok: false, error: 'No account for this email' };
  }
  const h = await hashPassword(password, acc.salt);
  if (h !== acc.passwordHash) {
    return { ok: false, error: 'Incorrect password' };
  }
  const session: Session = { userId: acc.id, email: acc.email };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { ok: true, session };
}

export async function signOut() {
  await AsyncStorage.removeItem(SESSION_KEY);
}
