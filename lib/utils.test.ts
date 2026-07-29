import { describe, expect, it } from "vitest";
import { extractDomain, extractImageUrl, getErrorMessage, getSourceName, truncateText } from "./utils";

describe("shared content and API helpers", () => {
  it("keeps only non-empty API error messages", () => {
    expect(getErrorMessage({ response: { data: { message: "Scanner quota reached" } } }, "Fallback")).toBe("Scanner quota reached");
    expect(getErrorMessage({ response: { data: { message: "Service unavailable", request_id: "trace-1234" } } }, "Fallback")).toBe("Service unavailable (Request ID: trace-1234)");
    expect(getErrorMessage({ response: { data: { message: "   " } } }, "Fallback")).toBe("Fallback");
    expect(getErrorMessage(new Error("network"), "Fallback")).toBe("Fallback");
  });

  it("normalizes recognized publication domains safely", () => {
    expect(extractDomain("https://www.cointelegraph.com/news/example")).toBe("cointelegraph.com");
    expect(extractDomain("not a URL")).toBe("not a URL");
    expect(getSourceName("https://www.coindesk.com/markets/article")).toBe("Coindesk");
  });

  it("extracts valid markdown images and truncates long content", () => {
    expect(extractImageUrl("Intro ![chart](https://cdn.example/chart.png) more")).toBe("https://cdn.example/chart.png");
    expect(extractImageUrl("![relative](/chart.png)")).toBeNull();
    expect(truncateText("  A short market update  ", 12)).toBe("A short ma...");
    expect(truncateText("Short", 12)).toBe("Short");
  });
});
