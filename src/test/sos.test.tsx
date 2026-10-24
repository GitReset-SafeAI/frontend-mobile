import { act, fireEvent, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { RootNavigator } from '../app/navigation/RootNavigator';
import i18n from '../i18n';
import { renderWithProviders } from './renderWithProviders';

describe('SOS flow', () => {
  let openURL: jest.SpyInstance;

  beforeEach(async () => {
    await i18n.changeLanguage('en');
    openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  });
  afterEach(() => {
    jest.useRealTimers();
    openURL.mockRestore();
  });

  it('starts a cancellable countdown toward the primary contact without calling immediately', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />);
    await fireEvent.press(screen.getByLabelText('SOS. Emergency help'));
    expect(await screen.findByText('Calling Amma in')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(openURL).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText('Cancel'));
    expect(await screen.findByLabelText('SOS. Emergency help')).toBeTruthy();
    expect(openURL).not.toHaveBeenCalled();
    queryClient.clear();
  });

  it('calls the primary contact right away from "Call now" and offers the others', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />, {
      contacts: [
        { name: 'Amma', phone: '+94771234567' },
        { name: 'Kasun', phone: '+94112345678' },
      ],
    });
    await fireEvent.press(screen.getByLabelText('SOS. Emergency help'));
    await fireEvent.press(await screen.findByText('Call now'));
    expect(openURL).toHaveBeenCalledWith('tel:+94771234567');
    expect(await screen.findByText('Call started')).toBeTruthy();
    expect(screen.getByText('Call Amma again')).toBeTruthy();
    await fireEvent.press(screen.getByText('Call Kasun'));
    expect(openURL).toHaveBeenLastCalledWith('tel:+94112345678');
    queryClient.clear();
  });

  it('dials the primary contact automatically when the countdown finishes', async () => {
    jest.useFakeTimers();
    const { queryClient } = await renderWithProviders(<RootNavigator />);
    await fireEvent.press(screen.getByLabelText('SOS. Emergency help'));
    for (let second = 0; second < 5; second += 1) {
      await act(async () => { jest.advanceTimersByTime(1000); });
    }
    expect(openURL).toHaveBeenCalledWith('tel:+94771234567');
    queryClient.clear();
  });

  it('shows the number to dial if the phone cannot be opened', async () => {
    openURL.mockRejectedValue(new Error('no dialer'));
    const { queryClient } = await renderWithProviders(<RootNavigator />);
    await fireEvent.press(screen.getByLabelText('SOS. Emergency help'));
    await fireEvent.press(await screen.findByText('Call now'));
    expect(await screen.findByText("We couldn't open the phone")).toBeTruthy();
    expect(screen.getByText('Please dial 077 123 4567 on your phone now.')).toBeTruthy();
    queryClient.clear();
  });

  it('never dials anyone without a contact: a signed-in user with none is asked to add one', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />, { contacts: [] });
    await fireEvent.press(screen.getByLabelText('SOS. Emergency help'));
    expect(await screen.findByText('Add an emergency contact first')).toBeTruthy();
    expect(screen.queryByText('Call now')).toBeNull();
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
    expect(screen.getByText('Calls your emergency contact after a 5-second countdown. You can cancel.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('SOS. Emergency help'));
    await screen.findByText('Calling Amma in');
    expect(screen.queryByText(/\b119\b|\b1990\b|police|ambulance/i)).toBeNull();
    queryClient.clear();
  });
});
