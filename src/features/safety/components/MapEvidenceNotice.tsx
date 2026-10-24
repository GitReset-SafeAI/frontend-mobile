import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import type { HotspotsResult } from '../../../services/contracts';
import { SectionCard } from '../../../shared/components/SectionCard';
import { tokens } from '../../../shared/theme/tokens';

interface MapEvidenceNoticeProps {
  result: HotspotsResult;
}

// Absence of hotspots must never read as "this area is safe", so the empty
// state is stated explicitly rather than left to an empty map.
export function MapEvidenceNotice({ result }: MapEvidenceNoticeProps) {
  const { t } = useTranslation('safety');
  const isEmpty = result.hotspots.length === 0;

  return (
    <SectionCard
      title={t(isEmpty ? 'map.emptyTitle' : 'map.legendTitle')}
      icon="information-outline"
      // Folded by default so the journey leads. The heading still states the
      // caveat, and an area with no reports opens itself, because "no reports"
      // read as "safe" is the misreading that matters most.
      defaultOpen={isEmpty}
      testID="evidence-card"
    >
      <View style={styles.content}>
        <Text variant="bodyMedium" style={styles.muted}>
          {t(isEmpty ? 'map.emptyDescription' : 'map.legendDescription')}
        </Text>
        <Text variant="bodyMedium" style={styles.muted}>{t(`evidence.${result.evidenceLevel}`)}</Text>
        {result.suppressedAreaCount > 0 ? (
          <Text variant="bodyMedium" style={styles.muted}>
            {t('map.suppressed', { count: result.suppressedAreaCount })}
          </Text>
        ) : null}
        <Text variant="bodyMedium" style={styles.muted}>{t('map.disclaimer')}</Text>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  content: { gap: tokens.spacing.xs },
  muted: { color: tokens.colors.textSecondary },
});
