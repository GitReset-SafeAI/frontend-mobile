import { useQueryClient } from '@tanstack/react-query';
import { type PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { services } from '../../services';
import type { LogInInput, RegistrationInput, SignUpInput, User } from '../../services/contracts';
import { ApiError } from '../../services/api/ApiError';
import { toAuthError } from '../../services/auth/errors';
import { queryKeys } from '../../services/queryKeys';
import { AuthContext, type AuthMode } from './authContext';

// The auth service owns the session; context mirrors only the user and safe UI state.
// Revisions prevent stale restoration/actions from replacing newer SDK events.
export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<{ status: 'loading' | 'ready'; user: User | null; error: ApiError | null }>({ status: 'loading', user: null, error: null });
  const [guest, setGuest] = useState(false);
  const [preferredMode, setPreferredMode] = useState<AuthMode>('login');
  const revision = useRef(0);
  const mounted = useRef(false);
  const currentUser = useRef<User | null>(null);

  const applyUser = useCallback((user: User | null, error?: Error) => {
    revision.current++;
    if (currentUser.current?.id !== user?.id || !user) {
      void queryClient.cancelQueries({ queryKey: queryKeys.contacts });
      queryClient.removeQueries({ queryKey: queryKeys.contacts });
    }
    currentUser.current = user;
    setGuest(false);
    setState({ status: 'ready', user, error: error ? toAuthError(error) : null });
  }, [queryClient]);

  useEffect(() => {
    let active = true;
    mounted.current = true;
    const initialRevision = ++revision.current;
    let unsubscribe: (() => void) | undefined;
    const fail = (error: unknown) => {
      if (active && revision.current === initialRevision) applyUser(null, toAuthError(error));
    };
    try {
      unsubscribe = services.auth.subscribe?.((user, error) => { if (active) applyUser(user, error); });
      void services.auth.getSession()
        .then((user) => { if (active && revision.current === initialRevision) applyUser(user); })
        .catch(fail);
    } catch (error) { fail(error); }
    return () => { active = false; mounted.current = false; revision.current++; unsubscribe?.(); };
  }, [applyUser]);

  const logIn = useCallback(async (input: LogInInput) => {
    const request = ++revision.current;
    const user = await services.auth.logIn(input);
    if (!mounted.current) throw new ApiError('cancelled', 'Authentication was interrupted.');
    if (revision.current === request) applyUser(user);
    else if (currentUser.current?.id !== user.id) throw new ApiError('cancelled', 'The session changed during login.');
    return user;
  }, [applyUser]);

  const signUp = useCallback(async (input: SignUpInput | RegistrationInput) => {
    const request = ++revision.current;
    const user = await services.auth.signUp(input);
    if (!mounted.current) throw new ApiError('cancelled', 'Authentication was interrupted.');
    if (user) {
      if (revision.current === request) applyUser(user);
      else if (currentUser.current?.id !== user.id) throw new ApiError('cancelled', 'The session changed during signup.');
    }
    return user;
  }, [applyUser]);

  const logOut = useCallback(async () => {
    const request = ++revision.current;
    await services.auth.logOut();
    if (mounted.current && revision.current === request) applyUser(null);
  }, [applyUser]);

  const continueAsGuest = useCallback(() => { setGuest(true); }, []);
  const requestLogin = useCallback((mode: AuthMode = 'login') => {
    setPreferredMode(mode);
    setGuest(false);
    if (currentUser.current) {
      void logOut().catch((error) => { if (mounted.current) applyUser(null, toAuthError(error)); });
    }
  }, [applyUser, logOut]);

  const value = useMemo(
    () => ({ ...state, guest, preferredMode, logIn, signUp, logOut, continueAsGuest, requestLogin }),
    [state, guest, preferredMode, logIn, signUp, logOut, continueAsGuest, requestLogin],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
