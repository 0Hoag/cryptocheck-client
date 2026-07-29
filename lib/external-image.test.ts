import { describe, expect, it } from "vitest";
import { safeExternalImageURL } from "./external-image";

describe("external image URL guard", () => {
  it("allows public HTTPS image URLs", () => {
    expect(safeExternalImageURL("https://cdn.example.com/token.png?size=64")).toBe("https://cdn.example.com/token.png?size=64");
  });

  it("rejects malformed, insecure and local-network URLs", () => {
    for (const input of ["", "http://cdn.example.com/a.png", "https://localhost/a.png", "https://127.0.0.1/a.png", "https://192.168.1.3/a.png", "not a url"]) {
      expect(safeExternalImageURL(input)).toBe("");
    }
  });
});
