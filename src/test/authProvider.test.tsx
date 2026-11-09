import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Button, Text, View } from 'react-native';

import { AuthProvider } from '../features/account/AuthProvider';
import { useAuth } from '../features/account/authContext';
import { services } from '../services';
import type { AuthService, User } from '../services/contracts';

jest.mock('../services', () => ({ services: { auth: {
  getSession: jest.fn(), subscribe: jest.fn(), logIn: jest.fn(), signUp: jest.fn(), logOut: jest.fn(),
} } }));

const user = { id: 'new-user', name: 'New User', email: 'user@example.invalid' };
function deferred<T>() {
  let resolve!: (value: T) => void;
  return { promise: new Promise<T>((done) => { resolve = done; }), resolve: (value: T) => resolve(value) };
}
function Probe() {
  const auth = useAuth();
  return <View>
    <Text testID="status">{auth.status}:{auth.user?.id ?? 'none'}:{String(auth.guest)}</Text>
    <Button title="Login" onPress={() => { void auth.logIn({ email: user.email, password: 'test' }); }} />
    <Button title="Logout" onPress={() => { void auth.logOut(); }} />
    <Button title="Guest" onPress={auth.continueAsGuest} />
  </View>;
}

describe('authentication provider lifecycle', () => {
  const auth = jest.mocked(services.auth);
  let event: Parameters<NonNullable<AuthService['subscribe']>>[0];
  const unsubscribe = jest.fn();
  let queryClient: QueryClient;
  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    auth.getSession.mockReset(); auth.logIn.mockReset(); auth.logOut.mockReset();
    auth.logIn.mockResolvedValue(user); auth.logOut.mockResolvedValue(undefined);
    jest.mocked(auth.subscribe!).mockImplementation((listener) => { event = listener; return unsubscribe; });
  });
  afterEach(() => { queryClient.clear(); });
  const mount = () => render(<QueryClientProvider client={queryClient}><AuthProvider><Probe /></AuthProvider></QueryClientProvider>);

  it('stays restoring until storage resolves and then permits guest access', async () => {
    const restoration = deferred<User | null>(); auth.getSession.mockReturnValue(restoration.promise);
    const view = await mount();
    expect(screen.getByTestId('status').props.children).toEqual(['loading', ':', 'none', ':', 'false']);
    restoration.resolve(null);
    await waitFor(() => expect(screen.getByTestId('status').props.children[0]).toBe('ready'));
    await fireEvent.press(screen.getByText('Guest'));
    expect(screen.getByTestId('status').props.children[4]).toBe('true');
    await view.unmount(); expect(unsubscribe).toHaveBeenCalled();
  });

  it('does not let a stale restoration replace a newer signed-in event', async () => {
    const restoration = deferred<User | null>(); auth.getSession.mockReturnValue(restoration.promise);
    await mount();
    event(user); restoration.resolve({ ...user, id: 'old-user' });
    await waitFor(() => expect(screen.getByTestId('status').props.children[2]).toBe('new-user'));
  });

  it('clears private contact queries on SDK sign-out while retaining public data', async () => {
    auth.getSession.mockResolvedValue(user); await mount();
    await waitFor(() => expect(screen.getByTestId('status').props.children[2]).toBe(user.id));
    queryClient.setQueryData(['contacts', user.id], [{ name: 'Private' }]);
    queryClient.setQueryData(['hotspots'], { public: true });
    event(null);
    await waitFor(() => expect(screen.getByTestId('status').props.children[2]).toBe('none'));
    expect(queryClient.getQueryData(['contacts', user.id])).toBeUndefined();
    expect(queryClient.getQueryData(['hotspots'])).toEqual({ public: true });
  });
});
