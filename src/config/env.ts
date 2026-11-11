import { z } from 'zod';

const configSchema = z.object({
  dataMode: z.enum(['mock', 'api']).default('mock'),
  authMode: z.enum(['demo', 'supabase']).default('demo'),
  supabaseUrl: z.string().trim().optional(),
  supabasePublishableKey: z.string().trim().optional(),
  apiBaseUrl: z.string().url().refine((value) => {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
  }, 'Use an HTTP(S) base URL without credentials, query, or fragment').optional(),
  publicAppUrl: z.url({ protocol: /^https?$/ }).refine((value) => {
    const url = new URL(value);
    return !url.username && !url.password && !url.search && !url.hash && url.pathname === '/';
  }, 'Use the web frontend origin').optional(),
});

export type AppEnvironment = z.infer<typeof configSchema>;

// Accept only explicitly public configuration. Do not pass process.env wholesale.
export function parseEnvironment(values: {
  dataMode?: string;
  authMode?: string;
  supabaseUrl?: string;
  supabasePublishableKey?: string;
  apiBaseUrl?: string;
  publicAppUrl?: string;
}): AppEnvironment {
  const result = configSchema.safeParse({
    dataMode: values.dataMode?.trim() || undefined,
    authMode: values.authMode?.trim() || undefined,
    supabaseUrl: values.supabaseUrl?.trim() || undefined,
    supabasePublishableKey: values.supabasePublishableKey?.trim() || undefined,
    apiBaseUrl: values.apiBaseUrl?.trim() || undefined,
    publicAppUrl: values.publicAppUrl?.trim() || undefined,
  });
  if (!result.success) {
    // Avoid including environment values in diagnostics.
    throw new Error('Invalid public app configuration. Check .env.example.');
  }
  return result.data;
}

// Direct references are required for Expo's public-variable replacement.
export const env = parseEnvironment({
  dataMode: process.env.EXPO_PUBLIC_DATA_MODE,
  authMode: process.env.EXPO_PUBLIC_AUTH_MODE,
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  publicAppUrl: process.env.EXPO_PUBLIC_APP_URL,
});
