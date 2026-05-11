import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { colors } from '../theme';
import { useUserStore } from '../store/userStore';
import SetupScreen from '../screens/Auth/SetupScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import WorkoutListScreen from '../screens/Workout/WorkoutListScreen';
import ActiveWorkoutScreen from '../screens/Workout/ActiveWorkoutScreen';
import ExerciseLibraryScreen from '../screens/Workout/ExerciseLibraryScreen';
import WorkoutDetailScreen from '../screens/Workout/WorkoutDetailScreen';
import PlateCalculatorScreen from '../screens/Workout/PlateCalculatorScreen';
import ProgressScreen from '../screens/Progress/ProgressScreen';
import ExerciseProgressScreen from '../screens/Progress/ExerciseProgressScreen';
import BodyScreen from '../screens/Body/BodyScreen';
import MoreScreen from '../screens/More/MoreScreen';
import ProfileSettingsScreen from '../screens/More/ProfileSettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ name, focused }) {
  const icons = {
    Home: '🏠', Workout: '🏋️', Progress: '📈', Body: '⚖️', More: '☰',
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icons[name] || '•'}</Text>
  );
}

function WorkoutStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkoutList" component={WorkoutListScreen} />
      <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
      <Stack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} />
      <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
      <Stack.Screen name="PlateCalculator" component={PlateCalculatorScreen} />
    </Stack.Navigator>
  );
}

function ProgressStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProgressHome" component={ProgressScreen} />
      <Stack.Screen name="ExerciseProgress" component={ExerciseProgressScreen} />
    </Stack.Navigator>
  );
}

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreHome" component={MoreScreen} />
      <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { users, loadUsers } = useUserStore();

  useEffect(() => { loadUsers(); }, []);

  if (users.length === 0) {
    return (
      <NavigationContainer>
        <SetupScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingBottom: 4,
            paddingTop: 4,
            marginBottom: 20,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
          tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Workout" component={WorkoutStack} />
        <Tab.Screen name="Progress" component={ProgressStack} />
        <Tab.Screen name="Body" component={BodyScreen} />
        <Tab.Screen name="More" component={MoreStack} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
