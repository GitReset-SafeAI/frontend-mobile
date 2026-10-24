import { screen } from '@testing-library/react-native';

import { SafetyMapScreen } from '../features/safety';
import i18n from '../i18n';
import { renderWithProviders } from './renderWithProviders';

describe('safety map in Tamil', () => {
  afterEach(async () => { await i18n.changeLanguage('en'); });

  it('shows the map screen, its limits and its legend in Tamil', async () => {
    await i18n.changeLanguage('ta');
    const { queryClient } = await renderWithProviders(<SafetyMapScreen />);

    expect(await screen.findByText('இந்தப் பகுதிகளின் பொருள்')).toBeTruthy();
    expect(screen.getByText('உங்கள் பயணத்தை ஆராயுங்கள்')).toBeTruthy();
    expect(screen.getByText('பாதுகாப்புத் தகவலுக்கு வரம்புகள் உண்டு')).toBeTruthy();
    // The English strings are not what is on screen.
    expect(screen.queryByText('What these areas mean')).toBeNull();
    expect(screen.queryByText('Explore your journey')).toBeNull();
    queryClient.clear();
  });

  it('translates the journey planner controls', async () => {
    await i18n.changeLanguage('ta');
    const { queryClient } = await renderWithProviders(<SafetyMapScreen />);
    await screen.findByText('இந்தப் பகுதிகளின் பொருள்');

    expect(screen.getByText('பாதைகளை ஒப்பிடு')).toBeTruthy();
    expect(screen.getByText('எனது இருப்பிடத்தைப் பயன்படுத்து')).toBeTruthy();
    expect(screen.queryByText('Compare routes')).toBeNull();
    queryClient.clear();
  });
});
