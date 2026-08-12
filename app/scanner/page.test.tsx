import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  getAuthToken: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiClient: { get: mocks.get },
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: mocks.getAuthToken,
}));

vi.mock("@/components/ExternalImage", () => ({
  default: ({ alt }: { alt: string }) => <span aria-label={alt} />,
}));

vi.mock("@/context/LanguageContext", () => ({
  useLanguage: () => ({ language: "vi", setLanguage: vi.fn() }),
  translate: (_language: "vi" | "en", vietnamese: string, english: string) => _language === "vi" ? vietnamese : english,
  languageLocale: () => "vi-VN",
}));

import ScannerPage from "./page";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("ScannerPage", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthToken.mockReturnValue(null);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    if (root) await act(async () => root.unmount());
    container?.remove();
  });

  async function renderPage() {
    await act(async () => {
      root.render(<ScannerPage />);
    });
  }

  async function submitToken(value: string) {
    const input = container.querySelector("#token") as HTMLInputElement;
    await act(async () => {
      const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setValue?.call(input, value);
      input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
    });
    await act(async () => {
      input.closest("form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
  }

  it("shows a recoverable localized error when a malformed native-asset response reaches the route", async () => {
    mocks.get.mockResolvedValue({ data: { data: { name: "Bitcoin" } } });
    await renderPage();

    await submitToken("BTC");

    expect(mocks.get).toHaveBeenCalledWith(
      "/api/v1/news-feed/scanner",
      expect.objectContaining({ params: { token: "BTC", lang: "vi" }, timeout: 45000 }),
    );
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Không thể quét token này");
    expect(container.textContent).toContain("Nhập lại");
    expect(container.textContent).toContain("Thử lại");
  });

  it("rejects malformed direct EVM input before any provider request", async () => {
    await renderPage();

    await submitToken("0x1234");

    expect(mocks.get).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Địa chỉ EVM phải gồm 0x");
  });
});
