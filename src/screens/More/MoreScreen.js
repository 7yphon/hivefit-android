import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Screen, Header } from '../../components/Screen';
import { colors, spacing, font } from '../../theme';

const MENU = [
  { label: 'Plate Calculator', icon: '🏋️', screen: 'PlateCalculator', tab: 'Workout' },
  { label: 'Profiles', icon: '👤', screen: 'ProfileSettings', tab: null },
];

export default function MoreScreen({ navigation }) {
  return (
    <Screen>
      <Header title="More" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {MENU.map(item => (
          <TouchableOpacity
            key={item.label}
            style={styles.row}
            onPress={() => {
              if (item.tab) {
                navigation.navigate(item.tab, { screen: item.screen });
              } else {
                navigation.navigate(item.screen);
              }
            }}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.version}>HiveFit v0.1.0 — Phase 1</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.m, paddingBottom: 40 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 10,
    padding: spacing.m, marginBottom: spacing.s,
  },
  icon: { fontSize: 20, marginRight: spacing.m },
  label: { flex: 1, color: colors.text, fontSize: font.size.m },
  arrow: { color: colors.textSub, fontSize: 22 },
  version: { color: colors.textMuted, fontSize: font.size.xs, textAlign: 'center', marginTop: spacing.xl },
});
