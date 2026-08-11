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

function isContentReport(value: unknown): value is ContentReport {
  if (!value || typeof value !== "object") return false;
  const report = value as Record<string, unknown>;
  return typeof report.id === "string"
    && (report.target_type === "post" || report.target_type === "comment")
    && typeof report.target_id === "string"
    && typeof report.reason === "string"
    && typeof report.status === "string"
    && ["open", "reviewed", "resolved", "rejected"].includes(report.status)
    && typeof report.created_at === "string"
    && typeof report.updated_at === "string";
}

export function parseReportsResponse(payload: unknown): ContentReport[] {
  const data = (payload as ReportPayload | undefined)?.data;
  if (data == null) return [];
  if (!Array.isArray(data) || !data.every(isContentReport)) {
    throw new Error("Invalid reports response");
  }
  return data;
}
