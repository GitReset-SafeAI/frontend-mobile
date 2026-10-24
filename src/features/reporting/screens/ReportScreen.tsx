import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { FeaturePlaceholder } from '../../../shared/components/FeaturePlaceholder';
import { ServiceStatusCard } from '../../../shared/components/ServiceStatusCard';
import { tokens } from '../../../shared/theme/tokens';

export function ReportScreen() {
  const { t } = useTranslation('reporting');
  return (
    <FeaturePlaceholder title={t('title')} description={t('description')} icon="clipboard-text-outline">
      <Card mode="outlined" style={styles.card}>
        <Card.Title title={t('next')} titleStyle={styles.heading} titleNumberOfLines={3} />
        <Card.Content><Text variant="bodyLarge">{t('nextDescription')}</Text></Card.Content>
      </Card>
      <ServiceStatusCard />
    </FeaturePlaceholder>
  );
}

const styles = StyleSheet.create({
  card: { borderColor: tokens.colors.border },
  heading: { color: tokens.colors.primaryDark },
});
