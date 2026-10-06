# Software Bill of Materials

Generate CycloneDX JSON from the dependency lockfile:

```powershell
npm run security:sbom
```

The command runs `@cyclonedx/cyclonedx-npm` through npm exec in lockfile-only mode and writes `security-reports/sbom.json`. It may need network access the first time. Review the output timestamp and tool version; regenerate after every dependency or lockfile change. CI uploads its generated SBOM as an artifact. The SBOM does not prove that dependencies are vulnerability-free, and absent output must not be described as generated.
