import { fireEvent, screen } from '@testing-library/react-native';

import { RootNavigator } from '../app/navigation/RootNavigator';
import i18n from '../i18n';
import { renderWithProviders } from './renderWithProviders';

describe('navigation shell', () => {
  beforeEach(async () => { await i18n.changeLanguage('en'); });

  it('opens on a home screen with one SOS button and four tabs', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />);
    expect(screen.getByLabelText('SOS. Emergency help')).toBeTruthy();
    expect(screen.getByText('Tap for emergency help')).toBeTruthy();
    expect(screen.getByLabelText('Home tab')).toBeTruthy();
    expect(screen.getByLabelText('Report incident tab')).toBeTruthy();
    expect(screen.getByLabelText('Safety Map tab')).toBeTruthy();
    expect(screen.getByLabelText('Account tab')).toBeTruthy();
    queryClient.clear();
  });

  it('shows the real report flow on the Report tab, with SOS one tap away', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />);
    await fireEvent.press(screen.getByLabelText('Report incident tab'));
    expect(await screen.findByText('What happened?')).toBeTruthy();
    expect(screen.getByLabelText('SOS emergency help')).toBeTruthy();
    queryClient.clear();
  });

  it('opens the Safety Map tab, keeps its limits visible, and keeps SOS one tap away', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />);
    await fireEvent.press(screen.getByLabelText('Safety Map tab'));
    expect(await screen.findByText('Explore your journey')).toBeTruthy();
    // The caveat is a section heading; its detail sits one tap inside.
    expect(screen.getByText('Safety information has limits')).toBeTruthy();
    expect(screen.getAllByLabelText('SOS emergency help').length).toBeGreaterThan(0);
    queryClient.clear();
  });

  it('offers Tamil in the map screen\'s own language switcher too', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />);
    await fireEvent.press(screen.getByLabelText('Safety Map tab'));
    await screen.findByText('Explore your journey');
    expect(screen.getByLabelText('English')).toBeTruthy();
    expect(screen.getByLabelText('සිංහල')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('தமிழ்'));
    expect(await screen.findByLabelText('கணக்கு தாவல்')).toBeTruthy();
    queryClient.clear();
  });

  it('switches interface text and navigation labels to Sinhala and Tamil from the language picker', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />);
    await fireEvent.press(screen.getByLabelText('Interface language: English'));
    expect(screen.getByLabelText('English')).toBeTruthy();
    expect(screen.getByLabelText('සිංහල')).toBeTruthy();
    expect(screen.getByLabelText('தமிழ்')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('සිංහල'));
    expect(await screen.findByText('හදිසි උදව් සඳහා ඔබන්න')).toBeTruthy();
    expect(screen.getByLabelText('ආරක්ෂක සිතියම් ටැබය')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText(/සිංහල/));
    await fireEvent.press(screen.getByLabelText('தமிழ்'));
    expect(await screen.findByText('அவசர உதவிக்குத் தட்டவும்')).toBeTruthy();
    expect(screen.getByLabelText('கணக்கு தாவல்')).toBeTruthy();
    queryClient.clear();
  });
});
