import * as SecureStore from 'expo-secure-store';

export async function saveUserToken(userId, token) {
  await SecureStore.setItemAsync(`openhive_token_${userId}`, token);
}

export async function loadUserToken(userId) {
  return SecureStore.getItemAsync(`openhive_token_${userId}`);
}

export async function clearUserToken(userId) {
  await SecureStore.deleteItemAsync(`openhive_token_${userId}`);
}

export async function loginToOpenHive(url, username, password) {
  const base = url.replace(/\/$/, '');
  const res = await fetch(`${base}/api/mobile-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Login failed (${res.status})`);
  if (!data.token) throw new Error('No token in response');
  return data.token;
}
