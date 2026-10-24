import { useTranslation } from 'react-i18next';
import { Card, Text } from 'react-native-paper';

import { FeaturePlaceholder } from '../../../shared/components/FeaturePlaceholder';
import { ServiceStatusCard } from '../../../shared/components/ServiceStatusCard';

export function ReportScreen() {
  const { t } = useTranslation('reporting');
  return (
    <FeaturePlaceholder title={t('title')} description={t('description')} icon="clipboard-text-outline">
      <Card mode="outlined">
        <Card.Title title={t('next')} titleNumberOfLines={3} />
        <Card.Content><Text variant="bodyLarge">{t('nextDescription')}</Text></Card.Content>
      </Card>
      <ServiceStatusCard />
    </FeaturePlaceholder>
  );
}
