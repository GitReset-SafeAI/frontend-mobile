import { act, renderHook } from '@testing-library/react-native';

import { useAuth } from '../features/account/authContext';
import { ReportDraftProvider, useReportDraft } from '../features/reporting/reportDraft';

jest.mock('../features/account/authContext', () => ({ useAuth: jest.fn() }));

describe('private report draft ownership', () => {
  const owner = (id?: string) => {
    jest.mocked(useAuth).mockReturnValue({ user: id ? { id, name: id, email: '' } : null } as ReturnType<typeof useAuth>);
  };
  it('retains the current draft but hides and discards it on account changes or logout', async () => {
    owner('owner-a');
    const hook = await renderHook(() => useReportDraft(), { wrapper: ReportDraftProvider });
    await act(() => { hook.result.current.update({ description: 'Owner A private words.' }); });
    const staleUpdate = hook.result.current.update;
    const staleReceipt = hook.result.current.setReceipt;
    await hook.rerender({});
    expect(hook.result.current.draft.description).toBe('Owner A private words.');
    owner('owner-b'); await hook.rerender({});
    expect(hook.result.current.draft.description).toBe('');
    await act(() => {
      staleUpdate({ description: 'A late update from A.' });
      staleReceipt({ reportId: 'old-report', submittedAt: '2026-11-09T12:00:00Z', originalText: 'Old words.' });
      hook.result.current.update({ description: 'Owner B private words.' });
    });
    expect(hook.result.current.receipt).toBeUndefined();
    owner(); await hook.rerender({});
    expect(hook.result.current.draft.description).toBe('');
    owner('owner-a'); await hook.rerender({});
    expect(hook.result.current.draft.description).toBe('');
  });
});
