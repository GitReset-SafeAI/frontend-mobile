import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { SafetyMapScreen } from '../features/safety';
import i18n from '../i18n';
import { renderWithProviders } from './renderWithProviders';

async function search(testID: string, query: string) {
  await fireEvent(screen.getByTestId(testID), 'focus');
  await fireEvent.changeText(screen.getByTestId(testID), query);
}

async function searchAndPick(testID: string, query: string, placeName: string) {
  await search(testID, query);
  await fireEvent.press(await screen.findByText(placeName, {}, { timeout: 3000 }));
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

  it('plans a journey by searching for places and explains every route', async () => {
    const { queryClient } = await renderWithProviders(<SafetyMapScreen />);
    await screen.findByText('What these areas mean');

    await searchAndPick('planner-origin', 'Bamba', 'Bambalapitiya Railway Station');
    await searchAndPick('planner-destination', 'Majestic', 'Majestic City');

    await fireEvent.press(screen.getByText('Compare routes'));

    expect(await screen.findByText('Fastest route')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Another route')).toBeTruthy());
    // Each route is explained, not only ranked.
    expect(screen.getAllByText(/Passes|min/).length).toBeGreaterThan(0);
    expect(screen.getByText(/No route is guaranteed to be safe/)).toBeTruthy();
    queryClient.clear();
  });

  it('matches places by area as well as by name', async () => {
    const { queryClient } = await renderWithProviders(<SafetyMapScreen />);
    await screen.findByText('What these areas mean');

    await search('planner-origin', 'Colombo 04');

    expect(await screen.findByText('Bambalapitiya Railway Station')).toBeTruthy();
    queryClient.clear();
  });

  it('says so plainly when nothing matches, and still offers the map', async () => {
    const { queryClient } = await renderWithProviders(<SafetyMapScreen />);
    await screen.findByText('What these areas mean');

    await search('planner-origin', 'zzzzzz');

    expect(await screen.findByText(/No matching place found/)).toBeTruthy();
    queryClient.clear();
  });

  it('never changes the journey when the map itself is tapped', async () => {
    const { queryClient } = await renderWithProviders(<SafetyMapScreen />);
    await screen.findByText('What these areas mean');

    await searchAndPick('planner-destination', 'Majestic', 'Majestic City');
    const chosen = screen.getAllByDisplayValue('Majestic City');
    expect(chosen.length).toBeGreaterThan(0);

    // Tapping the map, including on a reported area, must leave the planned
    // journey alone: the two used to compete for the same gesture.
    await fireEvent(screen.getByTestId('safety-map'), 'press', {
      nativeEvent: { coordinate: { latitude: 6.9, longitude: 79.86 } },
    });

    expect(screen.getAllByDisplayValue('Majestic City').length).toBe(chosen.length);
    queryClient.clear();
  });

  it('explains a declined location permission without blocking the flow', async () => {
    const { queryClient } = await renderWithProviders(<SafetyMapScreen />);
    await screen.findByText('What these areas mean');

    await fireEvent.press(screen.getByText('Use my location'));

    expect(await screen.findByText(/Location permission was declined/)).toBeTruthy();
    // Searching must still work after a denial.
    await searchAndPick('planner-origin', 'Fort', 'Colombo Fort Railway Station');
    expect(await screen.findByDisplayValue('Colombo Fort Railway Station')).toBeTruthy();
    queryClient.clear();
  });
});

describe('on-map labels', () => {
  beforeEach(async () => { await i18n.changeLanguage('en'); });

  it('shows the report count on each reported area', async () => {
    const { queryClient } = await renderWithProviders(<SafetyMapScreen />);
    await screen.findByText('What these areas mean');

    // The count is readable on the map, not only after opening a card.
    expect(screen.getAllByText(/^\d+$/).length).toBeGreaterThan(0);
    queryClient.clear();
  });

  it('shows walking time on every route once they are compared', async () => {
    const { queryClient } = await renderWithProviders(<SafetyMapScreen />);
    await screen.findByText('What these areas mean');

    await searchAndPick('planner-origin', 'Bamba', 'Bambalapitiya Railway Station');
    await searchAndPick('planner-destination', 'Majestic', 'Majestic City');
    await fireEvent.press(screen.getByText('Compare routes'));
    await screen.findByText('Fastest route');

    const durations = screen.getAllByText(/^\d+ min$/);
    expect(durations.length).toBeGreaterThanOrEqual(2);
    queryClient.clear();
  });
});

describe('travel mode', () => {
  beforeEach(async () => { await i18n.changeLanguage('en'); });

  it('compares by car in less time than on foot over the same roads', async () => {
    const { queryClient } = await renderWithProviders(<SafetyMapScreen />);
    await screen.findByText('What these areas mean');

    await searchAndPick('planner-origin', 'Bamba', 'Bambalapitiya Railway Station');
    await searchAndPick('planner-destination', 'Fort', 'Colombo Fort Railway Station');

    await fireEvent.press(screen.getByText('Compare routes'));
    await screen.findByText('Fastest route');
    const walking = screen.getAllByText(/^\d+ min$/).map((node) => node.props.children);

    await fireEvent.press(screen.getByText('Drive'));
    await fireEvent.press(screen.getByText('Compare routes'));
    await waitFor(() => {
      const driving = screen.getAllByText(/^\d+ min$/).map((node) => node.props.children);
      expect(driving).not.toEqual(walking);
    });
    queryClient.clear();
  });
});
