import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  ApproximateLocation,
  IncidentTime,
  LightingLevel,
  ReportReceipt,
  ReportSubmission,
} from '../../services/contracts';
import { useAuth } from '../account/authContext';

export interface ReportDraft {
  description: string;
  inputMethod: 'typed' | 'voice';
  // True while a voice transcript has not yet been confirmed by the user.
  transcriptPending: boolean;
  incidentDate?: string;
  clockTime?: string;
  timePeriod?: IncidentTime;
  location?: ApproximateLocation;
  lighting?: LightingLevel;
}

const emptyDraft: ReportDraft = { description: '', inputMethod: 'typed', transcriptPending: false };

interface ReportDraftContextValue {
  draft: ReportDraft;
  update: (patch: Partial<ReportDraft>) => void;
  receipt: ReportReceipt | undefined;
  setReceipt: (receipt: ReportReceipt | undefined) => void;
  reset: () => void;
}

const ReportDraftContext = createContext<ReportDraftContextValue | undefined>(undefined);

// In-memory only. Nothing about a draft is persisted, logged, or placed in route params.
export function ReportDraftProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const ownerId = user?.id;
  const activeOwner = useRef(ownerId);
  const [state, setState] = useState<{ ownerId?: string; draft: ReportDraft; receipt?: ReportReceipt }>({ ownerId, draft: emptyDraft });
  const reset = useCallback(() => {
    if (activeOwner.current === ownerId) setState({ ownerId, draft: emptyDraft });
  }, [ownerId]);
  // Hide the prior owner's data immediately, then discard it. In-flight callbacks are owner-bound.
  useLayoutEffect(() => { activeOwner.current = ownerId; reset(); }, [ownerId, reset]);
  const draft = state.ownerId === ownerId ? state.draft : emptyDraft;
  const receipt = state.ownerId === ownerId ? state.receipt : undefined;
  const update = useCallback((patch: Partial<ReportDraft>) => {
    if (!ownerId || activeOwner.current !== ownerId) return;
    setState((current) => ({ ownerId, draft: { ...(current.ownerId === ownerId ? current.draft : emptyDraft), ...patch } }));
  }, [ownerId]);
  const setReceipt = useCallback((next: ReportReceipt | undefined) => {
    if (!ownerId || activeOwner.current !== ownerId) return;
    setState((current) => current.ownerId === ownerId ? { ...current, receipt: next } : current);
  }, [ownerId]);
  const value = useMemo(() => ({ draft, update, receipt, setReceipt, reset }), [draft, update, receipt, setReceipt, reset]);
  return <ReportDraftContext.Provider value={value}>{children}</ReportDraftContext.Provider>;
}

export function useReportDraft(): ReportDraftContextValue {
  const value = useContext(ReportDraftContext);
  if (!value) throw new Error('useReportDraft must be used inside ReportDraftProvider');
  return value;
}

export function toSubmission(draft: ReportDraft): ReportSubmission {
  return {
    description: draft.description,
    inputMethod: draft.inputMethod,
    incidentDate: draft.incidentDate,
    clockTime: draft.clockTime,
    timePeriod: draft.timePeriod,
    location: draft.location,
    lighting: draft.lighting,
  };
}
