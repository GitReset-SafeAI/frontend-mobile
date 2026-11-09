import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { env } from '../../../config/env';
import { services } from '../../../services';
import type { ContactInput } from '../../../services/contracts';
import { queryKeys } from '../../../services/queryKeys';
import { useAuth } from '../authContext';
import { ApiError } from '../../../services/api/ApiError';

// Mock data is local, so the demo also works offline.
const networkMode = env.dataMode === 'mock' ? 'always' : 'online';

// Contacts are fetched only for a signed-in user, and cached per user so one person's list is never shown to another.
export function useContacts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...queryKeys.contacts, user?.id],
    queryFn: ({ signal }) => services.contacts.list({ userId: user?.id, signal }),
    enabled: Boolean(user),
    networkMode,
  });
}

export function useContactMutations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const ownerId = user?.id;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [...queryKeys.contacts, ownerId], exact: true });
  const context = () => {
    if (!ownerId) throw new ApiError('unauthorized', 'Please log in to manage emergency contacts.', 401);
    return { userId: ownerId };
  };
  // Reconcile with the server even after a timeout: a write may already have committed.
  // No optimistic updates, offline persistence, or automatic mutation retries.
  const options = { onSettled: invalidate, networkMode, retry: false } as const;
  return {
    add: useMutation({ ...options, mutationKey: [...queryKeys.contacts, ownerId, 'add'],
      mutationFn: (input: ContactInput) => services.contacts.add(input, context()) }),
    update: useMutation({
      ...options, mutationKey: [...queryKeys.contacts, ownerId, 'update'],
      mutationFn: ({ id, input }: { id: string; input: ContactInput }) => services.contacts.update(id, input, context()),
    }),
    remove: useMutation({ ...options, mutationKey: [...queryKeys.contacts, ownerId, 'remove'],
      mutationFn: (id: string) => services.contacts.remove(id, context()) }),
    makePrimary: useMutation({ ...options, mutationKey: [...queryKeys.contacts, ownerId, 'primary'],
      mutationFn: (id: string) => services.contacts.makePrimary(id, context()) }),
  };
}
