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
    <Card mode="outlined" style={styles.card}>
      <Card.Content style={styles.content}>
        <Text variant="titleMedium" style={styles.heading}>{t('serviceStatus')}</Text>
        {env.dataMode === 'api' ? <Text variant="bodyLarge">{t('apiUnavailable')}</Text> : (
          <>
            <Text variant="labelLarge">{t('demoMode')}</Text>
            {status.isPending ? (
              <ActivityIndicator accessibilityLabel={t('loading')} />
            ) : status.isError ? (
              <>
                <Text accessibilityRole="alert" style={styles.error}>{t('error')}</Text>
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
  card: { borderColor: tokens.colors.border },
  heading: { color: tokens.colors.primaryDark },
  error: { color: tokens.colors.status.error },
  content: { gap: tokens.spacing.sm },
  button: { minHeight: 48 },
});
