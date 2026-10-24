import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, Icon, Text, TouchableRipple } from 'react-native-paper';

import type { Route, RouteComparisonResult } from '../../../services/contracts';
import { tokens } from '../../../shared/theme/tokens';
import { issueTypeDisplay } from '../constants/issueTypes';

interface RouteComparisonCardProps {
  comparison: RouteComparisonResult;
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
}

function minutes(seconds: number) {
  return Math.max(1, Math.round(seconds / 60));
}

export function RouteComparisonCard({
  comparison,
  selectedRouteId,
  onSelectRoute,
}: RouteComparisonCardProps) {
  const { t } = useTranslation('safety');

  return (
    <Card mode="outlined" style={styles.card}>
      <Card.Title title={t('routes.title')} titleNumberOfLines={2} />
      <Card.Content style={styles.content}>
        {comparison.recommendedRouteId === null ? (
          <View style={styles.notice}>
            <Icon source="information-outline" size={20} color={tokens.colors.status.info} />
            <View style={styles.noticeText}>
              <Text variant="labelLarge">{t('routes.noAlternativeTitle')}</Text>
              <Text variant="bodyMedium" style={styles.muted}>
                {t('routes.noAlternativeDescription')}
              </Text>
            </View>
          </View>
        ) : null}

        {comparison.routes.map((route) => (
          <RouteRow
            key={route.id}
            route={route}
            selected={route.id === selectedRouteId}
            recommended={route.id === comparison.recommendedRouteId}
            onPress={() => onSelectRoute(route.id)}
          />
        ))}

        <Text variant="bodyMedium" style={styles.disclaimer}>
          {t('routes.disclaimer')}
        </Text>
      </Card.Content>
    </Card>
  );
}

interface RouteRowProps {
  route: Route;
  selected: boolean;
  recommended: boolean;
  onPress: () => void;
}

function RouteRow({ route, selected, recommended, onPress }: RouteRowProps) {
  const { t } = useTranslation('safety');
  const label = t(`routes.role.${route.role}`);

  return (
    <TouchableRipple
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}. ${t('routes.duration', { minutes: minutes(route.durationSeconds) })}`}
      style={[styles.route, selected && styles.routeSelected]}
    >
      <View style={styles.routeContent}>
        <View style={styles.routeHeader}>
          <Text variant="labelLarge" style={styles.routeTitle}>{label}</Text>
          {/* The recommendation is stated in words, never by colour alone. */}
          {recommended ? <Chip compact icon="shield-check-outline">{t('routes.recommended')}</Chip> : null}
        </View>

        <Text variant="bodyMedium">
          {t('routes.duration', { minutes: minutes(route.durationSeconds) })}
          {route.extraDurationSeconds > 0
            ? ` · ${t('routes.extraTime', { minutes: minutes(route.extraDurationSeconds) })}`
            : ''}
        </Text>

        <Text variant="bodyMedium" style={styles.muted}>
          {t('routes.hotspotsPassed', { count: route.hotspotsPassed })}
        </Text>

        {route.issueCategories.length > 0 ? (
          <View style={styles.issues}>
            {route.issueCategories.map((category) => {
              const display = issueTypeDisplay(category);
              return (
                <Chip key={category} compact icon={display.icon} style={styles.issueChip}>
                  {t(display.labelKey)}
                </Chip>
              );
            })}
          </View>
        ) : (
          <Text variant="bodyMedium" style={styles.muted}>{t('routes.noReportedIssues')}</Text>
        )}
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  card: { borderColor: tokens.colors.border },
  content: { gap: tokens.spacing.md },
  route: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.sm,
    padding: tokens.spacing.md,
  },
  routeSelected: { borderColor: tokens.colors.primaryDark, borderWidth: 2 },
  routeContent: { gap: tokens.spacing.xs },
  routeHeader: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, flexWrap: 'wrap' },
  routeTitle: { color: tokens.colors.primaryDark, flexShrink: 1 },
  issues: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.xs, marginTop: tokens.spacing.xs },
  issueChip: { backgroundColor: tokens.colors.screenBackground },
  muted: { color: tokens.colors.textSecondary },
  notice: { flexDirection: 'row', gap: tokens.spacing.sm, alignItems: 'flex-start' },
  noticeText: { flex: 1, gap: tokens.spacing.xs },
  disclaimer: { color: tokens.colors.textSecondary },
});
