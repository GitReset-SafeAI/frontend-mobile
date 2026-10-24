import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { RootNavigator } from '../app/navigation/RootNavigator';
import i18n from '../i18n';
import { renderWithProviders } from './renderWithProviders';

async function fillSignUp(name: string, email: string, password = 'password1') {
  await fireEvent.changeText(screen.getByLabelText('Your name'), name);
  await fireEvent.changeText(screen.getByLabelText('Email'), email);
  await fireEvent.changeText(screen.getByLabelText('Password'), password);
}

// "Create account" is both a tab and the submit button; the submit button comes last.
async function pressCreateAccount() {
  const matches = screen.getAllByText('Create account');
  await fireEvent.press(matches[matches.length - 1]);
}

async function openAccountTab() {
  await fireEvent.press(screen.getByLabelText('Account tab'));
}

async function addContact(name: string, phone: string) {
  await fireEvent.press(screen.getByText('Add a contact'));
  await fireEvent.changeText(await screen.findByLabelText('Name'), name);
  await fireEvent.changeText(screen.getByLabelText('Phone number'), phone);
  await fireEvent.press(screen.getByText('Save contact'));
}

describe('login gate', () => {
  beforeEach(async () => { await i18n.changeLanguage('en'); });

  it('opens on login when nobody is signed in, with no SOS button to mistake for a working one', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />, { signedIn: false });
    expect(await screen.findByText('Welcome back')).toBeTruthy();
    expect(screen.getByText('Use demo account')).toBeTruthy();
    expect(screen.getByText('Continue without an account')).toBeTruthy();
    expect(screen.getByText(/Demo sign-in: no real account is created/)).toBeTruthy();
    expect(screen.queryByLabelText('SOS. Emergency help')).toBeNull();
    queryClient.clear();
  });

  it('explains each problem next to its field and does not sign in', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />, { signedIn: false });
    await fireEvent.press(screen.getAllByText('Create account')[0]);
    await pressCreateAccount();
    expect(await screen.findByText('Please enter your name.')).toBeTruthy();
    expect(screen.getByText('Please enter a valid email address.')).toBeTruthy();
    expect(screen.getByText('Use at least 8 characters.')).toBeTruthy();
    expect(screen.queryByLabelText('SOS. Emergency help')).toBeNull();
    queryClient.clear();
  });

  it('does not log in to an account that does not exist', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />, { signedIn: false });
    await fireEvent.changeText(screen.getByLabelText('Email'), 'nobody@example.lk');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'whatever');
    await fireEvent.press(screen.getAllByText('Log in').slice(-1)[0]);
    expect(await screen.findByText(/couldn't find an account with that email/)).toBeTruthy();
    queryClient.clear();
  });

  it('creates an account and lands on Home', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />, { signedIn: false });
    await fireEvent.press(screen.getAllByText('Create account')[0]);
    await fillSignUp('Dilani', 'dilani@example.lk');
    await pressCreateAccount();
    expect(await screen.findByLabelText('SOS. Emergency help')).toBeTruthy();
    expect(screen.getByText('Tap for emergency help')).toBeTruthy();
    queryClient.clear();
  });

  it('refuses a second account with the same email', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />, { signedIn: false });
    await fireEvent.press(screen.getAllByText('Create account')[0]);
    await fillSignUp('Dilani', 'dilani@example.lk');
    await pressCreateAccount();
    await screen.findByLabelText('SOS. Emergency help');
    await fireEvent.press(screen.getByLabelText('Account tab'));
    await fireEvent.press(await screen.findByText('Log out'));
    await screen.findByText('Welcome back');
    await fireEvent.press(screen.getAllByText('Create account')[0]);
    await fillSignUp('Someone Else', 'DILANI@example.lk');
    await pressCreateAccount();
    expect(await screen.findByText(/account with this email already exists/)).toBeTruthy();
    queryClient.clear();
  });

  it('has a ready-made demo account with sample contacts, one tap away', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />, { signedIn: false });
    await fireEvent.press(screen.getByText('Use demo account'));
    expect(await screen.findByLabelText('SOS. Emergency help')).toBeTruthy();
    await openAccountTab();
    expect(await screen.findByText('Hello, Demo')).toBeTruthy();
    expect(await screen.findByText('Amma (sample)')).toBeTruthy();
    expect(screen.getByText('Friend (sample)')).toBeTruthy();
    expect(screen.getByText('2 of 5')).toBeTruthy();
    queryClient.clear();
  });

  it('lets someone continue without an account, and says what an account is for', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />, { signedIn: false });
    await fireEvent.press(screen.getByText('Continue without an account'));
    expect(await screen.findByLabelText('SOS. Emergency help')).toBeTruthy();
    await openAccountTab();
    expect(await screen.findByText('Log in to add emergency contacts')).toBeTruthy();
    expect(screen.getByText(/You can still report incidents and view the map/)).toBeTruthy();
    queryClient.clear();
  });

  it('switches the login screen to Tamil', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />, { signedIn: false });
    await fireEvent.press(screen.getByLabelText('Interface language: English'));
    await fireEvent.press(screen.getByLabelText('தமிழ்'));
    expect(await screen.findByText('மீண்டும் வருக')).toBeTruthy();
    expect(screen.getByText('டெமோ கணக்கைப் பயன்படுத்து')).toBeTruthy();
    queryClient.clear();
  });
});

describe('emergency contacts', () => {
  beforeEach(async () => { await i18n.changeLanguage('en'); });

  it('shows contacts with the first as primary, in the way people read numbers', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />, {
      contacts: [
        { name: 'Amma', phone: '+94771234567', relationship: 'family' },
        { name: 'Kasun', phone: '+94112345678' },
      ],
    });
    await openAccountTab();
    expect(await screen.findByText('Hello, Nimali')).toBeTruthy();
    expect(await screen.findByText('077 123 4567')).toBeTruthy();
    expect(screen.getByText('011 234 5678')).toBeTruthy();
    expect(screen.getAllByText('Primary')).toHaveLength(1);
    expect(screen.getByText('Family')).toBeTruthy();
    queryClient.clear();
  });

  it('adds a contact from any common way of writing a Sri Lankan number', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />, { contacts: [] });
    await openAccountTab();
    await screen.findByText(/No contacts yet/);
    await addContact('Dilani', '+94 71 876 5432');
    expect(await screen.findByText('071 876 5432')).toBeTruthy();
    expect(screen.getByText('Primary')).toBeTruthy();
    queryClient.clear();
  });

  it('rejects a phone number that is not a Sri Lankan number', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />, { contacts: [] });
    await openAccountTab();
    await screen.findByText(/No contacts yet/);
    await addContact('Someone', '12345');
    expect(await screen.findByText('Enter a valid Sri Lankan phone number.')).toBeTruthy();
    expect(screen.queryByText('Someone')).toBeNull();
    queryClient.clear();
  });

  it('lets you change who SOS calls by making another contact primary', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />, {
      contacts: [
        { name: 'Amma', phone: '+94771234567' },
        { name: 'Kasun', phone: '+94112345678' },
      ],
    });
    await openAccountTab();
    await fireEvent.press(await screen.findByLabelText('Make Kasun the primary contact'));
    await waitFor(() => { expect(screen.queryByLabelText('Make Kasun the primary contact')).toBeNull(); });
    expect(screen.getByLabelText('Make Amma the primary contact')).toBeTruthy();
    queryClient.clear();
  });

  it('removes a contact only after a confirmation', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { queryClient } = await renderWithProviders(<RootNavigator />);
    await openAccountTab();
    await fireEvent.press(await screen.findByLabelText('Remove Amma'));
    expect(screen.getByText('077 123 4567')).toBeTruthy();
    expect(alert).toHaveBeenCalledWith('Remove Amma?', 'SOS will no longer call this person.', expect.any(Array));
    const buttons = alert.mock.calls[0]?.[2] ?? [];
    buttons.find((button) => button.style === 'destructive')?.onPress?.();
    await waitFor(() => { expect(screen.queryByText('077 123 4567')).toBeNull(); });
    alert.mockRestore();
    queryClient.clear();
  });

  it('stops at five contacts', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />, {
      contacts: ['A', 'B', 'C', 'D', 'E'].map((name, index) => ({ name, phone: `+9477123450${index}` })),
    });
    await openAccountTab();
    expect(await screen.findByText('5 of 5')).toBeTruthy();
    expect(screen.getByText(/added the most you can/)).toBeTruthy();
    // The button is disabled: pressing it opens nothing.
    await fireEvent.press(screen.getByText('Add a contact'));
    expect(screen.queryByLabelText('Phone number')).toBeNull();
    queryClient.clear();
  });

  it('logs out from the end of the account page and returns to login', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />);
    await openAccountTab();
    expect(await screen.findByText('Signed in as nimali@example.lk')).toBeTruthy();
    await fireEvent.press(screen.getByText('Log out'));
    expect(await screen.findByText('Welcome back')).toBeTruthy();
    expect(screen.queryByLabelText('SOS. Emergency help')).toBeNull();
    queryClient.clear();
  });

  it('keeps one person from seeing another person\'s contacts', async () => {
    const { queryClient } = await renderWithProviders(<RootNavigator />);
    await openAccountTab();
    await screen.findByText('077 123 4567');
    await fireEvent.press(screen.getByText('Log out'));
    await screen.findByText('Welcome back');
    await fireEvent.press(screen.getAllByText('Create account')[0]);
    await fillSignUp('Dilani', 'dilani@example.lk');
    await pressCreateAccount();
    await screen.findByLabelText('SOS. Emergency help');
    await openAccountTab();
    expect(await screen.findByText(/No contacts yet/)).toBeTruthy();
    expect(screen.queryByText('Amma')).toBeNull();
    queryClient.clear();
  });
});
