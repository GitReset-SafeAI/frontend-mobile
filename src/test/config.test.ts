import { parseEnvironment } from '../config/env';
import { mapsConfig } from '../config/maps';

describe('public configuration', () => {
  it('defaults to mock mode without a backend URL', () => {
    expect(parseEnvironment({})).toEqual({ dataMode: 'mock' });
    expect(parseEnvironment({ dataMode: ' ', apiBaseUrl: '' })).toEqual({ dataMode: 'mock' });
  });

  it('allows explicit API mode before a backend URL exists', () => {
    expect(parseEnvironment({ dataMode: 'api' })).toEqual({ dataMode: 'api' });
  });

  it('rejects invalid modes and private credential-bearing URLs without echoing them', () => {
    expect(() => parseEnvironment({ dataMode: 'other' })).toThrow('Invalid public app configuration');
    expect(() => parseEnvironment({ apiBaseUrl: 'https://example.invalid/?token=synthetic' }))
      .toThrow('Invalid public app configuration');
    expect(() => parseEnvironment({ apiBaseUrl: 'file:///example' })).toThrow();
  });

  it('uses a valid country overview without incident data', () => {
    expect(mapsConfig.provider).toBe('platform-default');
    expect(mapsConfig.initialRegion.latitude).toBeGreaterThan(5);
    expect(mapsConfig.initialRegion.latitude).toBeLessThan(10);
  });
});
