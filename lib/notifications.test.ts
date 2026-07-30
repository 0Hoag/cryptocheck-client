import { describe, expect, it } from "vitest";
import { parseNotificationsResponse } from "./notifications";

const notification = { id: "note-1", type: "post.comment_created", message: "New comment", created_at: "2026-07-30T00:00:00Z" };

describe("parseNotificationsResponse", () => {
  it("keeps valid notification lists", () => {
    expect(parseNotificationsResponse({ data: [notification] })).toEqual([notification]);
  });

  it("normalizes a legacy null empty list", () => {
    expect(parseNotificationsResponse({ data: null })).toEqual([]);
  });

  it("rejects malformed payloads", () => {
    expect(() => parseNotificationsResponse({ data: [{}] })).toThrow("Invalid notifications response");
  });
});
