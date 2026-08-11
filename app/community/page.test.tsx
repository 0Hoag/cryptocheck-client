import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getReactions: vi.fn(),
  getComments: vi.fn(),
  createReaction: vi.fn(),
  deleteReaction: vi.fn(),
  createComment: vi.fn(),
}));

vi.mock("@/lib/social", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/social")>()),
  ...mocks,
}));

import { CommunityCard } from "./page";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const post = {
  id: "post-1", content: "BTC is consolidating near resistance.", author_id: "author-1",
  author: { id: "author-1", username: "Lan", avatar_url: "" }, permission: "followers" as const,
  created_at: "2026-08-11T00:00:00Z", reaction_count: 4, comment_count: 2,
};
const user = { id: "user-1", username: "Hoag" };

describe("CommunityCard", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it("renders the actual follower-only visibility instead of calling every post public", async () => {
    await act(async () => { root.render(<CommunityCard post={post} user={user} language="en" />); });
    expect(container.textContent).toContain("Followers");
    expect(container.textContent).not.toContain("Public");
  });

  it("keeps comment submission disabled while the interaction request is unresolved", async () => {
    let resolveReactions: (value: []) => void = () => undefined;
    mocks.getReactions.mockReturnValue(new Promise<[]>(resolve => { resolveReactions = resolve; }));
    mocks.getComments.mockResolvedValue([]);

    await act(async () => { root.render(<CommunityCard post={post} user={user} language="en" />); });
    const commentButton = [...container.querySelectorAll("button")].find((button) => button.textContent?.includes("2"));
    await act(async () => { commentButton?.dispatchEvent(new MouseEvent("click", { bubbles: true })); });

    const input = container.querySelector("input") as HTMLInputElement;
    await act(async () => {
      input.value = "This must wait for the loaded discussion";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect((container.querySelector("form button") as HTMLButtonElement).disabled).toBe(true);

    await act(async () => { resolveReactions([]); });
  });
});
