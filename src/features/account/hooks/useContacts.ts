import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { env } from '../../../config/env';
import { services } from '../../../services';
import type { ContactInput } from '../../../services/contracts';
import { queryKeys } from '../../../services/queryKeys';
import { useAuth } from '../authContext';

// Mock data is local, so the demo also works offline.
const networkMode = env.dataMode === 'mock' ? 'always' : 'online';

// Contacts are fetched only for a signed-in user, and cached per user so one person's list is never shown to another.
export function useContacts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...queryKeys.contacts, user?.id],
    queryFn: () => services.contacts.list(),
    enabled: Boolean(user),
    networkMode,
  });
}

export function useContactMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.contacts });
  return {
    add: useMutation({ mutationFn: (input: ContactInput) => services.contacts.add(input), onSuccess: invalidate, networkMode }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: ContactInput }) => services.contacts.update(id, input),
      onSuccess: invalidate,
      networkMode,
    }),
    remove: useMutation({ mutationFn: (id: string) => services.contacts.remove(id), onSuccess: invalidate, networkMode }),
    makePrimary: useMutation({ mutationFn: (id: string) => services.contacts.makePrimary(id), onSuccess: invalidate, networkMode }),
  };
}
