import { defineConfig, devices } from "@playwright/test";
const e2ePort = Number(process.env.FINTRACK_E2E_PORT || 3101);
const e2eUrl = `http://localhost:${e2ePort}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  retries: 0,
  use: { baseURL: e2eUrl },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx prisma db push --skip-generate && npm run db:seed && npx next build && npm run start -- -p ${e2ePort}`,
    url: `${e2eUrl}/login`,
    reuseExistingServer: false,
    timeout: 600000,
    env: {
      FINTRACK_E2E: "1",
      DATABASE_URL: "file:./fintrack-e2e.db",
      DEMO_USER_PASSWORD: "",
      DEMO_ADMIN_PASSWORD: ""
    }
  }
});
