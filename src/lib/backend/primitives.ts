import { BACKEND_URL } from "#/environment";
import { callBackend } from "#/lib/backend/backend.functions";
import mapConnectors_admin from "#/lib/backend/connectors/admin";
import mapConnectors_ai from "#/lib/backend/connectors/ai";
import mapConnectors_assets from "#/lib/backend/connectors/assets";
import mapConnectors_community from "#/lib/backend/connectors/community";
import mapConnectors_dashboard from "#/lib/backend/connectors/dashboard";
import mapConnectors_email from "#/lib/backend/connectors/email";
import mapConnectors_market from "#/lib/backend/connectors/market";
import mapConnectors_messages from "#/lib/backend/connectors/messages";
import mapConnectors_notifications from "#/lib/backend/connectors/notifications";
import mapConnectors_orders from "#/lib/backend/connectors/orders";
import mapConnectors_organization from "#/lib/backend/connectors/organization";
import mapConnectors_payments from "#/lib/backend/connectors/payments";
import mapConnectors_problemChat from "#/lib/backend/connectors/problem-chat";
import mapConnectors_realtimekit from "#/lib/backend/connectors/realtimekit";
import mapConnectors_resources from "#/lib/backend/connectors/resources";
import mapConnectors_service from "#/lib/backend/connectors/service";
import mapConnectors_user from "#/lib/backend/connectors/user";

export interface BackendPrimitives {
  get: (endpoint: string) => Promise<any>;
  post: (endpoint: string, data?: any) => Promise<any>;
  put: (endpoint: string, data?: any) => Promise<any>;
  patch: (endpoint: string, data?: any) => Promise<any>;
  delete: (endpoint: string) => Promise<any>;
  fetch: (info: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

async function parseResponse(res: Response) {
  if (!res.ok) {
    const error = await res.json();
    throw new Error((error as any).message || "Failed to request from backend.");
  }
  return res.json();
}

export type BackendSession = {
  userId?: string | null;
  orgId?: string | null;
};

async function fetchHeaders(session: BackendSession) {
  const headers: Record<string, string> = {};

  if (session.orgId) {
    headers["X-Organization-ID"] = session.orgId;
  }

  return headers;
}

export function generatePrimitives(session: BackendSession) {
  async function callServer(endpoint: string, method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", body?: unknown) {
    const response = (await callBackend({
      data: { endpoint, method, body, organizationId: session.orgId ?? undefined },
    })) as { body: unknown; ok: boolean; status: number };
    if (!response.ok) {
      const error = response.body as { message?: string } | null;
      throw new Error(error?.message || "Failed to request from the server.");
    }
    return response.body;
  }

  async function call(info: RequestInfo, init?: RequestInit) {
    const injectedInit = {
      ...init,
      headers: {
        ...init?.headers,
        ...(await fetchHeaders(session)),
      },
    };

    let lastError: Error;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(info, injectedInit);
        return response;
      } catch (error) {
        if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
          console.warn(`Network error on attempt ${attempt}:`, error);
        } else {
          console.error(`Error on attempt ${attempt}:`, error);
        }

        lastError = error as Error;
        if (attempt >= 3) throw lastError;
      }
    }
    throw lastError!;
  }

  async function get(endpoint: string) {
    return callServer(endpoint, "GET");
  }

  async function post(endpoint: string, data?: any) {
    if (!(data instanceof FormData)) return callServer(endpoint, "POST", data);
    const response = await call(`${BACKEND_URL}${endpoint}`, {
      method: "POST",
      headers: {
        ...(data instanceof FormData ? {} : { "Content-Type": "application/json" }),
      },
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
    return parseResponse(response);
  }

  async function put(endpoint: string, data?: any) {
    if (!(data instanceof FormData)) return callServer(endpoint, "PUT", data);
    const response = await call(`${BACKEND_URL}${endpoint}`, {
      method: "PUT",
      headers: {
        ...(data instanceof FormData ? {} : { "Content-Type": "application/json" }),
      },
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
    return parseResponse(response);
  }

  async function patch(endpoint: string, data?: any) {
    if (!(data instanceof FormData)) return callServer(endpoint, "PATCH", data);
    const res = await call(`${BACKEND_URL}${endpoint}`, {
      method: "PATCH",
      headers: {
        ...(await fetchHeaders(session)),
        ...(data instanceof FormData ? {} : { "Content-Type": "application/json" }),
      },
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
    return parseResponse(res);
  }

  async function del(endpoint: string, data?: any) {
    return callServer(endpoint, "DELETE", data);
  }

  return {
    fetch: call,
    get,
    post,
    put,
    patch,
    delete: del,
  } as BackendPrimitives;
}

export function generateMappings(primitives: BackendPrimitives) {
  return {
    primitives,
    admin: mapConnectors_admin(primitives),
    ai: mapConnectors_ai(primitives),
    assets: mapConnectors_assets(primitives),
    community: mapConnectors_community(primitives),
    dashboard: mapConnectors_dashboard(primitives),
    email: mapConnectors_email(primitives),
    realtimekit: mapConnectors_realtimekit(primitives),
    market: mapConnectors_market(primitives),
    messages: mapConnectors_messages(primitives),
    notifications: mapConnectors_notifications(primitives),
    orders: mapConnectors_orders(primitives),
    organization: mapConnectors_organization(primitives),
    payments: mapConnectors_payments(primitives),
    problemChat: mapConnectors_problemChat(primitives),
    resources: mapConnectors_resources(primitives),
    service: mapConnectors_service(primitives),
    user: mapConnectors_user(primitives),
  };
}

export type BackendMappings = ReturnType<typeof generateMappings>;
