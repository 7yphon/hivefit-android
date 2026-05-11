import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { getDb, getActiveUser } from './src/database/db';
import { useUserStore } from './src/store/userStore';
import { useWorkoutStore } from './src/store/workoutStore';
import { colors } from './src/theme';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState(null);
  const { loadUsers } = useUserStore();

  useEffect(() => {
    async function bootstrap() {
      try {
        await getDb();
        await loadUsers();
        const activeUser = await getActiveUser();
        if (activeUser) {
          await useWorkoutStore.getState().resumeWorkout(activeUser.id);
        }
        setDbReady(true);
      } catch (e) {
        console.error('Bootstrap failed:', e);
        setError(String(e));
      }
    }
    bootstrap();
  }, []);

  if (error) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#0c0900', padding: 20 }}>
        <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: 'bold', marginTop: 60 }}>Init Error</Text>
        <Text style={{ color: '#e0e0e0', fontSize: 13, marginTop: 12 }}>{error}</Text>
      </ScrollView>
    );
  }

  if (!dbReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppNavigator />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
