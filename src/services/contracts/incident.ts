import { z } from 'zod';

// Provisional mobile-facing models, NOT agreed FastAPI schemas. See docs/contract-decisions.md.
// Category and severity vocabularies must be agreed by the whole team before the backend adopts them.

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

export const incidentTimes = ['just_now', 'today', 'yesterday', 'this_week', 'earlier'] as const;
export type IncidentTime = (typeof incidentTimes)[number];

export const lightingLevels = ['well_lit', 'dim', 'dark', 'unsure'] as const;
export type LightingLevel = (typeof lightingLevels)[number];

export const crowdLevels = ['empty', 'few', 'crowded', 'unsure'] as const;
export type CrowdLevel = (typeof crowdLevels)[number];

export const nearbyAnswers = ['yes', 'no', 'unsure'] as const;
export type NearbyAnswer = (typeof nearbyAnswers)[number];

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

// Only the description is required. Every contextual answer is optional.
export const reportSubmissionSchema = z.object({
  description: z.string().trim().min(DESCRIPTION_MIN_LENGTH).max(DESCRIPTION_MAX_LENGTH),
  inputMethod: z.enum(['typed', 'voice']),
  occurredWhen: z.enum(incidentTimes).optional(),
  location: approximateLocationSchema.optional(),
  lighting: z.enum(lightingLevels).optional(),
  crowd: z.enum(crowdLevels).optional(),
  othersNearby: z.enum(nearbyAnswers).optional(),
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
  analysis: incidentAnalysisSchema,
});
export type ReportReceipt = z.infer<typeof reportReceiptSchema>;

export interface VoiceTranscript {
  text: string;
}

export interface ReportService {
  submitReport(submission: ReportSubmission): Promise<ReportReceipt>;
  // Audio upload mechanics are an open question (see contract decisions); the mock takes no audio.
  transcribeVoice(): Promise<VoiceTranscript>;
}
