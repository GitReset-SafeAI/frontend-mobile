import type { StatusService } from './status';

export type { ServiceStatus, StatusService } from './status';

export interface AppServices {
  status: StatusService;
}
