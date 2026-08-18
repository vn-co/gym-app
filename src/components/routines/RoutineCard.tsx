import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/tokens';
import type { Routine } from '../../types';

interface Props {
  routine: Routine;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
  compact?: boolean; // for home screen
}

export function RoutineCard({ routine, onStart, onEdit, onDelete, compact }: Props) {
  const totalSets = routine.exercises.reduce((acc, e) => acc + e.defaultSets, 0);

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onStart} activeOpacity={0.8}>
        <View style={styles.compactEmoji}>
          <Text style={styles.emojiText}>{routine.emoji}</Text>
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactName}>{routine.name}</Text>
          <Text style={styles.compactMeta}>
            {routine.exercises.length} exercises · {totalSets} sets
          </Text>
        </View>
        <Text style={styles.compactArrow}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.emojiContainer}>
            <Text style={styles.emojiText}>{routine.emoji}</Text>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.name}>{routine.name}</Text>
            <Text style={styles.meta}>
              {routine.exercises.length} exercises · {totalSets} sets
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={onEdit} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.actionEdit}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.actionDelete}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Exercise preview */}
      {routine.exercises.slice(0, 4).map((ex, i) => (
        <View key={ex.exerciseId + i} style={styles.exercisePreviewRow}>
          <View style={styles.exercisePreviewDot} />
          <Text style={styles.exercisePreviewName}>{ex.exerciseName}</Text>
          <Text style={styles.exercisePreviewSets}>
            {ex.defaultSets}×{ex.defaultReps}
          </Text>
        </View>
      ))}
      {routine.exercises.length > 4 && (
        <Text style={styles.moreText}>+{routine.exercises.length - 4} more</Text>
      )}

      <TouchableOpacity style={styles.startBtn} onPress={onStart} activeOpacity={0.85}>
        <Text style={styles.startBtnText}>Start Workout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 22 },
  titleBlock: { flex: 1 },
  name: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  meta: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionBtn: { paddingVertical: 2 },
  actionEdit: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: FontWeight.medium,
  },
  actionDelete: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    fontWeight: FontWeight.medium,
  },
  exercisePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  exercisePreviewDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentDim,
  },
  exercisePreviewName: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  exercisePreviewSets: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  moreText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    paddingTop: Spacing.xs,
    paddingLeft: Spacing.lg,
  },
  startBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  startBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#000',
  },

  // Compact (Home screen)
  compactCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  compactEmoji: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactInfo: { flex: 1 },
  compactName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  compactMeta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  compactArrow: {
    fontSize: FontSize.xl,
    color: Colors.textMuted,
    fontWeight: FontWeight.bold,
  },
});
