import { type NavigationProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../../app/navigation/navigation.types';
import { BrandLogo } from '../../../shared/components/Brand';
import { LanguageToggle } from '../../../shared/components/LanguageToggle';
import { tokens } from '../../../shared/theme/tokens';
import { SosButton } from '../components/SosButton';
import { SOS_COUNTDOWN_SECONDS } from '../sos';

export function HomeScreen() {
  const { t } = useTranslation('emergency');
  const { t: tc } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <BrandLogo name={tc('appName')} />
        <LanguageToggle />
      </View>
      <View style={styles.center}>
        <SosButton onPress={() => { navigation.navigate('Sos'); }} />
        <View style={styles.captions}>
          <Text variant="titleLarge" style={styles.caption}>{t('homeCaption')}</Text>
          <Text variant="bodyMedium" style={styles.hint}>
            {t('homeHint', { seconds: SOS_COUNTDOWN_SECONDS })}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: tokens.colors.screenBackground },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.xl,
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
  },
  captions: { alignItems: 'center', gap: tokens.spacing.xs },
  caption: { color: tokens.colors.textPrimary, textAlign: 'center' },
  hint: { color: tokens.colors.textSecondary, textAlign: 'center', maxWidth: 320 },
});
