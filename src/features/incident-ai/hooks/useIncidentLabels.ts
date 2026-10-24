import { useTranslation } from 'react-i18next';

import type { IncidentCategory } from '../../../services/contracts';

// Shared vocabulary so reporting, results, and the map name categories identically.
export function useIncidentLabels() {
  const { t } = useTranslation('incidentAi');
  return {
    categoryLabel: (category: IncidentCategory) => t(`categories.${category}`),
  };
}
