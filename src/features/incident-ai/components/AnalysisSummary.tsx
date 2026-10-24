import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Card, Icon, Text } from 'react-native-paper';

import { InfoNote } from '../../../shared/components/InfoNote';
import { tokens } from '../../../shared/theme/tokens';
import type { IncidentAnalysis, SeverityLevel } from '../../../services/contracts';
import { useIncidentLabels } from '../hooks/useIncidentLabels';

const severityBars: Record<SeverityLevel, number> = { low: 1, moderate: 2, high: 3, unknown: 0 };

// The AI's interpretation, presented as an estimate and visibly separate from the user's own words.
export function AnalysisSummary({ analysis }: { analysis: IncidentAnalysis }) {
  const { t } = useTranslation('incidentAi');
  const { categoryLabel } = useIncidentLabels();
  const bars = severityBars[analysis.severity];
  const severityLabel = t(`severityLevels.${analysis.severity}`);

  return (
    <Card mode="outlined" style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.titleRow}>
          <Icon source="robot-outline" size={24} color={tokens.colors.navy} />
          <Text variant="titleMedium" style={styles.title} accessibilityRole="header">{t('title')}</Text>
        </View>
        <InfoNote text={t('estimateNote')} />

        <View style={styles.row}>
          <Text variant="labelLarge" style={styles.label}>{t('category')}</Text>
          <Text variant="titleMedium" style={styles.value}>{categoryLabel(analysis.category)}</Text>
          <Text variant="bodyMedium" style={styles.label}>
            {t('confidence', { level: t(`confidenceLevels.${analysis.confidence}`) })}
          </Text>
        </View>

        <View style={styles.row}>
          <Text variant="labelLarge" style={styles.label}>{t('severity')}</Text>
          <View style={styles.severity} accessible accessibilityLabel={severityLabel}>
            <View style={styles.bars}>
              {[1, 2, 3].map((level) => (
                <View key={level} style={[styles.bar, level <= bars && styles.barFilled]} />
              ))}
            </View>
            <Text variant="titleMedium" style={styles.value}>{severityLabel}</Text>
          </View>
          {analysis.severity === 'unknown' ? (
            <Text variant="bodyMedium" style={styles.label}>{t('severityUnknown')}</Text>
          ) : null}
        </View>

        <View style={styles.row}>
          <Text variant="labelLarge" style={styles.label}>{t('picked')}</Text>
          {analysis.extractedDetails.length === 0 ? (
            <Text variant="bodyMedium" style={styles.label}>{t('none')}</Text>
          ) : analysis.extractedDetails.map((detail) => (
            <Text key={`${detail.kind}-${detail.value}`} variant="bodyLarge" style={styles.value}>
              {t(`detailKinds.${detail.kind}`)}: {detail.value}
            </Text>
          ))}
        </View>

        {analysis.missingInformation.length > 0 ? (
          <View style={styles.row}>
            <Text variant="labelLarge" style={styles.label}>{t('missing')}</Text>
            {analysis.missingInformation.map((kind) => (
              <Text key={kind} variant="bodyLarge" style={styles.value}>• {t(`missingKinds.${kind}`)}</Text>
            ))}
          </View>
        ) : null}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  content: { gap: tokens.spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  title: { flex: 1, color: tokens.colors.navy },
  row: { gap: tokens.spacing.xs },
  label: { color: tokens.colors.textSecondary },
  value: { color: tokens.colors.textPrimary },
  severity: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  bars: { flexDirection: 'row', gap: tokens.spacing.xs },
  bar: { width: 24, height: 10, borderRadius: 5, backgroundColor: tokens.colors.border },
  barFilled: { backgroundColor: tokens.colors.navy },
});
