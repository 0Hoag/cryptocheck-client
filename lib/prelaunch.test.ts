import { describe, expect, it } from "vitest";
import { parsePrelaunchProject, parsePrelaunchProjectsResponse } from "./prelaunch";

const project = {
  id: "project-1",
  name: "Example",
  website_url: "https://example.test",
  social_urls: null,
  evidence: null,
  risk_flags: null,
};

describe("prelaunch response contract", () => {
  it("normalizes legacy null lists before a route renders them", () => {
    expect(parsePrelaunchProjectsResponse({ data: [project] })).toEqual([{ ...project, social_urls: [], evidence: [], risk_flags: [], symbol: undefined, claimed_chain: undefined, launch_at: undefined, is_owner: undefined }]);
    expect(parsePrelaunchProjectsResponse({ data: null })).toEqual([]);
  });

  it("rejects malformed project objects instead of passing them to the UI", () => {
    expect(() => parsePrelaunchProject({ id: "project-1", name: "Example" })).toThrow("Invalid prelaunch project response");
    expect(() => parsePrelaunchProjectsResponse({ data: [{ ...project, risk_flags: [1] }] })).toThrow("Invalid prelaunch project risk_flags");
  });
});
