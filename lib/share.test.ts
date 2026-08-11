import { describe, expect, it, vi } from "vitest";
import { shareLink } from "./share";

const payload = { title: "CryptoCheck", text: "Market update", url: "https://cryptocheck.io.vn/posts/post-1" };

describe("shareLink", () => {
  it("prefers the native share sheet", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    await expect(shareLink(payload, { share })).resolves.toBe("shared");
    expect(share).toHaveBeenCalledWith(payload);
  });

  it("falls back to copying only the canonical post URL", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await expect(shareLink(payload, { clipboard: { writeText } })).resolves.toBe("shared");
    expect(writeText).toHaveBeenCalledWith(payload.url);
  });

  it("does not present a cancelled native sheet as a sharing failure", async () => {
    await expect(shareLink(payload, { share: vi.fn().mockRejectedValue({ name: "AbortError" }) })).resolves.toBe("cancelled");
    await expect(shareLink(payload, null)).resolves.toBe("unavailable");
  });
});
