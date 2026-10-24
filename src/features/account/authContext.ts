import { createContext, useContext } from 'react';

import type { LogInInput, SignUpInput, User } from '../../services/contracts';

export type AuthMode = 'login' | 'signup';

export interface AuthContextValue {
  // `loading` only until the first session check resolves.
  status: 'loading' | 'ready';
  user: User | null;
  // True after "Continue without an account". Reporting and the map work without one; SOS needs contacts.
  guest: boolean;
  logIn: (input: LogInInput) => Promise<User>;
  signUp: (input: SignUpInput) => Promise<User>;
  logOut: () => Promise<void>;
  continueAsGuest: () => void;
  // Which tab the login screen opens on. Set by whoever sends a guest there.
  preferredMode: AuthMode;
  // Returns a guest to the login screen.
  requestLogin: (mode?: AuthMode) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
