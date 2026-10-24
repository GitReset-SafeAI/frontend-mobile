import type { PropsWithChildren, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';

import { tokens } from '../theme/tokens';

interface StepLayoutProps extends PropsWithChildren {
  // 1-based position in a multi-step flow. Omit for single screens.
  step?: { current: number; total: number };
  title: string;
  subtitle?: string;
  // Sticky actions. Always visible so the next action never scrolls out of reach.
  footer?: ReactNode;
}

export function StepLayout({ step, title, subtitle, footer, children }: StepLayoutProps) {
  const { t } = useTranslation('reporting');
  const stepLabel = step ? t('stepOf', { current: step.current, total: step.total }) : undefined;
  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step ? (
            <View accessible accessibilityLabel={stepLabel} style={styles.progress}>
              <View style={styles.segments}>
                {Array.from({ length: step.total }, (_, index) => (
                  <View key={index} style={[styles.segment, index < step.current && styles.segmentDone]} />
                ))}
              </View>
              <Text variant="labelLarge" style={styles.stepText}>{stepLabel}</Text>
            </View>
          ) : null}
          <View style={styles.heading}>
            <Text variant="headlineMedium" style={styles.title} accessibilityRole="header">{title}</Text>
            {subtitle ? <Text variant="bodyLarge" style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {children}
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: tokens.colors.screenBackground },
  content: { flexGrow: 1, padding: tokens.spacing.lg, gap: tokens.spacing.lg },
  progress: { gap: tokens.spacing.sm },
  segments: { flexDirection: 'row', gap: tokens.spacing.xs },
  segment: { flex: 1, height: 6, borderRadius: 3, backgroundColor: tokens.colors.border },
  segmentDone: { backgroundColor: tokens.colors.navy },
  stepText: { color: tokens.colors.textSecondary },
  heading: { gap: tokens.spacing.sm },
  title: { color: tokens.colors.navy },
  subtitle: { color: tokens.colors.textSecondary },
  footer: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    padding: tokens.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
  },
});
