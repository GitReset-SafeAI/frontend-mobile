import { StyleSheet, Text, View } from 'react-native';

import { tokens } from '../../../shared/theme/tokens';

// Small labels drawn on the map itself, so a route's time and an area's report
// count can be read without opening a card.

export function RouteDurationLabel({ minutes, extraMinutes, selected }: {
  minutes: number;
  extraMinutes: number;
  selected: boolean;
}) {
  return (
    <View style={[styles.routeLabel, selected ? styles.routeLabelSelected : null]}>
      <Text style={[styles.routeText, selected ? styles.routeTextSelected : null]}>
        {`${minutes} min`}
      </Text>
      {extraMinutes > 0 ? (
        <Text style={[styles.routeExtra, selected ? styles.routeTextSelected : null]}>
          {`+${extraMinutes}`}
        </Text>
      ) : null}
    </View>
  );
}

export function HotspotCountLabel({ count, color }: { count: number; color: string }) {
  return (
    <View style={[styles.hotspotLabel, { borderColor: color }]}>
      <Text style={[styles.hotspotText, { color }]}>{String(count)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  routeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: tokens.radii.sm,
    backgroundColor: tokens.colors.surface,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  routeLabelSelected: {
    backgroundColor: tokens.colors.primaryDark,
    borderColor: tokens.colors.primaryDark,
  },
  routeText: { fontSize: 13, fontWeight: '600', color: tokens.colors.textPrimary },
  routeTextSelected: { color: tokens.colors.textOnDark },
  routeExtra: { fontSize: 12, color: tokens.colors.textSecondary },
  hotspotLabel: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    backgroundColor: tokens.colors.surface,
    borderWidth: 2,
  },
  hotspotText: { fontSize: 13, fontWeight: '700' },
});
