import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { FeaturePlaceholder } from '../../../shared/components/FeaturePlaceholder';
import { tokens } from '../../../shared/theme/tokens';

export function SafetyMapScreen() {
  const { t } = useTranslation('safety');
  return (
    <FeaturePlaceholder title={t('title')} description={t('description')} icon="map-outline">
      <Card mode="outlined" style={styles.card}>
        <Card.Title title={t('estimateTitle')} titleStyle={styles.heading} titleNumberOfLines={3} />
        <Card.Content><Text variant="bodyLarge">{t('estimateDescription')}</Text></Card.Content>
      </Card>
    </FeaturePlaceholder>
  );
}

const styles = StyleSheet.create({
  card: { borderColor: tokens.colors.border },
  heading: { color: tokens.colors.primaryDark },
});
