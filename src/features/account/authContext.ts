import { createContext, useContext } from 'react';

import type { LogInInput, RegistrationInput, SignUpInput, User } from '../../services/contracts';
import type { ApiError } from '../../services/api/ApiError';

export type AuthMode = 'login' | 'signup';

export interface AuthContextValue {
  // `loading` only until the first session check resolves.
  status: 'loading' | 'ready';
  user: User | null;
  error: ApiError | null;
  // True after "Continue without an account". The map is public; reporting requires login.
  guest: boolean;
  logIn: (input: LogInInput) => Promise<User>;
  signUp: (input: SignUpInput | RegistrationInput) => Promise<User | null>;
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
