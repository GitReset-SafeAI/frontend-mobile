import { fireEvent, screen } from '@testing-library/react-native';
import * as Location from 'expo-location';

import { RootNavigator } from '../app/navigation/RootNavigator';
import i18n from '../i18n';
import { renderWithProviders } from './renderWithProviders';

async function openReport() {
  const rendered = await renderWithProviders(<RootNavigator />);
  await fireEvent.press(screen.getByLabelText('Report incident tab'));
  await screen.findByText('What happened?');
  return rendered;
}

describe('report flow', () => {
  beforeEach(async () => { await i18n.changeLanguage('en'); });

  it('blocks an empty description with a helpful message, then lets the user continue', async () => {
    const { queryClient } = await openReport();
    await fireEvent.press(screen.getByText('Next'));
    expect(await screen.findByText(/Please write at least 10 characters/)).toBeTruthy();
    expect(screen.queryByText('When and where?')).toBeNull();
    await fireEvent.changeText(screen.getByLabelText('Describe the incident'), 'A man followed me from the bus stand.');
    await fireEvent.press(screen.getByText('Next'));
    expect(await screen.findByText('When and where?')).toBeTruthy();
    queryClient.clear();
  });

  it('lets optional steps be skipped and submits, showing the AI estimate apart from the user words', async () => {
    const { queryClient } = await openReport();
    await fireEvent.changeText(screen.getByLabelText('Describe the incident'), 'A man followed me from the bus stand.');
    await fireEvent.press(screen.getByText('Next'));
    await fireEvent.press(await screen.findByText('Skip'));
    await fireEvent.press(await screen.findByText('Skip'));
    expect(await screen.findByText('Review and submit')).toBeTruthy();
    expect(screen.getAllByText('Not provided').length).toBe(2);
    await fireEvent.press(screen.getByText('Submit report'));

    expect(await screen.findByText('Report received')).toBeTruthy();
    expect(screen.getByText('Your words')).toBeTruthy();
    expect(screen.getByText('A man followed me from the bus stand.')).toBeTruthy();
    expect(screen.getByText('How our AI read your report')).toBeTruthy();
    expect(screen.getByText(/not a verified fact/)).toBeTruthy();
    expect(screen.getByText('Being followed')).toBeTruthy();
    queryClient.clear();
  });

  it('requires a voice transcript to be confirmed before continuing', async () => {
    const { queryClient } = await openReport();
    await fireEvent.press(screen.getByText('Speak instead'));
    await fireEvent.press(await screen.findByText('Start'));
    await fireEvent.press(await screen.findByText('Stop and transcribe'));
    expect(await screen.findByText('The transcript looks right')).toBeTruthy();

    await fireEvent.press(screen.getByText('Next'));
    expect(await screen.findByText('Please confirm the transcript to continue.')).toBeTruthy();
    await fireEvent.press(screen.getByText('The transcript looks right'));
    await fireEvent.press(screen.getByText('Next'));
    expect(await screen.findByText('When and where?')).toBeTruthy();
    queryClient.clear();
  });

  it('keeps the draft when switching tabs mid-report', async () => {
    const { queryClient } = await openReport();
    await fireEvent.changeText(screen.getByLabelText('Describe the incident'), 'Someone shouted at me near the market.');
    await fireEvent.press(screen.getByLabelText('Home tab'));
    await fireEvent.press(screen.getByLabelText('Report incident tab'));
    expect(screen.getByDisplayValue('Someone shouted at me near the market.')).toBeTruthy();
    queryClient.clear();
  });

  it('records a district without any location permission', async () => {
    const { queryClient } = await openReport();
    await fireEvent.changeText(screen.getByLabelText('Describe the incident'), 'Someone shouted at me near the market.');
    await fireEvent.press(screen.getByText('Next'));
    await fireEvent.press(await screen.findByText('Choose a district'));
    await fireEvent.press(await screen.findByLabelText('Kandy'));
    expect(await screen.findByText('Kandy district')).toBeTruthy();
    expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    queryClient.clear();
  });

  it('asks for location only on tap, and falls back gracefully when denied', async () => {
    jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValueOnce({ status: 'denied' } as never);
    const { queryClient } = await openReport();
    await fireEvent.changeText(screen.getByLabelText('Describe the incident'), 'Someone shouted at me near the market.');
    await fireEvent.press(screen.getByText('Next'));
    await fireEvent.press(await screen.findByText('Use my current location'));
    expect(await screen.findByText(/Location permission is off/)).toBeTruthy();
    expect(screen.getByText('Choose a district')).toBeTruthy();
    queryClient.clear();
  });
});
