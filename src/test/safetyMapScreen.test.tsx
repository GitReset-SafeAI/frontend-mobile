import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { SafetyMapScreen } from '../features/safety';
import i18n from '../i18n';
import { renderWithProviders } from './renderWithProviders';

const start = { latitude: 6.8872, longitude: 79.8597 };
const end = { latitude: 6.8951, longitude: 79.8541 };

async function tapMap(coordinate: { latitude: number; longitude: number }) {
  return fireEvent(screen.getByTestId('safety-map'), 'press', { nativeEvent: { coordinate } });
}

describe('safety map screen', () => {
  beforeEach(async () => { await i18n.changeLanguage('en'); });

  it('shows reported areas with their limitations rather than a bare map', async () => {
    const { queryClient } = await renderWithProviders(<SafetyMapScreen />);

    expect(await screen.findByText('What these areas mean')).toBeTruthy();
    expect(screen.getByText(/not where harassment actually occurs/)).toBeTruthy();
    expect(screen.getByText(/No route can be guaranteed safe/)).toBeTruthy();
    queryClient.clear();
  });

  it('plans a journey from two map taps and explains every route', async () => {
    const { queryClient } = await renderWithProviders(<SafetyMapScreen />);
    await screen.findByText('What these areas mean');

    // Setting the start advances to the destination, as in a familiar map app.
    expect(screen.getByText(/Tap the map to set your starting point/)).toBeTruthy();
    await tapMap(start);
    expect(await screen.findByText(/Tap the map to set where you are going/)).toBeTruthy();
    await tapMap(end);

    await fireEvent.press(screen.getByText('Compare routes'));

    expect(await screen.findByText('Fastest route')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Another route')).toBeTruthy());
    // Each route is explained, not only ranked.
    expect(screen.getAllByText(/Passes|min/).length).toBeGreaterThan(0);
    expect(screen.getByText(/No route is guaranteed to be safe/)).toBeTruthy();
    queryClient.clear();
  });

  it('clears a planned journey', async () => {
    const { queryClient } = await renderWithProviders(<SafetyMapScreen />);
    await screen.findByText('What these areas mean');

    await tapMap(start);
    expect(
      await screen.findByText(`Start: ${start.latitude.toFixed(4)}, ${start.longitude.toFixed(4)}`),
    ).toBeTruthy();

    await fireEvent.press(screen.getByText('Clear'));
    await waitFor(() => expect(screen.getByText('Start: Not set')).toBeTruthy());
    queryClient.clear();
  });

  it('explains a declined location permission without blocking the flow', async () => {
    const { queryClient } = await renderWithProviders(<SafetyMapScreen />);
    await screen.findByText('What these areas mean');

    await fireEvent.press(screen.getByText('Use my location'));

    expect(await screen.findByText(/Location permission was declined/)).toBeTruthy();
    // Tapping the map must still work after a denial.
    await tapMap(start);
    expect(
      await screen.findByText(`Start: ${start.latitude.toFixed(4)}, ${start.longitude.toFixed(4)}`),
    ).toBeTruthy();
    queryClient.clear();
  });
});
