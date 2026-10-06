const { spawn } = require("node:child_process");

const migration = spawn(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { stdio: "inherit" });
migration.once("error", (error) => {
  console.error("Database migration could not start:", error.message);
  process.exitCode = 1;
});
migration.once("exit", (code) => {
  if (code !== 0) {
    process.exitCode = code ?? 1;
    return;
  }
  const server = spawn(process.execPath, ["server.js"], { stdio: "inherit" });
  server.once("error", (error) => {
    console.error("Application server could not start:", error.message);
    process.exitCode = 1;
  });
  server.once("exit", (serverCode) => { process.exitCode = serverCode ?? 1; });
});
