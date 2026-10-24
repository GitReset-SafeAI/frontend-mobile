import { useQuery } from '@tanstack/react-query';

import { services } from '../../../services';
import type { HotspotsRequest } from '../../../services/contracts';
import { queryKeys } from '../../../services/queryKeys';

export function useHotspots(request: HotspotsRequest) {
  return useQuery({
    queryKey: queryKeys.hotspots(request),
    queryFn: () => services.safetyMap.getHotspots(request),
    // Clustering is expensive server-side; a short pan should not refetch.
    staleTime: 5 * 60 * 1000,
  });
}
