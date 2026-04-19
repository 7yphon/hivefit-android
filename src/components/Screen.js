import React from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, font } from '../theme';

export function Screen({ children, style }) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, style]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      {children}
    </SafeAreaView>
  );
}

export function Header({ title, subtitle, right, onBack, navigation }) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
      ) : <View style={styles.back} />}
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSub}>{subtitle}</Text> : null}
      </View>
      <View style={styles.headerRight}>{right || null}</View>
    </View>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({ label, onPress, variant = 'primary', disabled, style }) {
  const bg = variant === 'primary' ? colors.primary
           : variant === 'danger' ? colors.danger
           : variant === 'ghost' ? 'transparent'
           : colors.card;
  const textColor = variant === 'primary' ? colors.bg
                  : variant === 'ghost' ? colors.textSub
                  : colors.text;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, { backgroundColor: bg }, disabled && styles.btnDisabled, style]}
    >
      <Text style={[styles.btnText, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Pill({ label, color, style }) {
  return (
    <View style={[styles.pill, { backgroundColor: color || colors.card }, style]}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.m, paddingVertical: spacing.s,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  back: { width: 40, alignItems: 'flex-start' },
  backText: { fontSize: 28, color: colors.text, lineHeight: 32 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: colors.text, fontSize: font.size.l, fontWeight: font.weight.semibold },
  headerSub: { color: colors.textSub, fontSize: font.size.s, marginTop: 1 },
  headerRight: { width: 40, alignItems: 'flex-end' },
  card: {
    backgroundColor: colors.card, borderRadius: 12,
    padding: spacing.m, marginBottom: spacing.m,
  },
  btn: {
    borderRadius: 10, paddingVertical: 13, paddingHorizontal: spacing.m,
    alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: font.size.m, fontWeight: font.weight.semibold },
  pill: {
    paddingHorizontal: spacing.s, paddingVertical: 3,
    borderRadius: 20,
  },
  pillText: { color: colors.textSub, fontSize: font.size.xs, fontWeight: font.weight.medium },
});
