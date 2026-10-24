import { useQuery } from '@tanstack/react-query';

import { services } from '../../services';
import { queryKeys } from '../../services/queryKeys';

export function useServiceStatus() {
  return useQuery({
    queryKey: queryKeys.serviceStatus,
    queryFn: () => services.status.getStatus(),
    // This foundation operation is local in both modes; demos also work offline.
    networkMode: 'always',
  });
}
