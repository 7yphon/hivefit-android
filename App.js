import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { getDb } from './src/database/db';
import { useUserStore } from './src/store/userStore';
import { colors } from './src/theme';

export default function App() {
  const [ready, setReady] = useState(false);
  const { loadUsers } = useUserStore();

  useEffect(() => {
    async function init() {
      await getDb();
      await loadUsers();
      setReady(true);
    }
    init();
  }, []);

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
