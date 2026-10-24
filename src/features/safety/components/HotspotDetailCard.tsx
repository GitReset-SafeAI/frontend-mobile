import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

import type { Hotspot } from '../../../services/contracts';
import { SectionCard } from '../../../shared/components/SectionCard';
import { tokens } from '../../../shared/theme/tokens';
import { confidenceLabelKey, hotspotIssues } from '../constants/issueTypes';

interface HotspotDetailCardProps {
  hotspot: Hotspot;
  windowDays: number;
}

export function HotspotDetailCard({ hotspot, windowDays }: HotspotDetailCardProps) {
  const { t } = useTranslation('safety');

  return (
    <SectionCard
      title={t('map.areaTitle')}
      subtitle={t('map.reportCount', { count: hotspot.reportCount, days: windowDays })}
      icon="map-marker-alert-outline"
      testID="area-card"
    >
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
        {hotspot.peakTimePeriod ? (
          <Text variant="bodyMedium" style={styles.muted}>
            {t('map.peakTime', { bucket: t(`timePeriod.${hotspot.peakTimePeriod}`) })}
          </Text>
        ) : null}
        <Text variant="bodyMedium" style={styles.muted}>
          {t(`evidence.${hotspot.evidenceLevel}`)}
        </Text>
        <Text variant="bodyMedium" style={styles.muted}>
          {t(confidenceLabelKey(hotspot.meanConfidence))}
        </Text>

        {/* Stated on the detail view too; a single area must not read as fact. */}
        <Text variant="bodyMedium" style={styles.muted}>{t('map.areaApproximate')}</Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  issues: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.xs, marginBottom: tokens.spacing.xs },
  issueChip: { backgroundColor: tokens.colors.screenBackground },
  muted: { color: tokens.colors.textSecondary },
});
