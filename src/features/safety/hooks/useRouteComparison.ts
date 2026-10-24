import { useMutation } from '@tanstack/react-query';

import { services } from '../../../services';
import type { RouteComparisonRequest } from '../../../services/contracts';

export function useRouteComparison() {
  return useMutation({
    mutationFn: (request: RouteComparisonRequest) => services.safetyMap.compareRoutes(request),
  });
}
