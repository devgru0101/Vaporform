import { describe, expect, it } from "vitest";
import { get } from "./hello";

describe("hello service", () => {
  it("should return a greeting message", async () => {
    const result = await get({ name: "Vaporform" });
    expect(result.message).toBe("Hello Vaporform! Welcome to Vaporform - AI-powered development environment.");
  });

  it("should handle different names", async () => {
    const result = await get({ name: "Developer" });
    expect(result.message).toBe("Hello Developer! Welcome to Vaporform - AI-powered development environment.");
  });
});
