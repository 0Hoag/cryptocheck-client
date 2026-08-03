export type PrelaunchProject = {
  id: string;
  name: string;
  symbol?: string;
  website_url: string;
  social_urls: string[];
  claimed_chain?: string;
  launch_at?: string;
  evidence: string[];
  risk_flags: string[];
  is_owner?: boolean;
};

type ApiEnvelope = { data?: unknown };

function optionalString(value: unknown, field: string): string | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value !== "string") throw new Error(`Invalid prelaunch project ${field}`);
  return value;
}

function stringList(value: unknown, field: string): string[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Invalid prelaunch project ${field}`);
  }
  return value;
}

// The API historically returned null for empty collections/optional arrays.
// Normalize that boundary once so rendering never calls .map/.join on null.
export function parsePrelaunchProject(value: unknown): PrelaunchProject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Invalid prelaunch project response");
  }
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || typeof item.name !== "string" || typeof item.website_url !== "string") {
    throw new Error("Invalid prelaunch project response");
  }
  if (item.is_owner != null && typeof item.is_owner !== "boolean") {
    throw new Error("Invalid prelaunch project is_owner");
  }
  return {
    id: item.id,
    name: item.name,
    website_url: item.website_url,
    symbol: optionalString(item.symbol, "symbol"),
    claimed_chain: optionalString(item.claimed_chain, "claimed_chain"),
    launch_at: optionalString(item.launch_at, "launch_at"),
    social_urls: stringList(item.social_urls, "social_urls"),
    evidence: stringList(item.evidence, "evidence"),
    risk_flags: stringList(item.risk_flags, "risk_flags"),
    is_owner: item.is_owner as boolean | undefined,
  };
}

export function parsePrelaunchProjectsResponse(payload: unknown): PrelaunchProject[] {
  const data = (payload as ApiEnvelope | undefined)?.data;
  if (data == null) return [];
  if (!Array.isArray(data)) throw new Error("Invalid prelaunch project list response");
  return data.map(parsePrelaunchProject);
}
