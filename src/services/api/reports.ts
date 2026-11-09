import { z } from 'zod';

import i18n from '../../i18n';
import { authenticatedRequest } from '../auth/accessToken';
import type { ReportService, ReportSubmission } from '../contracts/incident';
import { reportSubmissionSchema } from '../contracts/incident';
import { ApiError } from './ApiError';

const languageHintSchema = z.enum(['si', 'si-Latn', 'en', 'ta', 'mixed', 'unknown']);
const lightingSchema = z.enum(['WELL_LIT', 'PARTIALLY_LIT', 'POORLY_LIT_OR_DARK', 'DAYLIGHT', 'UNKNOWN_OR_PREFER_NOT_TO_SAY']);
const lightingMap = { well_lit: 'WELL_LIT', dim: 'PARTIALLY_LIT', dark: 'POORLY_LIT_OR_DARK', unsure: 'UNKNOWN_OR_PREFER_NOT_TO_SAY' } as const;

// Temporary interface-language hint, NOT detection of the language of the user's words.
// Keep this policy at the boundary so later detection does not change the form.
export function reportLanguageHint(language: string): 'en' | 'si' | 'ta' {
  const base = language.toLowerCase().split(/[-_]/)[0];
  if (base === 'en' || base === 'si' || base === 'ta') return base;
  throw new ApiError('validation', 'Select a supported application language before submitting.');
}

export function buildReportRequest(input: ReportSubmission, language: string) {
  const parsed = reportSubmissionSchema.safeParse(input);
  if (!parsed.success) throw new ApiError('validation', 'Check the description, incident date, time and location.');
  const value = parsed.data;
  return {
    original_text: value.description,
    input_method: value.inputMethod === 'typed' ? 'text' as const : 'voice' as const,
    language_hint: reportLanguageHint(language),
    // Do not supply translated_text: omission requests backend translation.
    ...(value.location ? { latitude: value.location.latitude, longitude: value.location.longitude } : {}),
    // Explicit Sri Lanka wall-clock input; no device timezone or default time is inferred.
    ...(value.incidentDate && value.clockTime ? { occurred_at: `${value.incidentDate}T${value.clockTime}:00+05:30` } : {}),
    ...(value.clockTime ? { reported_time: `${Number(value.clockTime.slice(0, 2)) % 12 || 12}:${value.clockTime.slice(3)} ${Number(value.clockTime.slice(0, 2)) < 12 ? 'AM' : 'PM'}` } : {}),
    ...(value.timePeriod ? { reported_time: value.timePeriod } : {}),
    ...(value.lighting ? { lighting_condition: lightingMap[value.lighting] } : {}),
  };
}

// Complete saved-report contract, separate from the mobile receipt and any future AI result.
export const savedReportSchema = z.object({
  id: z.uuid(),
  submitted_at: z.iso.datetime({ offset: true }),
  original_text: z.string().min(1).max(5000).refine((s) => Boolean(s.trim())),
  translated_text: z.string().min(1).max(5000).refine((s) => Boolean(s.trim())),
  input_method: z.enum(['text', 'voice']),
  language_hint: languageHintSchema,
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  occurred_at: z.iso.datetime({ offset: true }).nullable().optional(),
  lighting_condition: lightingSchema.nullable().optional(),
  reported_time: z.string().min(1).max(100).nullable().optional(),
  current_safety_status: z.enum(['SAFE_NOW', 'UNSURE', 'MAY_STILL_BE_IN_DANGER', 'PREFER_NOT_TO_SAY']).nullable().optional(),
  RAPID_SUBMISSIONS: z.boolean().default(false),
}).refine((value) => (value.latitude == null) === (value.longitude == null));

export const submitApiReport: ReportService['submitReport'] = async (submission, context) => {
  const json = buildReportRequest(submission, i18n.language);
  const saved = await authenticatedRequest('/reports', savedReportSchema, {
    method: 'POST', json, expectedUserId: context?.userId,
    // Translation and persistence can take longer than ordinary reads. Never retry a POST.
    timeoutMs: 90_000,
  });
  return { reportId: saved.id, submittedAt: saved.submitted_at, originalText: saved.original_text };
};
