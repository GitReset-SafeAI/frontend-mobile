import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SegmentedButtons, Text } from 'react-native-paper';

import { isAppLanguage, languageNames, supportedLanguages } from '../../i18n';
import { tokens } from '../theme/tokens';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  return (
    <View style={styles.container}>
      <Text variant="labelLarge">{t('language')}</Text>
      <SegmentedButtons
        value={isAppLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'en'}
        onValueChange={(language) => { void i18n.changeLanguage(language); }}
        buttons={supportedLanguages.map((language) => ({
          value: language,
          label: languageNames[language],
          accessibilityLabel: languageNames[language],
          style: styles.button,
        }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: tokens.spacing.sm },
  button: { minHeight: 48, justifyContent: 'center' },
});
