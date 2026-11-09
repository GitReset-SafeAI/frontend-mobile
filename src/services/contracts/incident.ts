import { z } from 'zod';

// Mobile form models are mapped to the FastAPI contract in services/api/reports.ts.
// AI category/severity models remain separate; submission returns a saved report, not analysis.

export const incidentCategories = [
  'verbal_harassment',
  'following',
  'physical_assault',
  'theft',
  'unsafe_conditions',
  'transport_issue',
  'other',
] as const;
export const incidentCategorySchema = z.enum(incidentCategories);
export type IncidentCategory = z.infer<typeof incidentCategorySchema>;

// `unknown` means "not enough information", never "low".
export const severityLevels = ['low', 'moderate', 'high', 'unknown'] as const;
export type SeverityLevel = (typeof severityLevels)[number];

export const confidenceLevels = ['low', 'medium', 'high'] as const;
export type ConfidenceLevel = (typeof confidenceLevels)[number];

export const incidentTimes = ['morning', 'afternoon', 'evening', 'night', 'late_night', 'not_sure'] as const;
export type IncidentTime = (typeof incidentTimes)[number];

export const lightingLevels = ['well_lit', 'dim', 'dark', 'unsure'] as const;
export type LightingLevel = (typeof lightingLevels)[number];

export const DESCRIPTION_MIN_LENGTH = 10;
export const DESCRIPTION_MAX_LENGTH = 1000;

// Explicit { latitude, longitude } at UI boundaries. Always approximate (rounded), never a precise point.
export const approximateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  source: z.enum(['device', 'district']),
  districtId: z.string().optional(),
});
export type ApproximateLocation = z.infer<typeof approximateLocationSchema>;

// Optional context stays optional; a date alone cannot be represented by the backend.
export const reportTimingSchema = z.object({
  incidentDate: z.string().optional(),
  clockTime: z.string().optional(),
  timePeriod: z.enum(incidentTimes).optional(),
}).superRefine((value, ctx) => {
  const date = value.incidentDate;
  const time = value.clockTime;
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number(date.slice(0, 4)) < 1 || Number.isNaN(Date.parse(`${date}T00:00:00Z`))
    || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date)) {
    ctx.addIssue({ code: 'custom', path: ['incidentDate'], message: 'Enter a valid date (YYYY-MM-DD).' });
  }
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    ctx.addIssue({ code: 'custom', path: ['clockTime'], message: 'Enter a 24-hour time (HH:mm).' });
  }
  if (date && !time) ctx.addIssue({ code: 'custom', path: ['clockTime'], message: 'A date needs a clock time.' });
  if (time && value.timePeriod) ctx.addIssue({ code: 'custom', path: ['timePeriod'], message: 'Choose a clock time or a time period.' });
});
// Keep the existing mobile description limits (a compatible subset of the backend's 1–5000).
export const reportSubmissionSchema = reportTimingSchema.safeExtend({
  description: z.string().trim().min(DESCRIPTION_MIN_LENGTH).max(DESCRIPTION_MAX_LENGTH),
  inputMethod: z.enum(['typed', 'voice']),
  location: approximateLocationSchema.optional(),
  lighting: z.enum(lightingLevels).optional(),
});
export type ReportSubmission = z.infer<typeof reportSubmissionSchema>;

export const extractedDetailKinds = ['place', 'vehicle', 'behaviour'] as const;
export const missingInformationKinds = ['time', 'location', 'people'] as const;

// The AI's interpretation. Always an estimate; kept separate from the user's original words.
export const incidentAnalysisSchema = z.object({
  category: incidentCategorySchema,
  severity: z.enum(severityLevels),
  confidence: z.enum(confidenceLevels),
  extractedDetails: z.array(z.object({
    kind: z.enum(extractedDetailKinds),
    value: z.string(),
  })),
  missingInformation: z.array(z.enum(missingInformationKinds)),
});
export type IncidentAnalysis = z.infer<typeof incidentAnalysisSchema>;

export const reportReceiptSchema = z.object({
  reportId: z.string(),
  submittedAt: z.iso.datetime({ offset: true }),
  originalText: z.string().min(1),
});
export type ReportReceipt = z.infer<typeof reportReceiptSchema>;

export interface VoiceTranscript {
  text: string;
}

export interface ReportService {
  submitReport(submission: ReportSubmission, context?: { userId: string }): Promise<ReportReceipt>;
  // Audio upload mechanics are an open question (see contract decisions); the mock takes no audio.
  transcribeVoice(): Promise<VoiceTranscript>;
}
