import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, REALTIMEKIT_APP_ID } from "#/lib/server/environment.js";

type ApiResult<T> = {
  success: boolean;
  data: T;
  errors?: Array<{ message: string }>;
};

const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/realtime/kit/${REALTIMEKIT_APP_ID}`;

export async function realtimeKitRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const result = (await response.json()) as ApiResult<T>;

  if (!response.ok || !result.success) {
    throw new Error(result.errors?.[0]?.message ?? `RealtimeKit request failed (${response.status}).`);
  }

  return result.data;
}
