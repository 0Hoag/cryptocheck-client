import { describe, expect, it } from "vitest";
import { notificationCopy, notificationHref, parseNotificationsResponse } from "./notifications";

const notification = { id: "note-1", type: "post.comment_created", message: "New comment", created_at: "2026-07-30T00:00:00Z" };

describe("parseNotificationsResponse", () => {
  it("keeps valid notification lists", () => {
    expect(parseNotificationsResponse({ data: [notification] })).toEqual([notification]);
  });

  it("drops malformed optional transport fields instead of leaking them into notification UI", () => {
    expect(parseNotificationsResponse({ data: [{ ...notification, resource_id: 42, read_at: { invalid: true } }] })).toEqual([
      expect.objectContaining({ id: notification.id, resource_id: undefined, read_at: undefined }),
    ]);
  });

  it("normalizes a legacy null empty list", () => {
    expect(parseNotificationsResponse({ data: null })).toEqual([]);
  });

  it("rejects malformed payloads", () => {
    expect(() => parseNotificationsResponse({ data: [{}] })).toThrow("Invalid notifications response");
  });

  it("uses the same bilingual copy for both notification surfaces", () => {
    expect(notificationCopy("post.comment_created", notification.message, "vi")).toBe("Có người đã bình luận bài viết của bạn.");
    expect(notificationCopy("post.comment_created", notification.message, "en")).toBe("Someone commented on your post.");
    expect(notificationCopy("unknown.event", notification.message, "vi")).toBe(notification.message);
  });

  it("only links notifications with a supported resource", () => {
    expect(notificationHref({ ...notification, resource_id: "post-1" })).toBe("/posts/post-1");
    expect(notificationHref({ ...notification, type: "group.member_joined", resource_id: "group-1" })).toBe("/groups/group-1");
    expect(notificationHref(notification)).toBe("");
    expect(notificationHref({ ...notification, type: "user.followed", resource_id: "user-1" })).toBe("");
  });
});
