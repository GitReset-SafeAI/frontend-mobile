import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SegmentedButtons, Text } from 'react-native-paper';

import { tokens } from '../theme/tokens';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  return (
    <View style={styles.container}>
      <Text variant="labelLarge">{t('language')}</Text>
      <SegmentedButtons
        value={i18n.resolvedLanguage === 'si' ? 'si' : 'en'}
        onValueChange={(language) => { void i18n.changeLanguage(language); }}
        buttons={[
          { value: 'en', label: 'English', accessibilityLabel: 'English', style: styles.button },
          { value: 'si', label: 'සිංහල', accessibilityLabel: 'සිංහල', style: styles.button },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: tokens.spacing.sm },
  button: { minHeight: 48, justifyContent: 'center' },
});
