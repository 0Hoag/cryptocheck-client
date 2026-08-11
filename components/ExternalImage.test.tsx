import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import ExternalImage from "./ExternalImage";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("ExternalImage", () => {
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

  it("renders a safe remote image with privacy-safe request settings", async () => {
    await act(async () => {
      root.render(<ExternalImage src="https://assets.example.test/token.png" alt="Token logo" />);
    });

    const image = container.querySelector("img");
    expect(image?.getAttribute("src")).toBe("https://assets.example.test/token.png");
    expect(image?.getAttribute("alt")).toBe("Token logo");
    expect(image?.getAttribute("referrerpolicy")).toBe("no-referrer");
  });

  it("replaces a failed remote image with its fallback", async () => {
    await act(async () => {
      root.render(<ExternalImage src="https://assets.example.test/token.png" alt="Token logo" fallback={<span>TK</span>} />);
    });

    await act(async () => {
      container.querySelector("img")?.dispatchEvent(new Event("error"));
    });

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("TK");
  });

  it("uses fallback without creating an image for an unsafe source", async () => {
    await act(async () => {
      root.render(<ExternalImage src="javascript:alert(1)" fallback={<span>Fallback</span>} />);
    });

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("Fallback");
  });
});
