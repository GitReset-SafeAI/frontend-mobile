import { useMutation } from '@tanstack/react-query';

import { services } from '../../../services';
import type { ReportSubmission } from '../../../services/contracts';

// Mutations never retry automatically: a timed-out submission may already have been accepted.
export function useSubmitReport() {
  return useMutation({ mutationFn: (submission: ReportSubmission) => services.reports.submitReport(submission) });
}

export function useTranscribeVoice() {
  return useMutation({ mutationFn: () => services.reports.transcribeVoice() });
}
