import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import LoadingSpinner from "./LoadingSpinner";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("LoadingSpinner", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it("announces a default loading status and hides the decorative icon", async () => {
    await act(async () => { root.render(<LoadingSpinner />); });

    expect(container.querySelector('[role="status"]')?.textContent).toBe("Loading");
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("uses the caller-provided localized label and size", async () => {
    await act(async () => { root.render(<LoadingSpinner size="sm" label="Đang tải dữ liệu" />); });

    expect(container.textContent).toBe("Đang tải dữ liệu");
    expect(container.querySelector("svg")?.getAttribute("class")).toContain("w-4");
  });
});
