export type ContentReport = {
  id: string;
  target_type: "post" | "comment";
  target_id: string;
  reason: string;
  details?: string;
  status: "open" | "reviewed" | "resolved" | "rejected";
  created_at: string;
  updated_at: string;
};

type ReportPayload = { data?: unknown };

function normalizeContentReport(value: unknown): ContentReport | null {
  if (!value || typeof value !== "object") return null;
  const report = value as Record<string, unknown>;
  const id = typeof report.id === "string" && report.id.trim() ? report.id : "";
  const targetID = typeof report.target_id === "string" && report.target_id.trim() ? report.target_id : "";
  const reason = typeof report.reason === "string" ? report.reason : "";
  const createdAt = typeof report.created_at === "string" && report.created_at.trim() ? report.created_at : "";
  const updatedAt = typeof report.updated_at === "string" && report.updated_at.trim() ? report.updated_at : "";
  if (!id || !targetID || !reason || !createdAt || !updatedAt || (report.target_type !== "post" && report.target_type !== "comment") || (report.status !== "open" && report.status !== "reviewed" && report.status !== "resolved" && report.status !== "rejected")) return null;
  return {
    id,
    target_type: report.target_type,
    target_id: targetID,
    reason,
    status: report.status,
    created_at: createdAt,
    updated_at: updatedAt,
    details: typeof report.details === "string" && report.details.trim() ? report.details : undefined,
  };
}

export function parseReportsResponse(payload: unknown): ContentReport[] {
  const data = (payload as ReportPayload | undefined)?.data;
  if (data == null) return [];
  if (!Array.isArray(data)) {
    throw new Error("Invalid reports response");
  }
  const reports = data.map(normalizeContentReport);
  if (reports.some((report) => report === null)) throw new Error("Invalid reports response");
  return reports.flatMap((report) => report ? [report] : []);
}
