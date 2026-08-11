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
