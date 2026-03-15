import { NextResponse } from "next/server";

type JsonInit = {
  status?: number;
  headers?: HeadersInit;
};

type JsonRequestOptions = {
  maxBytes?: number;
};

type RateLimitOptions = {
  key: string;
  max: number;
  windowMs: number;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

const DEFAULT_JSON_LIMIT = 1024 * 1024;
const RATE_LIMIT_STORE_KEY = "__controle_rate_limit_store__";

function getRateLimitStore() {
  const globalStore = globalThis as typeof globalThis & {
    [RATE_LIMIT_STORE_KEY]?: Map<string, RateLimitState>;
  };

  if (!globalStore[RATE_LIMIT_STORE_KEY]) {
    globalStore[RATE_LIMIT_STORE_KEY] = new Map<string, RateLimitState>();
  }

  return globalStore[RATE_LIMIT_STORE_KEY];
}

export function jsonNoStore(body: unknown, init: JsonInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store, max-age=0");
  headers.set("Pragma", "no-cache");

  return NextResponse.json(body, {
    ...init,
    headers,
  });
}

export async function parseJsonBody<T>(
  request: Request,
  options: JsonRequestOptions = {},
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  const maxBytes = options.maxBytes ?? DEFAULT_JSON_LIMIT;
  const raw = await request.text();

  if (raw.length > maxBytes) {
    return {
      ok: false,
      response: jsonNoStore(
        { ok: false, error: "A requisição ficou grande demais para este endpoint." },
        { status: 413 },
      ),
    };
  }

  try {
    const data = raw ? (JSON.parse(raw) as T) : ({} as T);
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      response: jsonNoStore(
        { ok: false, error: "O corpo da requisição está inválido." },
        { status: 400 },
      ),
    };
  }
}

export function enforceSameOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return null;
  }

  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const expectedOrigin = forwardedHost
    ? `${forwardedProto ?? requestUrl.protocol.replace(":", "")}://${forwardedHost}`
    : requestUrl.origin;

  if (origin !== expectedOrigin && origin !== requestUrl.origin) {
    return jsonNoStore(
      { ok: false, error: "Origem da requisição não permitida." },
      { status: 403 },
    );
  }

  return null;
}

export function getClientAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "anonymous";
  }

  return request.headers.get("x-real-ip")?.trim() || "anonymous";
}

export function checkRateLimit(request: Request, options: RateLimitOptions) {
  const store = getRateLimitStore();
  const now = Date.now();
  const identifier = `${options.key}:${getClientAddress(request)}`;

  for (const [key, state] of store.entries()) {
    if (state.resetAt <= now) {
      store.delete(key);
    }
  }

  const current = store.get(identifier);
  if (!current || current.resetAt <= now) {
    store.set(identifier, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return null;
  }

  if (current.count >= options.max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return jsonNoStore(
      {
        ok: false,
        error: "Muitas tentativas em sequência. Aguarde um pouco e tente novamente.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfterSeconds.toString(),
        },
      },
    );
  }

  current.count += 1;
  store.set(identifier, current);
  return null;
}
