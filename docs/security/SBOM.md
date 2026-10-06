# Software Bill of Materials

Generate CycloneDX JSON from the dependency lockfile:

```powershell
npm run security:sbom
```

The command runs `@cyclonedx/cyclonedx-npm` through npm exec in lockfile-only mode and writes `security-reports/sbom.json`. The 2026-10-06 run generated CycloneDX 1.6 with 350 components. It may need network access the first time. Regenerate after every dependency or lockfile change. The SBOM does not prove that dependencies are vulnerability-free.
