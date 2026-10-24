import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';

import { env } from '../../config/env';
import { useServiceStatus } from '../hooks/useServiceStatus';
import { tokens } from '../theme/tokens';

export function ServiceStatusCard() {
  const { t } = useTranslation();
  const status = useServiceStatus();
  return (
    <Card mode="outlined">
      <Card.Content style={styles.content}>
        <Text variant="titleMedium">{t('serviceStatus')}</Text>
        {env.dataMode === 'api' ? <Text variant="bodyLarge">{t('apiUnavailable')}</Text> : (
          <>
            <Text variant="labelLarge">{t('demoMode')}</Text>
            {status.isPending ? (
              <ActivityIndicator accessibilityLabel={t('loading')} />
            ) : status.isError ? (
              <>
                <Text accessibilityRole="alert">{t('error')}</Text>
                <Button onPress={() => { void status.refetch(); }} contentStyle={styles.button}>{t('retry')}</Button>
              </>
            ) : <Text variant="bodyLarge" accessibilityLiveRegion="polite">{t('demoAvailable')}</Text>}
          </>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { gap: tokens.spacing.sm },
  button: { minHeight: 48 },
});
