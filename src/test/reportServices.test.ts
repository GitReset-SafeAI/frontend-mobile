import { selectServices } from '../services';
import { incidentAnalysisSchema, reportSubmissionSchema } from '../services/contracts/incident';

describe('report services', () => {
  it('accepts a report with only a description; context stays optional', () => {
    expect(reportSubmissionSchema.safeParse({ description: 'Someone followed me home.', inputMethod: 'typed' }).success).toBe(true);
    expect(reportSubmissionSchema.safeParse({ description: 'short', inputMethod: 'typed' }).success).toBe(false);
  });

  it('returns a valid AI estimate and keeps unknown severity distinct from low', async () => {
    const { reports } = selectServices('mock');
    const followed = await reports.submitReport({ description: 'A man followed me from the bus stand.', inputMethod: 'typed' });
    expect(incidentAnalysisSchema.parse(followed.analysis).category).toBe('following');
    expect(followed.analysis.missingInformation).toEqual(['time', 'location']);

    const vague = await reports.submitReport({ description: 'Something felt wrong tonight.', inputMethod: 'typed' });
    expect(vague.analysis.severity).toBe('unknown');
  });

  it('fails explicitly in API mode instead of falling back to mock data', async () => {
    const api = selectServices('api');
    await expect(api.reports.submitReport({ description: 'Someone followed me home.', inputMethod: 'typed' }))
      .rejects.toMatchObject({ kind: 'not-implemented' });
  });
});
