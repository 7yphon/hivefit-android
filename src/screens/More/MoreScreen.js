import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Screen, Header } from '../../components/Screen';
import { useUserStore } from '../../store/userStore';
import { colors, spacing, font } from '../../theme';

const MENU = [
  { label: 'Plate Calculator', icon: '🏋️', screen: 'PlateCalculator', tab: 'Workout' },
  { label: 'Profiles', icon: '👤', screen: 'ProfileSettings', tab: null },
];

export default function MoreScreen({ navigation }) {
  const { activeUser } = useUserStore();

  return (
    <Screen>
      <Header title="More" />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Active profile card */}
        {activeUser && (
          <TouchableOpacity style={styles.profileCard} onPress={() => navigation.navigate('ProfileSettings')}>
            <View style={[styles.avatar, { backgroundColor: activeUser.avatar_color || colors.primary }]}>
              <Text style={styles.avatarText}>{activeUser.name[0]}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{activeUser.name}</Text>
              {activeUser.openhive_username
                ? <Text style={styles.profileSub}>OpenHive: {activeUser.openhive_username}</Text>
                : <Text style={[styles.profileSub, { color: colors.textMuted }]}>Tap to link OpenHive account</Text>
              }
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}

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
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 10,
    padding: spacing.m, marginBottom: spacing.l,
    borderWidth: 1, borderColor: colors.primary + '44',
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: spacing.m },
  avatarText: { color: colors.bg, fontSize: font.size.l, fontWeight: font.weight.bold },
  profileInfo: { flex: 1 },
  profileName: { color: colors.primary, fontSize: font.size.l, fontWeight: font.weight.bold },
  profileSub: { color: colors.textSub, fontSize: font.size.xs, marginTop: 2 },
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
