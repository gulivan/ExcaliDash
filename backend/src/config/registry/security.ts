import type { EnvVarSpec } from "./types";

export const securityEnv: readonly EnvVarSpec[] = [
  {
    name: "CSRF_SECRET",
    group: "Security",
    kind: "string",
    secret: true,
    requiredInProduction: true,
    doc: "Secret used to sign CSRF tokens; a dev fallback is derived when unset.",
  },
  {
    name: "CSRF_MAX_REQUESTS",
    group: "Security",
    kind: "number",
    default: "60",
    doc: "Maximum CSRF-token issuances per rate-limit window.",
  },
  {
    name: "RATE_LIMIT_MAX_REQUESTS",
    group: "Security",
    kind: "number",
    default: "1000",
    doc: "Maximum general API requests per rate-limit window.",
  },
  {
    name: "ENFORCE_HTTPS_REDIRECT",
    group: "Security",
    kind: "boolean",
    default: "true",
    doc: "Redirect HTTP requests to HTTPS when a secure origin is detected.",
  },
  {
    name: "API_KEY_HASH_PEPPER",
    group: "Security",
    kind: "string",
    secret: true,
    doc: "Pepper mixed into API-key hashes; set before creating keys (see docs).",
  },
  {
    name: "DEBUG_CSRF",
    group: "Security",
    kind: "boolean",
    default: "false",
    doc: "Enable verbose CSRF debug logging.",
  },
];
