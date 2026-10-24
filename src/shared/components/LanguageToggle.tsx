import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import i18n, { type AppLanguage, isAppLanguage, languageNames, supportedLanguages } from '../../i18n';
import { tokens } from '../theme/tokens';

// A picker scales to any number of languages. The button shows the current language, and every option is
// written in its own language, so a reader can always find theirs even if the interface is unreadable to them.
export function LanguageToggle() {
  const { t, i18n: instance } = useTranslation();
  const [open, setOpen] = useState(false);
  const current: AppLanguage = isAppLanguage(instance.resolvedLanguage) ? instance.resolvedLanguage : 'en';

  const choose = (language: AppLanguage) => {
    setOpen(false);
    void i18n.changeLanguage(language);
  };

  return (
    <>
      <Button
        mode="text"
        icon="translate"
        textColor={tokens.colors.navy}
        contentStyle={styles.content}
        accessibilityLabel={`${t('language')}: ${languageNames[current]}`}
        onPress={() => { setOpen(true); }}
      >
        {languageNames[current]}
      </Button>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => { setOpen(false); }}>
        <View style={styles.backdrop}>
          <Pressable style={styles.scrim} onPress={() => { setOpen(false); }} accessibilityLabel={t('close')} accessibilityRole="button" />
          <SafeAreaView style={styles.sheet} edges={['bottom']}>
            <Text variant="titleLarge" style={styles.title} accessibilityRole="header">{t('language')}</Text>
            <View accessibilityRole="radiogroup">
              {supportedLanguages.map((language) => {
                const selected = language === current;
                return (
                  <Pressable
                    key={language}
                    accessibilityRole="radio"
                    accessibilityLabel={languageNames[language]}
                    accessibilityState={{ checked: selected }}
                    onPress={() => { choose(language); }}
                    style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}
                  >
                    <Text variant="titleMedium" style={styles.optionLabel}>{languageNames[language]}</Text>
                    {/* Selection is shown by a check and a heavier border, never by colour alone. */}
                    {selected ? <Icon source="check" size={24} color={tokens.colors.navy} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { minHeight: tokens.touchTarget },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: `${tokens.colors.textPrimary}99` },
  sheet: {
    gap: tokens.spacing.sm,
    padding: tokens.spacing.lg,
    borderTopLeftRadius: tokens.radii.lg,
    borderTopRightRadius: tokens.radii.lg,
    backgroundColor: tokens.colors.surface,
  },
  title: { color: tokens.colors.navy },
  option: {
    minHeight: tokens.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.textSecondary,
    backgroundColor: tokens.colors.surface,
  },
  optionSelected: { borderWidth: 2, borderColor: tokens.colors.navy, backgroundColor: tokens.colors.mintLight },
  pressed: { opacity: 0.7 },
  optionLabel: { color: tokens.colors.textPrimary },
});
