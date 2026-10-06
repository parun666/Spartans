import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const reports = path.join(root, "security-reports");
await mkdir(reports, { recursive: true });

const run = (command, args, options = {}) => spawnSync(command, args, {
  cwd: root,
  encoding: "utf8",
  stdio: options.capture ? "pipe" : "inherit",
  env: process.env,
  ...options
});
function runNpm(args, options = {}) {
  if (process.env.npm_execpath) return run(process.execPath, [process.env.npm_execpath, ...args], options);
  if (process.platform === "win32") {
    const commandLine = `npm.cmd ${args.map((arg) => `"${arg.replaceAll('"', '""')}"`).join(" ")}`;
    return run(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", commandLine], options);
  }
  return run("npm", args, options);
}

const localTarget = process.env.FINTRACK_SECURITY_TARGET || "http://127.0.0.1:3000";
let targetUrl;
try {
  targetUrl = new URL(localTarget);
} catch {
  throw new Error("FINTRACK_SECURITY_TARGET must be a valid URL.");
}
if (!["localhost", "127.0.0.1", "::1", "host.docker.internal"].includes(targetUrl.hostname) && process.env.FINTRACK_SECURITY_ALLOW_REMOTE !== "1") {
  throw new Error("Remote scans are disabled. Set FINTRACK_SECURITY_ALLOW_REMOTE=1 only for a system you own and are authorized to test.");
}

function command(name) {
  if (name === "semgrep") {
    return [
      ["semgrep", ["scan", "--config", ".semgrep.yml", "--error", "--json", "--output", "security-reports/semgrep.json", "."]],
      ["semgrep", ["scan", "--config", ".semgrep.yml", "--error", "--sarif", "--output", "security-reports/semgrep.sarif", "."]]
    ];
  }
  if (name === "gitleaks") {
    return [
      ["gitleaks", ["git", "--config", ".gitleaks.toml", "--report-format", "json", "--report-path", "security-reports/gitleaks.json", "."]],
      ["gitleaks", ["dir", "--config", ".gitleaks.toml", "--report-format", "json", "--report-path", "security-reports/gitleaks-working-tree.json", "."]]
    ];
  }
  if (name === "osv") {
    return [["osv-scanner", ["scan", "source", "--recursive", "--format", "json", "--output-file", "security-reports/osv.json", "."]]];
  }
  if (name === "trivy") {
    return [
      ["trivy", ["fs", "--skip-dirs", ".next", "--skip-dirs", ".next-e2e", "--skip-dirs", "node_modules", "--skip-dirs", ".venv", "--skip-dirs", "security-reports", "--scanners", "vuln,secret", "--severity", "HIGH,CRITICAL", "--exit-code", "1", "--format", "json", "--output", "security-reports/trivy.json", "."]],
      ["trivy", ["config", "--skip-dirs", ".next", "--skip-dirs", ".next-e2e", "--skip-dirs", "node_modules", "--skip-dirs", ".venv", "--skip-dirs", "security-reports", "--severity", "HIGH,CRITICAL", "--exit-code", "1", "--format", "json", "--output", "security-reports/trivy-config.json", "."]]
    ];
  }
  if (name === "trivy-image") {
    return [["trivy", ["image", "--severity", "HIGH,CRITICAL", "--exit-code", "1", "--format", "json", "--output", "security-reports/trivy-image.json", "fintrack:local"]]];
  }
  if (name === "zap") {
    const mount = `${reports.replaceAll("\\", "/")}:/zap/wrk/:rw`;
    return [["docker", ["run", "--rm", "-t", "-v", mount, "ghcr.io/zaproxy/zaproxy:stable", "zap-baseline.py", "-t", "http://host.docker.internal:3000", "-J", "zap-report.json", "-r", "zap-report.html"]]];
  }
  if (name === "nuclei") {
    const mount = `${reports.replaceAll("\\", "/")}:/out`;
    return [["docker", ["run", "--rm", "-v", mount, "projectdiscovery/nuclei:latest", "-u", localTarget, "-tags", "misconfig,exposure,cves", "-exclude-tags", "dos,fuzz,intrusive", "-severity", "info,low,medium,high,critical", "-exit-code", "-jsonl-export", "/out/nuclei.json"]]];
  }
  if (name === "sbom") {
    return [["npm", ["exec", "--yes", "--package=@cyclonedx/cyclonedx-npm", "--", "cyclonedx-npm", "--package-lock-only", "--output-file", "security-reports/sbom.json"]]];
  }
  if (name === "npm-audit") {
    return [["npm", ["audit", "--json"]]];
  }
  throw new Error(`Unknown security command: ${name}`);
}

async function execute(name) {
  if (name === "security:test") {
    const result = runNpm(["run", "security:test"]);
    return result.status ?? 1;
  }
  const commands = command(name);
  let exitCode = 0;
  for (const [bin, args] of commands) {
    const isNpmAudit = name === "npm-audit";
    const result = bin === "npm"
      ? runNpm(args, isNpmAudit ? { capture: true } : {})
      : run(bin, args);
    if (isNpmAudit) {
      const output = result.stdout || result.stderr || "";
      await writeFile(path.join(reports, "npm-audit.json"), output, "utf8");
      try {
        const audit = JSON.parse(output);
        const counts = audit.metadata?.vulnerabilities;
        if (counts) console.log("npm audit report:", JSON.stringify(counts));
      } catch {
        console.error("npm audit did not return valid JSON; see the process error above.");
      }
    }
    if (result.error) {
      console.error(`Required tool "${bin}" is not available: ${result.error.message}`);
      exitCode = 127;
    } else if (result.status !== 0) {
      exitCode = result.status ?? 1;
    }
  }
  return exitCode;
}

const requested = process.argv[2];
if (requested !== "all") {
  process.exitCode = await execute(requested);
} else {
  const checks = ["security:test", "npm-audit", "semgrep", "gitleaks", "osv", "trivy", "sbom"];
  let failed = false;
  for (const check of checks) {
    console.log(`\n=== ${check} ===`);
    if (await execute(check) !== 0) failed = true;
  }
  if (process.env.SECURITY_RUN_DAST === "1") {
    for (const check of ["trivy-image", "zap", "nuclei"]) {
      console.log(`\n=== ${check} ===`);
      if (await execute(check) !== 0) failed = true;
    }
  } else {
    console.log("\nDAST and image scan not run: set SECURITY_RUN_DAST=1 after building the container and starting the local app.");
  }
  process.exitCode = failed ? 1 : 0;
}
