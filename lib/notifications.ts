export type AppNotification = {
  id: string;
  type: string;
  message: string;
  resource_id?: string;
  read_at?: string;
  created_at: string;
};

type NotificationPayload = { data?: unknown };

function isNotification(value: unknown): value is AppNotification {
  if (!value || typeof value !== "object") return false;
  const notification = value as Record<string, unknown>;
  return ["id", "type", "message", "created_at"].every((key) => typeof notification[key] === "string");
}

// Older API containers can encode an empty Mongo slice as `data: null`.
// Treat that legacy empty-list shape safely, but surface malformed data instead
// of letting a shared navigation component crash while calling Array methods.
export function parseNotificationsResponse(payload: unknown): AppNotification[] {
  const data = (payload as NotificationPayload | undefined)?.data;
  if (data == null) return [];
  if (!Array.isArray(data) || !data.every(isNotification)) {
    throw new Error("Invalid notifications response");
  }
  return data;
}
