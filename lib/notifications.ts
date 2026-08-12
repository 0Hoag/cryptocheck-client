export type AppNotification = {
  id: string;
  type: string;
  message: string;
  resource_id?: string;
  read_at?: string;
  created_at: string;
};

export function notificationCopy(type: string, fallback: string, language: "vi" | "en") {
  const copy: Record<string, [string, string]> = {
    "group.member_joined": ["Có thành viên mới tham gia group của bạn.", "A new member joined your group."],
    "group.join_requested": ["Có yêu cầu tham gia group đang chờ duyệt.", "A group join request is awaiting approval."],
    "group.post_created": ["Có bài viết mới trong group của bạn.", "A new post was published in your group."],
    "group.membership_approved": ["Yêu cầu tham gia group của bạn đã được duyệt.", "Your group join request was approved."],
    "post.reaction_created": ["Có người đã thả cảm xúc vào bài viết của bạn.", "Someone reacted to your post."],
    "post.comment_created": ["Có người đã bình luận bài viết của bạn.", "Someone commented on your post."],
    "user.followed": ["Bạn có người theo dõi mới.", "You have a new follower."],
  };
  return copy[type]?.[language === "vi" ? 0 : 1] || fallback;
}

export function notificationHref(notification: AppNotification) {
  if (!notification.resource_id) return "";
  if (notification.type.startsWith("group.")) return `/groups/${notification.resource_id}`;
  if (notification.type.startsWith("post.")) return `/posts/${notification.resource_id}`;
  return "";
}

type NotificationPayload = { data?: unknown };

function normalizeNotification(value: unknown): AppNotification | null {
  if (!value || typeof value !== "object") return null;
  const notification = value as Record<string, unknown>;
  const id = typeof notification.id === "string" && notification.id.trim() ? notification.id : "";
  const type = typeof notification.type === "string" && notification.type.trim() ? notification.type : "";
  const message = typeof notification.message === "string" ? notification.message : "";
  const createdAt = typeof notification.created_at === "string" && notification.created_at.trim() ? notification.created_at : "";
  if (!id || !type || !createdAt) return null;
  return {
    id,
    type,
    message,
    created_at: createdAt,
    resource_id: typeof notification.resource_id === "string" && notification.resource_id.trim() ? notification.resource_id : undefined,
    read_at: typeof notification.read_at === "string" && notification.read_at.trim() ? notification.read_at : undefined,
  };
}

// Older API containers can encode an empty Mongo slice as `data: null`.
// Treat that legacy empty-list shape safely, but surface malformed data instead
// of letting a shared navigation component crash while calling Array methods.
export function parseNotificationsResponse(payload: unknown): AppNotification[] {
  const data = (payload as NotificationPayload | undefined)?.data;
  if (data == null) return [];
  if (!Array.isArray(data)) {
    throw new Error("Invalid notifications response");
  }
  const notifications = data.map(normalizeNotification);
  if (notifications.some((notification) => notification === null)) {
    throw new Error("Invalid notifications response");
  }
  return notifications.flatMap((notification) => notification ? [notification] : []);
}
