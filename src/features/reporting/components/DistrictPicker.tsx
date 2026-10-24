import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Icon, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { tokens } from '../../../shared/theme/tokens';
import { type DistrictId, districts } from '../districts';

interface DistrictPickerProps {
  visible: boolean;
  selected?: string;
  onSelect: (id: DistrictId) => void;
  onClose: () => void;
}

export function DistrictPicker({ visible, selected, onSelect, onClose }: DistrictPickerProps) {
  const { t } = useTranslation('reporting');
  const { t: tc } = useTranslation();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title} accessibilityRole="header">{t('when.districtTitle')}</Text>
          <IconButton icon="close" size={28} accessibilityLabel={tc('close')} onPress={onClose} />
        </View>
        <FlatList
          data={districts}
          keyExtractor={(district) => district.id}
          renderItem={({ item }) => {
            const isSelected = item.id === selected;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={t(`districts.${item.id}`)}
                onPress={() => { onSelect(item.id); }}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <Text variant="bodyLarge" style={styles.rowLabel}>{t(`districts.${item.id}`)}</Text>
                {isSelected ? <Icon source="check" size={24} color={tokens.colors.navy} /> : null}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: tokens.colors.screenBackground },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: tokens.spacing.lg,
    paddingRight: tokens.spacing.sm,
  },
  title: { flex: 1, color: tokens.colors.navy },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
  },
  pressed: { backgroundColor: tokens.colors.mintSoft },
  rowLabel: { flex: 1, color: tokens.colors.textPrimary },
});
