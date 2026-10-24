import { fireEvent, screen } from '@testing-library/react-native';

import { RootNavigator } from '../app/navigation/RootNavigator';
import i18n from '../i18n';
import { renderWithProviders } from './renderWithProviders';

describe('foundation navigation and providers', () => {
  beforeEach(async () => { await i18n.changeLanguage('en'); });

  it('renders the report tab and loads the selected demo service', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />);
    expect(screen.getByText('Share an incident')).toBeTruthy();
    expect(await screen.findByText('The demo service is available. No report has been submitted.')).toBeTruthy();
    queryClient.clear();
  });

  it('opens the Safety Map tab and explains the limits of route indicators', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />);
    await screen.findByText('The demo service is available. No report has been submitted.');
    await fireEvent.press(screen.getByLabelText('Safety Map tab'));
    expect(await screen.findByText('Explore your journey')).toBeTruthy();
    // The caveat is a section heading; its detail sits one tap inside.
    expect(screen.getByText('Safety information has limits')).toBeTruthy();
    queryClient.clear();
  });

  it('switches interface text and navigation labels to Sinhala', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />);
    await screen.findByText('The demo service is available. No report has been submitted.');
    await fireEvent.press(screen.getByLabelText('සිංහල'));
    expect(await screen.findByText('සිදුවීමක් වාර්තා කරන්න')).toBeTruthy();
    expect(screen.getByLabelText('ආරක්ෂක සිතියම් ටැබය')).toBeTruthy();
    queryClient.clear();
  });
});
