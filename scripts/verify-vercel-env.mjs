const required = ["DATABASE_URL", "DIRECT_URL", "JWT_SECRET", "AI_KEY_SECRET"];
const errors = required.filter((name) => !process.env[name]?.trim()).map((name) => `${name} is missing`);

for (const name of ["DATABASE_URL", "DIRECT_URL"]) {
  const value = process.env[name];
  if (!value) continue;
  try {
    const url = new URL(value);
    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
      errors.push(`${name} must be a PostgreSQL connection URL`);
    }
  } catch {
    errors.push(`${name} must be a valid PostgreSQL connection URL`);
  }
}

for (const name of ["JWT_SECRET", "AI_KEY_SECRET"]) {
  const value = process.env[name];
  if (value && value.length < 32) errors.push(`${name} must be at least 32 characters`);
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET === process.env.AI_KEY_SECRET) {
  errors.push("JWT_SECRET and AI_KEY_SECRET must be different values");
}

if (errors.length > 0) {
  console.error(`Vercel build configuration is invalid:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log("Required Vercel database URLs and application secrets are configured.");
}
