import { useState, type PropsWithChildren, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Icon, Text, TouchableRipple } from 'react-native-paper';

import { tokens } from '../theme/tokens';

type SectionCardProps = PropsWithChildren<{
  title: string;
  icon: string;
  subtitle?: string;
  /** Shown on the right of the header, e.g. a count. */
  badge?: ReactNode;
  /** Sections open by default; a collapsed one can always be reopened. */
  defaultOpen?: boolean;
  collapsible?: boolean;
  testID?: string;
}>;

export function SectionCard({
  title,
  icon,
  subtitle,
  badge,
  defaultOpen = true,
  collapsible = true,
  testID,
  children,
}: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const expanded = collapsible ? open : true;

  const header = (
    <View style={styles.header}>
      <View style={styles.iconBadge}>
        <Icon source={icon} size={20} color={tokens.colors.primaryDark} />
      </View>
      <View style={styles.headerText}>
        <Text variant="titleMedium" style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySmall" style={styles.subtitle}>{subtitle}</Text>
        ) : null}
      </View>
      {badge}
      {/* Decorative: the whole header is the control, so a second focusable
          chevron would only duplicate it for screen readers. */}
      {collapsible ? (
        <View style={styles.chevron}>
          <Icon
            source={expanded ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={tokens.colors.textSecondary}
          />
        </View>
      ) : null}
    </View>
  );

  return (
    <Card mode="outlined" style={styles.card} testID={testID}>
      {collapsible ? (
        <TouchableRipple
          onPress={() => setOpen((value) => !value)}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={title}
          borderless={false}
        >
          {header}
        </TouchableRipple>
      ) : (
        header
      )}
      {expanded ? <Card.Content style={styles.content}>{children}</Card.Content> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    paddingLeft: tokens.spacing.md,
    paddingRight: tokens.spacing.xs,
    paddingVertical: tokens.spacing.sm,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: tokens.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.homeGradientStart,
  },
  headerText: { flex: 1, gap: 2 },
  chevron: { paddingHorizontal: tokens.spacing.sm },
  title: { color: tokens.colors.primaryDark, fontWeight: '600' },
  subtitle: { color: tokens.colors.textSecondary },
  content: { gap: tokens.spacing.md, paddingBottom: tokens.spacing.md },
});
