export type ScanIssue = { type: string; name: string; description: string; impact: number };
export type ScanResult = {
  network: string;
  name: string;
  address: string;
  analysis_type: "contract" | "native_asset" | "market_asset" | "solana_mint";
  source_available: boolean;
  score_available: boolean;
  trust_score: number;
  liquidity_usd?: number;
  volume_h24?: number;
  price_usd?: number;
  image_url?: string;
  market_provider?: string;
  dex_id?: string;
  pair_url?: string;
  pair_created_at?: number;
  market_confidence?: "high" | "medium" | "low";
  analyzed_at?: string;
  issues: ScanIssue[];
  safe_features: string[];
};
export type TokenCandidate = { address: string; network: string; name: string; symbol: string; liquidity_usd: number; volume_h24: number; price_usd: number; image_url?: string; dex_id?: string; pair_created_at?: number; contract_scan_supported: boolean };
export type ScanHistoryItem = { id: string; input: string; network: string; analysis_type: ScanResult["analysis_type"]; trust_score: number; score_available: boolean; engine_version: string; created_at: string };
export type ScanQuota = { plan: "free" | "premium"; limit: number; used: number; unlimited: boolean };

type RecordValue = Record<string, unknown>;
const analysisTypes = new Set<ScanResult["analysis_type"]>(["contract", "native_asset", "market_asset", "solana_mint"]);

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function optionalString(value: unknown): string | undefined {
  return stringValue(value);
}

function optionalNumber(value: unknown): number | undefined {
  return numberValue(value);
}

function validDateString(value: unknown): string | undefined {
  const date = stringValue(value);
  return date && Number.isFinite(Date.parse(date)) ? date : undefined;
}

function httpsURL(value: unknown): string | undefined {
  const url = stringValue(value);
  try {
    return url && new URL(url).protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

function analysisType(value: unknown): ScanResult["analysis_type"] | undefined {
  return typeof value === "string" && analysisTypes.has(value as ScanResult["analysis_type"])
    ? value as ScanResult["analysis_type"]
    : undefined;
}

function parseIssues(value: unknown): ScanIssue[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((issue) => {
    if (!isRecord(issue)) return [];
    const type = stringValue(issue.type);
    const name = stringValue(issue.name);
    const description = stringValue(issue.description);
    const impact = numberValue(issue.impact);
    return type && name && description && impact !== undefined ? [{ type, name, description, impact }] : [];
  });
}

function parseStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
}

function payloadData(payload: unknown, resource: string): RecordValue {
  const data = isRecord(payload) ? payload.data : undefined;
  if (!isRecord(data)) throw new Error(`Invalid ${resource} response`);
  return data;
}

export function parseScanResultResponse(payload: unknown): ScanResult {
  const data = payloadData(payload, "scanner");
  const network = stringValue(data.network);
  const name = stringValue(data.name);
  const address = stringValue(data.address);
  const type = analysisType(data.analysis_type);
  const trustScore = numberValue(data.trust_score);
  if (!network || !name || !address || !type || trustScore === undefined || typeof data.source_available !== "boolean" || typeof data.score_available !== "boolean") {
    throw new Error("Invalid scanner response");
  }
  const confidence = data.market_confidence;
  return {
    network, name, address, analysis_type: type, trust_score: trustScore,
    source_available: data.source_available, score_available: data.score_available,
    liquidity_usd: optionalNumber(data.liquidity_usd), volume_h24: optionalNumber(data.volume_h24), price_usd: optionalNumber(data.price_usd),
    image_url: optionalString(data.image_url), market_provider: optionalString(data.market_provider), dex_id: optionalString(data.dex_id), pair_url: httpsURL(data.pair_url),
    pair_created_at: optionalNumber(data.pair_created_at),
    market_confidence: confidence === "high" || confidence === "medium" || confidence === "low" ? confidence : undefined,
    analyzed_at: validDateString(data.analyzed_at), issues: parseIssues(data.issues), safe_features: parseStringList(data.safe_features),
  };
}

function listData(payload: unknown, resource: string): unknown[] {
  const data = isRecord(payload) ? payload.data : undefined;
  if (data == null) return [];
  if (!Array.isArray(data)) throw new Error(`Invalid ${resource} response`);
  return data;
}

export function parseTokenCandidates(payload: unknown): TokenCandidate[] {
  return listData(payload, "scanner candidates").map((value) => {
    if (!isRecord(value)) throw new Error("Invalid scanner candidates response");
    const address = stringValue(value.address); const network = stringValue(value.network); const name = stringValue(value.name); const symbol = stringValue(value.symbol);
    if (!address || !network || !name || !symbol) throw new Error("Invalid scanner candidates response");
    return { address, network, name, symbol, liquidity_usd: optionalNumber(value.liquidity_usd) ?? 0, volume_h24: optionalNumber(value.volume_h24) ?? 0, price_usd: optionalNumber(value.price_usd) ?? 0, image_url: optionalString(value.image_url), dex_id: optionalString(value.dex_id), pair_created_at: optionalNumber(value.pair_created_at), contract_scan_supported: value.contract_scan_supported === true };
  });
}

export function parseScanHistory(payload: unknown): ScanHistoryItem[] {
  return listData(payload, "scan history").map((value) => {
    if (!isRecord(value)) throw new Error("Invalid scan history response");
    const id = stringValue(value.id); const input = stringValue(value.input); const network = stringValue(value.network); const type = analysisType(value.analysis_type); const createdAt = validDateString(value.created_at);
    if (!id || !input || !network || !type || !createdAt) throw new Error("Invalid scan history response");
    return { id, input, network, analysis_type: type, created_at: createdAt, trust_score: optionalNumber(value.trust_score) ?? 0, score_available: value.score_available === true, engine_version: optionalString(value.engine_version) ?? "" };
  });
}

export function parseScanQuota(payload: unknown): ScanQuota {
  const data = payloadData(payload, "scanner quota");
  const limit = numberValue(data.limit);
  const used = numberValue(data.used);
  if ((data.plan !== "free" && data.plan !== "premium") || typeof data.unlimited !== "boolean" || limit === undefined || used === undefined) {
    throw new Error("Invalid scanner quota response");
  }
  return { plan: data.plan, unlimited: data.unlimited, limit, used };
}
