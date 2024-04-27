import { expect, test } from "bun:test";
import { wslIp } from "./wsl-ip";

test("wsl ip should work", () => {
  const ip = wslIp();
  expect(ip).toContain(".");
  expect(ip.split(".").length).toBe(4);

  for (const part of ip.split(".")) {
    const num = Number(part);
    expect(num).toBeGreaterThanOrEqual(0);
    expect(num).toBeLessThanOrEqual(255);
  }
});
