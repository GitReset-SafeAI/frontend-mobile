import { useQueryClient } from '@tanstack/react-query';
import { type PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';

import { services } from '../../services';
import type { LogInInput, SignUpInput, User } from '../../services/contracts';
import { queryKeys } from '../../services/queryKeys';
import { AuthContext, type AuthMode } from './authContext';

// The session lives behind the auth service; this only mirrors it for the UI. Nothing about the user is kept
// anywhere else in the app, and signing out removes the cached contacts too.
export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<{ status: 'loading' | 'ready'; user: User | null }>({ status: 'loading', user: null });
  const [guest, setGuest] = useState(false);
  const [preferredMode, setPreferredMode] = useState<AuthMode>('login');

  useEffect(() => {
    let active = true;
    services.auth
      .getSession()
      .then((user) => { if (active) setState({ status: 'ready', user }); })
      .catch(() => { if (active) setState({ status: 'ready', user: null }); });
    return () => { active = false; };
  }, []);

  const logIn = useCallback(async (input: LogInInput) => {
    const user = await services.auth.logIn(input);
    setGuest(false);
    setState({ status: 'ready', user });
    return user;
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    const user = await services.auth.signUp(input);
    setGuest(false);
    setState({ status: 'ready', user });
    return user;
  }, []);

  const logOut = useCallback(async () => {
    await services.auth.logOut();
    queryClient.removeQueries({ queryKey: queryKeys.contacts });
    setGuest(false);
    setState({ status: 'ready', user: null });
  }, [queryClient]);

  const continueAsGuest = useCallback(() => { setGuest(true); }, []);
  const requestLogin = useCallback((mode: AuthMode = 'login') => {
    setPreferredMode(mode);
    setGuest(false);
  }, []);

  const value = useMemo(
    () => ({ ...state, guest, preferredMode, logIn, signUp, logOut, continueAsGuest, requestLogin }),
    [state, guest, preferredMode, logIn, signUp, logOut, continueAsGuest, requestLogin],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
