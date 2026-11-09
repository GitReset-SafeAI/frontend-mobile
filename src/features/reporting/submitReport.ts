import { ApiError } from '../../services/api/ApiError';
import type { ReportService, ReportSubmission } from '../../services/contracts';

// Synchronous latch covers repeated taps before React renders the pending state.
// Also bind completion to the owner who explicitly submitted; never queue a guest draft.
export function createReportSubmitter(service: ReportService['submitReport'], currentOwner: () => string | undefined) {
  let pending = false;
  return async (submission: ReportSubmission) => {
    const owner = currentOwner();
    if (!owner) throw new ApiError('unauthorized', 'Log in before submitting a report.', 401);
    if (pending) throw new ApiError('conflict', 'A report submission is already in progress.', 409);
    pending = true;
    try {
      const receipt = await service(submission, { userId: owner });
      if (currentOwner() !== owner) throw new ApiError('cancelled', 'The account changed.');
      return receipt;
    } finally { pending = false; }
  };
}
