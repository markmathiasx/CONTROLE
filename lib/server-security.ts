import { createHmac, timingSafeEqual } from "node:crypto";

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
  identifier?: string;
  response?: NextResponse;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

const DEFAULT_JSON_LIMIT = 1024 * 1024;
const RATE_LIMIT_STORE_KEY = "__controle_rate_limit_store__";
const RATE_LIMIT_COOKIE_NAME = "__controle_auth_rate__";
const RATE_LIMIT_COOKIE_VERSION = 1;

type RateLimitCookiePayload = {
  v: number;
  buckets: Record<string, RateLimitState>;
};

function getRateLimitStore() {
  const globalStore = globalThis as typeof globalThis & {
    [RATE_LIMIT_STORE_KEY]?: Map<string, RateLimitState>;
  };

  if (!globalStore[RATE_LIMIT_STORE_KEY]) {
    globalStore[RATE_LIMIT_STORE_KEY] = new Map<string, RateLimitState>();
  }

  return globalStore[RATE_LIMIT_STORE_KEY];
}

function getRateLimitSecret() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.APP_LOCK_PIN ?? null;
}

function parseCookieHeader(header: string | null) {
  if (!header) {
    return {};
  }

  return header
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((accumulator, cookie) => {
      const separatorIndex = cookie.indexOf("=");
      if (separatorIndex <= 0) {
        return accumulator;
      }

      const name = cookie.slice(0, separatorIndex).trim();
      const value = cookie.slice(separatorIndex + 1).trim();
      accumulator[name] = decodeURIComponent(value);
      return accumulator;
    }, {});
}

function signRateLimitBody(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

function readRateLimitCookie(request: Request) {
  const secret = getRateLimitSecret();
  if (!secret) {
    return null;
  }

  const cookieValue = parseCookieHeader(request.headers.get("cookie"))[RATE_LIMIT_COOKIE_NAME];
  if (!cookieValue) {
    return null;
  }

  const separatorIndex = cookieValue.lastIndexOf(".");
  if (separatorIndex <= 0) {
    return null;
  }

  const body = cookieValue.slice(0, separatorIndex);
  const providedSignature = cookieValue.slice(separatorIndex + 1);
  const expectedSignature = signRateLimitBody(body, secret);

  const signatureBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as RateLimitCookiePayload;
    if (parsed.v !== RATE_LIMIT_COOKIE_VERSION || !parsed.buckets) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeRateLimitCookie(
  request: Request,
  response: NextResponse,
  identifier: string,
  state: RateLimitState,
) {
  const secret = getRateLimitSecret();
  if (!secret) {
    return;
  }

  const now = Date.now();
  const currentPayload = readRateLimitCookie(request);
  const nextBuckets = Object.entries(currentPayload?.buckets ?? {}).reduce<Record<string, RateLimitState>>(
    (accumulator, [key, value]) => {
      if (value.resetAt > now) {
        accumulator[key] = value;
      }
      return accumulator;
    },
    {},
  );

  nextBuckets[identifier] = state;

  const entries = Object.entries(nextBuckets)
    .sort((left, right) => right[1].resetAt - left[1].resetAt)
    .slice(0, 12);
  const payload: RateLimitCookiePayload = {
    v: RATE_LIMIT_COOKIE_VERSION,
    buckets: Object.fromEntries(entries),
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signedValue = `${body}.${signRateLimitBody(body, secret)}`;
  const requestUrl = new URL(request.url);

  response.cookies.set({
    name: RATE_LIMIT_COOKIE_NAME,
    value: signedValue,
    httpOnly: true,
    sameSite: "lax",
    secure: requestUrl.protocol === "https:",
    path: "/",
    maxAge: Math.max(60, Math.ceil((state.resetAt - now) / 1000)),
  });
}

function mergeRateLimitState(
  memoryState: RateLimitState | undefined,
  cookieState: RateLimitState | undefined,
  now: number,
) {
  const validStates = [memoryState, cookieState].filter(
    (value): value is RateLimitState => Boolean(value && value.resetAt > now),
  );

  if (!validStates.length) {
    return null;
  }

  const [firstState, ...otherStates] = validStates;

  return otherStates.reduce<RateLimitState>(
    (best, current) => ({
      count: Math.max(best.count, current.count),
      resetAt: Math.max(best.resetAt, current.resetAt),
    }),
    firstState,
  );
}

export function resetRateLimitStore() {
  getRateLimitStore().clear();
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
  const byteLength = new TextEncoder().encode(raw).length;

  if (byteLength > maxBytes) {
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
  const fetchSite = request.headers.get("sec-fetch-site");

  if (fetchSite === "cross-site") {
    return jsonNoStore(
      { ok: false, error: "Origem cross-site não permitida." },
      { status: 403 },
    );
  }

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
  const customIdentifier = options.identifier?.trim();
  const identifier = customIdentifier
    ? `${options.key}:${customIdentifier}`
    : `${options.key}:${getClientAddress(request)}`;

  for (const [key, state] of store.entries()) {
    if (state.resetAt <= now) {
      store.delete(key);
    }
  }

  const current = mergeRateLimitState(store.get(identifier), readRateLimitCookie(request)?.buckets[identifier], now);

  if (!current) {
    const nextState = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    store.set(identifier, nextState);
    if (options.response) {
      writeRateLimitCookie(request, options.response, identifier, nextState);
    }
    return null;
  }

  if (current.count >= options.max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    const response = jsonNoStore(
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
    if (options.response) {
      writeRateLimitCookie(request, response, identifier, current);
    }
    return response;
  }

  const nextState = {
    count: current.count + 1,
    resetAt: current.resetAt,
  };
  store.set(identifier, nextState);
  if (options.response) {
    writeRateLimitCookie(request, options.response, identifier, nextState);
  }
  return null;
}
