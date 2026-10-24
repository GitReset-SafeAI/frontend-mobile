import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import type {
  ApproximateLocation,
  CrowdLevel,
  IncidentTime,
  LightingLevel,
  NearbyAnswer,
  ReportReceipt,
  ReportSubmission,
} from '../../services/contracts';

export interface ReportDraft {
  description: string;
  inputMethod: 'typed' | 'voice';
  // True while a voice transcript has not yet been confirmed by the user.
  transcriptPending: boolean;
  occurredWhen?: IncidentTime;
  location?: ApproximateLocation;
  lighting?: LightingLevel;
  crowd?: CrowdLevel;
  othersNearby?: NearbyAnswer;
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
  const [draft, setDraft] = useState<ReportDraft>(emptyDraft);
  const [receipt, setReceipt] = useState<ReportReceipt | undefined>();
  const update = useCallback((patch: Partial<ReportDraft>) => { setDraft((current) => ({ ...current, ...patch })); }, []);
  const reset = useCallback(() => { setDraft(emptyDraft); setReceipt(undefined); }, []);
  const value = useMemo(() => ({ draft, update, receipt, setReceipt, reset }), [draft, update, receipt, reset]);
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
    occurredWhen: draft.occurredWhen,
    location: draft.location,
    lighting: draft.lighting,
    crowd: draft.crowd,
    othersNearby: draft.othersNearby,
  };
}
