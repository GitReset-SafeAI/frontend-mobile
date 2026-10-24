import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Text } from 'react-native-paper';

import type { Hotspot } from '../../../services/contracts';
import { tokens } from '../../../shared/theme/tokens';
import { hotspotIssues } from '../constants/issueTypes';

interface HotspotDetailCardProps {
  hotspot: Hotspot;
  windowDays: number;
  onDismiss: () => void;
}

export function HotspotDetailCard({ hotspot, windowDays, onDismiss }: HotspotDetailCardProps) {
  const { t } = useTranslation('safety');

  return (
    <Card mode="outlined" style={styles.card}>
      <Card.Title title={t('map.areaTitle')} titleNumberOfLines={2} />
      <Card.Content style={styles.content}>
        <View style={styles.issues}>
          {hotspotIssues(hotspot).map((issue) => (
            <Chip key={issue.key} compact icon={issue.icon} style={styles.issueChip}>
              {t(issue.labelKey)}
            </Chip>
          ))}
        </View>

        <Text variant="bodyLarge">
          {t('map.reportCount', { count: hotspot.reportCount, days: windowDays })}
        </Text>
        <Text variant="bodyMedium" style={styles.muted}>
          {t('map.recency', { days: hotspot.mostRecentReportDaysAgo })}
        </Text>
        {hotspot.peakTimeBucket ? (
          <Text variant="bodyMedium" style={styles.muted}>
            {t('map.peakTime', { bucket: t(`timeBucket.${hotspot.peakTimeBucket}`) })}
          </Text>
        ) : null}
        <Text variant="bodyMedium" style={styles.muted}>
          {t(`evidence.${hotspot.evidenceLevel}`)}
        </Text>

        {/* Stated on the detail view too; a single area must not read as fact. */}
        <Text variant="bodyMedium" style={styles.muted}>{t('map.areaApproximate')}</Text>
      </Card.Content>
      <Card.Actions>
        <Button onPress={onDismiss}>{t('map.close')}</Button>
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderColor: tokens.colors.border },
  content: { gap: tokens.spacing.xs },
  issues: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.xs, marginBottom: tokens.spacing.xs },
  issueChip: { backgroundColor: tokens.colors.screenBackground },
  muted: { color: tokens.colors.textSecondary },
});
