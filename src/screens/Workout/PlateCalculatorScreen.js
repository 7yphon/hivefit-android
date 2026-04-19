import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Screen, Header, Card } from '../../components/Screen';
import { colors, spacing, font } from '../../theme';
import { calculatePlates, BARBELL_PRESETS } from '../../utils/fitness';

const PLATE_COLORS = {
  25: '#e63946', 20: '#457b9d', 15: '#f4a261',
  10: '#2a9d8f', 5: '#e9c46a', 2.5: '#aaaaaa', 1.25: '#dddddd',
};

export default function PlateCalculatorScreen({ navigation }) {
  const [target, setTarget] = useState('');
  const [barbellKg, setBarbellKg] = useState(20);

  const result = target ? calculatePlates(parseFloat(target) || 0, barbellKg) : null;

  return (
    <Screen>
      <Header title="Plate Calculator" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Barbell selector */}
        <Text style={styles.label}>Barbell</Text>
        <View style={styles.presetRow}>
          {BARBELL_PRESETS.map(p => (
            <TouchableOpacity
              key={p.weight}
              onPress={() => setBarbellKg(p.weight)}
              style={[styles.preset, barbellKg === p.weight && styles.presetActive]}
            >
              <Text style={[styles.presetText, barbellKg === p.weight && styles.presetTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Target weight */}
        <Text style={styles.label}>Target weight (kg)</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="e.g. 140"
          placeholderTextColor={colors.textMuted}
          value={target}
          onChangeText={setTarget}
        />

        {/* Result */}
        {result && !result.error && (
          <Card>
            <Text style={styles.resultTitle}>
              {result.achievable ? `${result.actualWeight}kg` : `~${result.actualWeight}kg`}
              {result.achievable ? '' : ' (closest)'}
            </Text>
            <Text style={styles.resultSub}>Bar: {barbellKg}kg + {result.perSide}kg per side</Text>

            {/* Visual plate stack */}
            <View style={styles.plateRow}>
              {result.plates.map((p, i) => (
                <View key={i} style={[styles.plate, { backgroundColor: PLATE_COLORS[p] || '#888', width: 32 + p * 1.2 }]}>
                  <Text style={styles.plateText}>{p}</Text>
                </View>
              ))}
              {result.plates.length === 0 && (
                <Text style={styles.emptyPlates}>Barbell only</Text>
              )}
            </View>
          </Card>
        )}

        {result?.error && (
          <Text style={styles.error}>{result.error}</Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.m, paddingBottom: 40 },
  label: { color: colors.textSub, fontSize: font.size.s, marginBottom: spacing.s, textTransform: 'uppercase', letterSpacing: 0.8 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s, marginBottom: spacing.l },
  preset: {
    paddingHorizontal: spacing.m, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  presetActive: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  presetText: { color: colors.textSub, fontSize: font.size.s },
  presetTextActive: { color: colors.primary, fontWeight: font.weight.semibold },
  input: {
    backgroundColor: colors.card, borderRadius: 10, padding: spacing.m,
    color: colors.text, fontSize: font.size.xxl, fontWeight: font.weight.bold,
    textAlign: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: spacing.l,
  },
  resultTitle: { color: colors.primary, fontSize: font.size.xxl, fontWeight: font.weight.bold, textAlign: 'center' },
  resultSub: { color: colors.textSub, fontSize: font.size.s, textAlign: 'center', marginBottom: spacing.m },
  plateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s, justifyContent: 'center' },
  plate: {
    height: 44, borderRadius: 6, alignItems: 'center', justifyContent: 'center',
  },
  plateText: { color: '#fff', fontSize: font.size.xs, fontWeight: font.weight.bold },
  emptyPlates: { color: colors.textSub, fontSize: font.size.m },
  error: { color: colors.danger, textAlign: 'center', fontSize: font.size.m },
});
