import { createReportSubmitter } from '../features/reporting/submitReport';
import type { ReportReceipt } from '../services/contracts';

const input = { description: 'Someone followed me home.', inputMethod: 'typed' as const };
const receipt = { reportId: 'test-report', submittedAt: '2026-11-09T12:00:00Z', originalText: input.description };

describe('report submission ownership and duplicate protection', () => {
  it('rejects unauthenticated submission without calling the service', async () => {
    const service = jest.fn();
    await expect(createReportSubmitter(service, () => undefined)(input)).rejects.toMatchObject({ status: 401 });
    expect(service).not.toHaveBeenCalled();
  });
  it('allows one explicit submission and rejects repeated taps while it is pending', async () => {
    let complete!: (value: ReportReceipt) => void;
    const service = jest.fn(() => new Promise<ReportReceipt>((resolve) => { complete = resolve; }));
    const submit = createReportSubmitter(service, () => 'owner-a');
    const first = submit(input);
    await expect(submit(input)).rejects.toMatchObject({ status: 409 });
    expect(service).toHaveBeenCalledTimes(1);
    expect(service).toHaveBeenCalledWith(input, { userId: 'owner-a' });
    complete(receipt);
    await expect(first).resolves.toEqual(receipt);
  });
  it('never returns the previous owner receipt after an account change', async () => {
    let owner = 'owner-a';
    let complete!: (value: ReportReceipt) => void;
    const submit = createReportSubmitter(() => new Promise((resolve) => { complete = resolve; }), () => owner);
    const first = submit(input);
    owner = 'owner-b'; complete(receipt);
    await expect(first).rejects.toMatchObject({ kind: 'cancelled' });
  });
  it('retains a failure and only submits again on an explicit new action', async () => {
    const service = jest.fn().mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(receipt);
    const submit = createReportSubmitter(service, () => 'owner-a');
    await expect(submit(input)).rejects.toThrow('Offline');
    expect(service).toHaveBeenCalledTimes(1);
    await expect(submit(input)).resolves.toEqual(receipt);
    expect(service).toHaveBeenCalledTimes(2);
  });
});
