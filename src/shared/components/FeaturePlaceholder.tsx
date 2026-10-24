import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Card, Icon, Text } from 'react-native-paper';

import { ScreenContainer } from '../layouts/ScreenContainer';
import { tokens } from '../theme/tokens';
import { LanguageSwitcher } from './LanguageSwitcher';

type FeaturePlaceholderProps = PropsWithChildren<{
  title: string;
  description: string;
  icon: string;
}>;

export function FeaturePlaceholder({ title, description, icon, children }: FeaturePlaceholderProps) {
  const { t } = useTranslation();
  return (
    <ScreenContainer>
      <View style={styles.brand}>
        <Icon source="shield-outline" size={32} color={tokens.colors.primary} />
        <View style={styles.brandText}>
          <Text variant="titleLarge" accessibilityRole="header">{t('appName')}</Text>
          <Text variant="bodyMedium">{t('tagline')}</Text>
        </View>
      </View>
      <LanguageSwitcher />
      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Icon source={icon} size={40} color={tokens.colors.primary} />
          <Text variant="labelLarge" style={styles.status}>{t('underDevelopment')}</Text>
          <Text variant="headlineMedium" accessibilityRole="header">{title}</Text>
          <Text variant="bodyLarge">{description}</Text>
        </Card.Content>
      </Card>
      {children}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md },
  brandText: { flex: 1, gap: tokens.spacing.xs },
  card: { backgroundColor: tokens.colors.surface },
  cardContent: { gap: tokens.spacing.md },
  status: { color: tokens.colors.primary },
});
