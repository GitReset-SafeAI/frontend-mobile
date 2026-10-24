import type { IncidentAnalysis, ReportSubmission } from '../../contracts';

// SYNTHETIC keyword heuristics so the mock results vary. This is NOT the real classifier,
// and client-side inference is not part of the product: the backend/LLM does the real analysis.
const categoryKeywords: [IncidentAnalysis['category'], RegExp][] = [
  ['following', /follow|stalk|පසුපස/i],
  ['physical_assault', /grab|touch|hit|push|assault|attack|අල්ලා|ගැහුවා/i],
  ['theft', /steal|stole|snatch|rob|bag|phone|සොරක|උදුරා/i],
  ['verbal_harassment', /shout|whistl|comment|harass|abuse|catcall|බැන|හිරිහැර/i],
  ['transport_issue', /driver|conductor|three-?wheel|tuk|taxi|ride|රියදුරු/i],
  ['unsafe_conditions', /dark|lonely|isolated|no light|empty road|අඳුරු/i],
];
const vehicleWords = /\b(bus|train|tuk|three-?wheeler|taxi|van|motorbike)\b/i;
const placeWords = /\b(station|bus stand|junction|market|lane|road|beach|bridge|park)\b/i;

export function analyseSyntheticReport(submission: ReportSubmission): IncidentAnalysis {
  const matched = categoryKeywords.find(([, pattern]) => pattern.test(submission.description));
  const category = matched?.[0] ?? 'other';

  const extractedDetails: IncidentAnalysis['extractedDetails'] = [];
  const place = placeWords.exec(submission.description);
  const vehicle = vehicleWords.exec(submission.description);
  if (place) extractedDetails.push({ kind: 'place', value: place[0] });
  if (vehicle) extractedDetails.push({ kind: 'vehicle', value: vehicle[0] });

  const missingInformation: IncidentAnalysis['missingInformation'] = [];
  if (!submission.occurredWhen) missingInformation.push('time');
  if (!submission.location) missingInformation.push('location');

  const severity: IncidentAnalysis['severity'] =
    category === 'physical_assault' ? 'high'
      : category === 'other' ? 'unknown'
        : category === 'following' || category === 'theft' ? 'moderate'
          : 'low';

  return {
    category,
    severity,
    confidence: matched ? (submission.description.length > 60 ? 'medium' : 'low') : 'low',
    extractedDetails,
    missingInformation,
  };
}

export const sampleTranscript =
  'A man on the bus kept staring at me and then followed me when I got off near the station.';
