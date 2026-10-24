import { selectServices, services } from '../services';
import { ApiError } from '../services/api/ApiError';
import { serviceStatusSchema } from '../services/contracts/status';

describe('provisional service boundary', () => {
  it('selects mock mode by default and returns a valid synthetic result', async () => {
    const result = await services.status.getStatus();
    expect(serviceStatusSchema.parse(result)).toEqual({ source: 'mock', state: 'available' });
    expect(services).toBe(selectServices('mock'));
  });

  it('returns independent mock results', async () => {
    const service = selectServices('mock').status;
    expect(await service.getStatus()).not.toBe(await service.getStatus());
  });

  it('fails explicitly in API mode without fetching or falling back to mock success', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    try {
      await expect(selectServices('api').status.getStatus()).rejects.toMatchObject({
        kind: 'not-implemented', name: 'ApiError',
      } satisfies Partial<ApiError>);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally { fetchSpy.mockRestore(); }
  });
});
