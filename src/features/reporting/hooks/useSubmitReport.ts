import { useMutation } from '@tanstack/react-query';
import { useLayoutEffect, useRef } from 'react';

import { services } from '../../../services';
import { useAuth } from '../../account/authContext';
import { createReportSubmitter } from '../submitReport';

// Mutations never retry automatically: a timed-out submission may already have been accepted.
export function useSubmitReport() {
  const { user } = useAuth();
  const owner = useRef(user?.id);
  useLayoutEffect(() => { owner.current = user?.id; }, [user?.id]);
  const submit = useRef(createReportSubmitter(services.reports.submitReport, () => owner.current));
  return useMutation({ mutationKey: ['report-submission', user?.id], mutationFn: submit.current, retry: false, gcTime: 0 });
}

export function useTranscribeVoice() {
  return useMutation({ mutationFn: () => services.reports.transcribeVoice() });
}
