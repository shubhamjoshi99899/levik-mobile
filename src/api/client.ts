import { QueryClient } from '@tanstack/react-query';
import { File as FsFile } from 'expo-file-system';
import createFetchClient, { type Middleware } from 'openapi-fetch';
import createQueryClient from 'openapi-react-query';
import { Platform } from 'react-native';
import { API_URL } from './config';
import { ApiError } from './errors';
import type { paths } from './schema';
import { getAccessToken, refreshAccessToken } from './session';

/** Adds the bearer token and, on a 401, refreshes once and retries. */
async function authFetch(input: Request): Promise<Response> {
  const retry = input.clone();
  const send = (req: Request, token: string | null) => {
    if (token) req.headers.set('authorization', `Bearer ${token}`);
    return fetch(req);
  };
  let token = getAccessToken() ?? (await refreshAccessToken());
  const res = await send(input, token);
  if (res.status !== 401 || new URL(input.url).pathname.startsWith('/api/v1/auth/')) return res;
  token = await refreshAccessToken();
  return token ? send(retry, token) : res;
}

const throwOnError: Middleware = {
  async onResponse({ response }) {
    if (!response.ok) throw await ApiError.fromResponse(response);
    return undefined;
  },
};

export const api = createFetchClient<paths>({ baseUrl: API_URL, fetch: authFetch });
api.use(throwOnError);

/** Typed TanStack Query hooks: `$api.useQuery("get", "/api/v1/app/wallet")`. */
export const $api = createQueryClient(api);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 20_000, retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2 },
  },
});

export async function call<T>(request: Promise<{ data?: T }>): Promise<T> {
  return (await request).data as T;
}

/** After a mutation (scan, redemption, invoice), refetch everything on screen: balances move together. */
export const refreshAll = () => queryClient.invalidateQueries();

export type UploadPurpose = 'scan-photo' | 'invoice-document' | 'profile-photo' | 'shop-photo';

/** Picked file from expo-image-picker / expo-document-picker (web assets also carry a File). */
export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
  file?: File;
}

/** Signed file links from the API (photoUrl, shopPhotoUrl…) are relative to its origin; this makes them loadable by <Image>. */
export function fileSource(url?: string | null): string | undefined {
  return url ? `${API_URL}${url}` : undefined;
}

/** Multipart upload (photo or invoice document). Returns the upload key to reference in a scan, invoice or profile. */
export async function uploadFile(file: PickedFile, purpose: UploadPurpose): Promise<string> {
  const form = new FormData();
  form.append('purpose', purpose);
  if (Platform.OS === 'web') {
    const blob = file.file ?? (await (await fetch(file.uri)).blob());
    form.append('file', blob, file.name);
  } else {
    // Expo's fetch (the global fetch since SDK 57) cannot send React Native's { uri, name, type } parts
    // ("Unsupported FormDataPart implementation"). expo-file-system's File is a Blob it reads from disk.
    form.append('file', new FsFile(file.uri) as unknown as Blob, file.name);
  }
  const res = await authFetch(new Request(`${API_URL}/api/v1/uploads`, { method: 'POST', body: form }));
  if (!res.ok) throw await ApiError.fromResponse(res);
  const body = (await res.json()) as { key: string };
  return body.key;
}
