export type SharePayload = {
  title: string;
  text: string;
  url: string;
};

export type ShareResult = "shared" | "cancelled" | "unavailable";

type BrowserShare = {
  share?: (data: SharePayload) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
};

function getBrowserShare(): BrowserShare | null {
  if (typeof navigator === "undefined") return null;
  return navigator;
}

/** Uses native share when available, with clipboard as a deliberate fallback. */
export async function shareLink(payload: SharePayload, browser: BrowserShare | null = getBrowserShare()): Promise<ShareResult> {
  if (!browser) return "unavailable";

  try {
    if (typeof browser.share === "function") {
      await browser.share(payload);
      return "shared";
    }

    if (typeof browser.clipboard?.writeText === "function") {
      await browser.clipboard.writeText(payload.url);
      return "shared";
    }
  } catch (error) {
    if ((error as DOMException | undefined)?.name === "AbortError") return "cancelled";
  }

  return "unavailable";
}
