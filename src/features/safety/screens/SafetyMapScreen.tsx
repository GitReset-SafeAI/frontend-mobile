import { useTranslation } from 'react-i18next';
import { Card, Text } from 'react-native-paper';

import { FeaturePlaceholder } from '../../../shared/components/FeaturePlaceholder';

export function SafetyMapScreen() {
  const { t } = useTranslation('safety');
  return (
    <FeaturePlaceholder title={t('title')} description={t('description')} icon="map-outline">
      <Card mode="outlined">
        <Card.Title title={t('estimateTitle')} titleNumberOfLines={3} />
        <Card.Content><Text variant="bodyLarge">{t('estimateDescription')}</Text></Card.Content>
      </Card>
    </FeaturePlaceholder>
  );
}
