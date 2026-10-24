import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Divider, List, Surface, TextInput } from 'react-native-paper';

import { services } from '../../../services';
import type { PlaceSuggestion } from '../../../services/contracts';
import { tokens } from '../../../shared/theme/tokens';

interface PlaceSearchFieldProps {
  label: string;
  icon: string;
  value: string;
  placeholder: string;
  testID?: string;
  onSelect: (place: PlaceSuggestion) => void;
  onClear: () => void;
  onFocus?: () => void;
}

export function PlaceSearchField({
  label,
  icon,
  value,
  placeholder,
  testID,
  onSelect,
  onClear,
  onFocus,
}: PlaceSearchFieldProps) {
  const { t } = useTranslation('safety');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    let active = true;
    setSearching(true);
    // Debounced so typing does not fire a lookup per keystroke.
    const timer = setTimeout(async () => {
      try {
        const results = await services.places.searchPlaces({ query, limit: 6 });
        if (active) setSuggestions(results);
      } catch {
        if (active) setSuggestions([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, query]);

  const handleSelect = (place: PlaceSuggestion) => {
    setQuery('');
    setSuggestions([]);
    setOpen(false);
    onSelect(place);
  };

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        dense
        label={label}
        testID={testID}
        value={open ? query : value}
        placeholder={placeholder}
        onFocus={() => { setOpen(true); onFocus?.(); }}
        onChangeText={setQuery}
        left={<TextInput.Icon icon={icon} />}
        right={
          value || query ? (
            <TextInput.Icon
              icon="close"
              accessibilityLabel={t('planner.clearField', { field: label })}
              onPress={() => { setQuery(''); setSuggestions([]); setOpen(false); onClear(); }}
            />
          ) : undefined
        }
      />

      {open && query.trim().length >= 2 ? (
        <Surface elevation={2} style={styles.suggestions}>
          {searching && suggestions.length === 0 ? (
            <ActivityIndicator style={styles.spinner} accessibilityLabel={t('planner.searching')} />
          ) : null}
          {!searching && suggestions.length === 0 ? (
            <List.Item title={t('planner.noResults')} titleNumberOfLines={2} />
          ) : null}
          {suggestions.map((place, index) => (
            <View key={place.id}>
              {index > 0 ? <Divider /> : null}
              <List.Item
                title={place.name}
                description={place.context}
                titleNumberOfLines={2}
                left={(props) => <List.Icon {...props} icon="map-marker-outline" />}
                onPress={() => handleSelect(place)}
              />
            </View>
          ))}
        </Surface>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: tokens.spacing.xs },
  suggestions: {
    borderRadius: tokens.radii.sm,
    overflow: 'hidden',
    backgroundColor: tokens.colors.surface,
  },
  spinner: { paddingVertical: tokens.spacing.md },
});
