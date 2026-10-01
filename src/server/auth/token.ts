/**
 * Jeton de session signé : `<payload base64url>.<signature base64url>`.
 * Le payload contient l'identifiant de session et son expiration ; la
 * signature HMAC-SHA256 permet au proxy de rejeter un cookie forgé sans
 * interroger la base. Compatible Node et Edge (Web Crypto uniquement).
 */
export const SESSION_COOKIE = "rebond_session";
export const SESSION_TTL_MS = 30 * 24 * 3_600_000;

type Payload = { sid: string; exp: number };

const encoder = new TextEncoder();

function secret(): string {
  const value = process.env.SESSION_SECRET?.trim();
  if (value && value.length >= 16) return value;
  if (process.env.NODE_ENV === "production") {
    console.warn("[auth] SESSION_SECRET manquant ou trop court : définissez une valeur aléatoire de 32 caractères minimum.");
  }
  return "rebond-dev-secret-ne-pas-utiliser-en-production";
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function key(): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signSessionToken(payload: Payload): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await key(), encoder.encode(body));
  return `${body}.${toBase64Url(sig)}`;
}

/** Renvoie le payload si la signature est valide et le jeton non expiré. */
export async function verifySessionToken(token: string | undefined | null): Promise<Payload | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const ok = await crypto.subtle.verify("HMAC", await key(), fromBase64Url(sig), encoder.encode(body));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as Payload;
    if (typeof payload.sid !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
