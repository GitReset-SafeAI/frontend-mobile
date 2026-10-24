import { z } from 'zod';

const configSchema = z.object({
  dataMode: z.enum(['mock', 'api']).default('mock'),
  apiBaseUrl: z.string().url().refine((value) => {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
  }, 'Use an HTTP(S) base URL without credentials, query, or fragment').optional(),
});

export type AppEnvironment = z.infer<typeof configSchema>;

// Accept only explicitly public configuration. Do not pass process.env wholesale.
export function parseEnvironment(values: {
  dataMode?: string;
  apiBaseUrl?: string;
}): AppEnvironment {
  const result = configSchema.safeParse({
    dataMode: values.dataMode?.trim() || undefined,
    apiBaseUrl: values.apiBaseUrl?.trim() || undefined,
  });
  if (!result.success) {
    // Avoid including environment values in diagnostics.
    throw new Error('Invalid public app configuration. Check DATA_MODE and API_BASE_URL in .env.example.');
  }
  return result.data;
}

// Direct references are required for Expo's public-variable replacement.
export const env = parseEnvironment({
  dataMode: process.env.EXPO_PUBLIC_DATA_MODE,
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
});
