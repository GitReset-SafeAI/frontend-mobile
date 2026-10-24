import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Card, Icon, Text } from 'react-native-paper';

import type { HotspotsResult } from '../../../services/contracts';
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
    <Card mode="outlined" style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.row}>
          <Icon source="information-outline" size={20} color={tokens.colors.status.info} />
          <Text variant="labelLarge" style={styles.title}>
            {t(isEmpty ? 'map.emptyTitle' : 'map.legendTitle')}
          </Text>
        </View>
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
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderColor: tokens.colors.border },
  content: { gap: tokens.spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  title: { color: tokens.colors.textPrimary },
  muted: { color: tokens.colors.textSecondary },
});
