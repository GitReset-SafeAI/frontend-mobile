import { selectServices } from '../services';
import { reportReceiptSchema, reportSubmissionSchema } from '../services/contracts/incident';

describe('report services', () => {
  it('accepts a report with only a description; context stays optional', () => {
    expect(reportSubmissionSchema.safeParse({ description: 'Someone followed me home.', inputMethod: 'typed' }).success).toBe(true);
    expect(reportSubmissionSchema.safeParse({ description: 'short', inputMethod: 'typed' }).success).toBe(false);
  });

  it('retains synthetic submissions in mock mode without requiring an AI result', async () => {
    const { reports } = selectServices('mock');
    const followed = await reports.submitReport({ description: 'A man followed me from the bus stand.', inputMethod: 'typed' });
    expect(reportReceiptSchema.parse(followed).reportId).toMatch(/^mock-/);
    expect(Number.isNaN(Date.parse(followed.submittedAt))).toBe(false);
    expect(followed).not.toHaveProperty('analysis');
  });

  it('fails explicitly in API mode instead of falling back to mock data', async () => {
    const api = selectServices('api');
    await expect(api.reports.submitReport({ description: 'Someone followed me home.', inputMethod: 'typed' }))
      .rejects.toMatchObject({ kind: 'unauthorized', status: 401 });
  });
});
