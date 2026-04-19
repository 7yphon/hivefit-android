import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { getDb } from './src/database/db';
import { useUserStore } from './src/store/userStore';
import { colors } from './src/theme';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const { loadUsers } = useUserStore();

  useEffect(() => {
    async function init() {
      try {
        await getDb();
        await loadUsers();
        setReady(true);
      } catch (e) {
        console.error('Init failed:', e);
        setError(String(e));
      }
    }
    init();
  }, []);

  if (error) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#0f0f0f', padding: 20 }}>
        <Text style={{ color: '#f04040', fontSize: 16, fontWeight: 'bold', marginTop: 60 }}>Init Error</Text>
        <Text style={{ color: '#f0f0f0', fontSize: 13, marginTop: 12 }}>{error}</Text>
      </ScrollView>
    );
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
