import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { AppState, Linking } from 'react-native';

import { RootNavigator } from '../app/navigation/RootNavigator';
import { env } from '../config/env';
import { formatPhone } from '../features/account/phone';
import i18n from '../i18n';
import { getSupabaseClient } from '../services/auth/supabaseClient';
import { mockServices } from '../services/mocks';
import { renderWithProviders } from './renderWithProviders';

jest.mock('../services/auth/supabaseClient', () => ({ getSupabaseClient: jest.fn() }));

jest.setTimeout(20_000);

function response(body: unknown, status: number) {
  return { ok: true, status, text: async () => JSON.stringify(body) } as Response;
}

async function configureLiveSharing() {
  env.authMode = 'supabase';
  env.apiBaseUrl = 'https://api.example.invalid';
  env.publicAppUrl = 'https://web.example.invalid';
  const user = await mockServices.auth.getSession();
  const getSession = async () => ({
    data: { session: { user, access_token: 'test-access', refresh_token: 'test-refresh', expires_at: Date.now() / 1000 + 3600 } },
    error: null,
  });
  jest.mocked(getSupabaseClient).mockReturnValue({ auth: { getSession } } as unknown as ReturnType<typeof getSupabaseClient>);
}

describe('SOS flow', () => {
  let openURL: jest.SpyInstance;
  const originalEnv = { ...env };

  beforeEach(async () => {
    await i18n.changeLanguage('en');
    jest.clearAllMocks();
    openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  });
  afterEach(() => {
    Object.assign(env, originalEnv);
    jest.restoreAllMocks();
  });

  it('offers Call and Send location without automatically contacting anyone', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />);
    await fireEvent.press(screen.getByLabelText('SOS. Emergency help'));
    expect(await screen.findByText('How would you like to get help?')).toBeTruthy();
    expect(screen.getByText('Call')).toBeTruthy();
    expect(screen.getByText('Send location')).toBeTruthy();
    expect(openURL).not.toHaveBeenCalled();
    expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText('Close'));
    expect(await screen.findByLabelText('SOS. Emergency help')).toBeTruthy();
    queryClient.clear();
  });

  it('calls the primary contact only when Call is pressed', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />);
    await fireEvent.press(screen.getByLabelText('SOS. Emergency help'));
    await fireEvent.press(await screen.findByText('Call'));
    expect(openURL).toHaveBeenCalledWith('tel:+94771234567');
    queryClient.clear();
  });

  it('calls a different contact when selected', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />, {
      contacts: [
        { name: 'Amma', phone: '+94771234567' },
        { name: 'Kasun', phone: '+94112345678' },
      ],
    });
    await fireEvent.press(screen.getByLabelText('SOS. Emergency help'));
    await fireEvent.press(await screen.findByLabelText('Emergency contact'));
    await fireEvent.press(await screen.findByText(`Kasun \u2014 ${formatPhone('+94112345678')}`));
    await fireEvent.press(screen.getByText('Call'));
    expect(openURL).toHaveBeenCalledWith('tel:+94112345678');
    queryClient.clear();
  });

  it('shows the number to dial if the phone cannot be opened', async () => {
    openURL.mockRejectedValue(new Error('no dialer'));
    const { queryClient } = await renderWithProviders(<RootNavigator />);
    await fireEvent.press(screen.getByLabelText('SOS. Emergency help'));
    await fireEvent.press(await screen.findByText('Call'));
    expect(await screen.findByText('Please dial 077 123 4567 on your phone now.')).toBeTruthy();
    queryClient.clear();
  });

  it('uploads a fix before opening SMS, updates the share, and revokes it on Stop', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />);
    await configureLiveSharing();
    const now = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now);
    const position: Location.LocationObject = {
      timestamp: now,
      coords: { latitude: 6.9, longitude: 79.8, accuracy: 11, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
    };
    jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValueOnce({ granted: true } as Location.PermissionResponse);
    jest.mocked(Location.getCurrentPositionAsync).mockResolvedValueOnce(position);
    const remove = jest.fn();
    const removeAfterResume = jest.fn();
    jest.mocked(Location.watchPositionAsync)
      .mockResolvedValueOnce({ remove })
      .mockResolvedValueOnce({ remove: removeAfterResume });
    const fix = { position: { latitude: 6.9, longitude: 79.8 }, accuracy_m: 11 };
    const share = {
      ...fix, share_id: 'test-share', updated_at: new Date(now).toISOString(),
      expires_at: new Date(now + 1_800_000).toISOString(),
    };
    const fetch = jest.spyOn(global, 'fetch')
      .mockImplementationOnce(async () => {
        expect(openURL).not.toHaveBeenCalled();
        return response(share, 201);
      })
      .mockResolvedValueOnce(response(share, 200))
      .mockResolvedValueOnce(response(undefined, 204));

    await fireEvent.press(screen.getByLabelText('SOS. Emergency help'));
    const send = await screen.findByText('Send location');
    const onAppState = jest.mocked(AppState.addEventListener).mock.lastCall?.[1];
    expect(onAppState).toBeDefined();
    await act(async () => { onAppState?.('active'); });
    await fireEvent.press(send);
    expect(await screen.findByText('Message preview')).toBeTruthy();
    const [startUrl, startOptions] = fetch.mock.calls[0];
    const base = 'https://api.example.invalid/api/v1/emergency-location-shares';
    expect(startUrl).toBe(base);
    expect(startOptions?.method).toBe('POST');
    expect((startOptions?.headers as Headers).get('Authorization')).toBe('Bearer test-access');
    expect(JSON.parse(startOptions?.body as string)).toEqual(fix);
    const sms = openURL.mock.calls[0][0] as string;
    expect(sms).toMatch(/^sms:\+94771234567[?&]body=/);
    expect(decodeURIComponent(sms)).toContain('https://web.example.invalid/track/test-share');

    await waitFor(() => { expect(Location.watchPositionAsync).toHaveBeenCalledTimes(1); });
    const update = jest.mocked(Location.watchPositionAsync).mock.calls[0][1];
    await act(async () => { update(position); });
    expect(fetch).toHaveBeenCalledTimes(1);
    clock.mockReturnValue(now + 10_000);
    await act(async () => { update(position); });
    expect(fetch.mock.calls[1][0]).toBe(base + '/test-share');
    expect(fetch.mock.calls[1][1]?.method).toBe('PATCH');

    await act(async () => { onAppState?.('background'); });
    expect(remove).toHaveBeenCalledTimes(1);
    await act(async () => { onAppState?.('active'); });
    expect(Location.watchPositionAsync).toHaveBeenCalledTimes(2);

    await fireEvent.press(screen.getByText('Stop sharing location'));
    await waitFor(() => { expect(screen.queryByText('Message preview')).toBeNull(); });
    expect(fetch.mock.calls[2][0]).toBe(base + '/test-share');
    expect(fetch.mock.calls[2][1]?.method).toBe('DELETE');
    expect(removeAfterResume).toHaveBeenCalledTimes(1);
    queryClient.clear();
  });

  it('keeps Call available and creates no SMS or share if location permission is denied', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />);
    await configureLiveSharing();
    const fetch = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Unexpected request.'));
    await fireEvent.press(screen.getByLabelText('SOS. Emergency help'));
    await fireEvent.press(await screen.findByText('Send location'));
    expect(await screen.findByText(/Location is unavailable/)).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
    expect(openURL).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText('Call'));
    expect(openURL).toHaveBeenCalledWith('tel:+94771234567');
    queryClient.clear();
  });

  it('never dials anyone without a contact: a signed-in user with none is asked to add one', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />, { contacts: [] });
    await fireEvent.press(screen.getByLabelText('SOS. Emergency help'));
    expect(await screen.findByText('Add an emergency contact first')).toBeTruthy();
    expect(screen.queryByText('Call')).toBeNull();
    expect(openURL).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText('Add a contact'));
    expect(await screen.findByText('Hello, Nimali')).toBeTruthy();
    queryClient.clear();
  });

  it('never dials anyone as a guest: it sends them to log in', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />, { signedIn: false });
    await fireEvent.press(screen.getByText('Continue without an account'));
    await fireEvent.press(await screen.findByLabelText('SOS. Emergency help'));
    expect(await screen.findByText('Add an emergency contact first')).toBeTruthy();
    expect(openURL).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText('Log in'));
    expect(await screen.findByText('Welcome back')).toBeTruthy();
    queryClient.clear();
  });

  it('no longer mentions police or ambulance numbers on Home or in SOS', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />);
    expect(screen.getByText('Choose Call or Send location. Your phone asks you to confirm the call or send the SMS.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('SOS. Emergency help'));
    await screen.findByText('How would you like to get help?');
    expect(screen.queryByText(/\b119\b|\b1990\b|police|ambulance/i)).toBeNull();
    queryClient.clear();
  });
});
