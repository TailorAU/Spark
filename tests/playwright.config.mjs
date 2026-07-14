import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 120_000,
  retries: 0,
  outputDir: ".artifacts/test-results",
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4173",
    viewport: { width: 420, height: 900 },
  },
  webServer: {
    command: "node serve.mjs",
    port: 4173,
    reuseExistingServer: true,
  },
});
