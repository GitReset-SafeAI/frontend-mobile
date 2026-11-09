import { QueryClient } from '@tanstack/react-query';

import { useAuth } from '../features/account/authContext';
import { useContactMutations, useContacts } from '../features/account/hooks/useContacts';
import { services } from '../services';
import { ApiError } from '../services/api/ApiError';

// Exercise the production hook options with real TanStack Query observers/cache. Rendering and
// native controls are covered by the existing account tests, not these service-boundary tests.
let mockClient: QueryClient;
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return { ...actual,
    useQueryClient: () => mockClient,
    useQuery: (options: unknown) => {
      const observer = new actual.QueryObserver(mockClient, options);
      return observer.getOptimisticResult(observer.options);
    },
    useMutation: (options: unknown) => {
      const observer = new actual.MutationObserver(mockClient, options);
      return { mutateAsync: (input: unknown) => observer.mutate(input) };
    },
  };
});
jest.mock('../features/account/authContext', () => ({ useAuth: jest.fn() }));
jest.mock('../services', () => ({ services: { contacts: {
  list: jest.fn(), add: jest.fn(), update: jest.fn(), remove: jest.fn(), makePrimary: jest.fn(),
} } }));

const input = { name: 'Amma', phone: '+94771234567' };
const existing = { ...input, id: 'existing-contact' };

describe('contact query ownership and mutation reconciliation', () => {
  beforeEach(() => {
    mockClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });
    jest.mocked(useAuth).mockReturnValue({ user: { id: 'owner-a' } } as ReturnType<typeof useAuth>);
    for (const method of Object.values(services.contacts)) jest.mocked(method).mockReset();
  });
  afterEach(() => { mockClient.clear(); });

  it('keeps fetched contact lists in separate per-user cache entries', async () => {
    jest.mocked(services.contacts.list).mockImplementation(async (context) => [{ ...existing, name: context?.userId ?? '' }]);
    await useContacts().refetch();
    jest.mocked(useAuth).mockReturnValue({ user: { id: 'owner-b' } } as ReturnType<typeof useAuth>);
    await useContacts().refetch();
    expect(mockClient.getQueryData(['contacts', 'owner-a'])).toEqual([{ ...existing, name: 'owner-a' }]);
    expect(mockClient.getQueryData(['contacts', 'owner-b'])).toEqual([{ ...existing, name: 'owner-b' }]);
  });

  it('invalidates only the originating user after a successful create, without optimistic writes', async () => {
    mockClient.setQueryData(['contacts', 'owner-a'], [existing]);
    mockClient.setQueryData(['contacts', 'owner-b'], [{ ...existing, name: 'Other user' }]);
    mockClient.setQueryData(['hotspots'], { public: true });
    jest.mocked(services.contacts.add).mockImplementation(async (_input, context) => {
      if (context?.userId !== 'owner-a') throw new Error('Wrong mutation owner');
      return { ...input, id: 'created-contact' };
    });
    expect(await useContactMutations().add.mutateAsync(input)).toEqual({ ...input, id: 'created-contact' });
    expect(mockClient.getQueryState(['contacts', 'owner-a'])?.isInvalidated).toBe(true);
    expect(mockClient.getQueryState(['contacts', 'owner-b'])?.isInvalidated).toBe(false);
    expect(mockClient.getQueryState(['hotspots'])?.isInvalidated).toBe(false);
    expect(mockClient.getQueryData(['contacts', 'owner-a'])).toEqual([existing]);
  });

  it('keeps failed changes out of the list, does not retry them, and refreshes server truth', async () => {
    mockClient.setQueryData(['contacts', 'owner-a'], [existing]);
    jest.mocked(services.contacts.add).mockRejectedValue(new ApiError('limit', 'Contact limit reached.', 409));
    await expect(useContactMutations().add.mutateAsync(input)).rejects.toMatchObject({ kind: 'limit', status: 409 });
    expect(services.contacts.add).toHaveBeenCalledTimes(1);
    expect(mockClient.getQueryData(['contacts', 'owner-a'])).toEqual([existing]);
    expect(mockClient.getQueryState(['contacts', 'owner-a'])?.isInvalidated).toBe(true);
  });

  it('reconciles edit, delete and primary selection using the same owner boundary', async () => {
    jest.mocked(services.contacts.update).mockResolvedValue({ ...existing, name: 'Edited' });
    jest.mocked(services.contacts.remove).mockResolvedValue(undefined);
    jest.mocked(services.contacts.makePrimary).mockResolvedValue(undefined);
    const changes = useContactMutations();
    for (const operation of [
      () => changes.update.mutateAsync({ id: existing.id, input: { ...input, name: 'Edited' } }),
      () => changes.remove.mutateAsync(existing.id),
      () => changes.makePrimary.mutateAsync(existing.id),
    ]) {
      mockClient.setQueryData(['contacts', 'owner-a'], [existing]);
      await operation();
      expect(mockClient.getQueryState(['contacts', 'owner-a'])?.isInvalidated).toBe(true);
    }
  });
});
