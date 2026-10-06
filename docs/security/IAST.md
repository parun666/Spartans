# Interactive Application Security Testing (IAST)

## Status

No runtime IAST agent is integrated or claimed at this revision. The current stack can be instrumented in QA with an approved Node.js OpenTelemetry/APM security-capable agent, but generic tracing alone is observability, not IAST.

## Reproducible current substitute

Use instrumented application-level tests in `tests/security/` and `tests/api.test.ts`; run them with `npm run security:test`. They directly exercise middleware, bounded input parsing, authentication/authorization API handlers, and user isolation. This is test-based validation, not passive taint-flow IAST coverage.

## Future QA integration requirements

Only add an agent after selecting a maintained Node.js-compatible product and reviewing its data collection/privacy settings. Run against an isolated QA database and fictional accounts. Instrument request parsing → validation → handler → Prisma and authenticated AI context flows. Configure redaction for cookies, passwords, financial values, provider keys, and request bodies. Record agent/version, tested endpoints, redacted findings, remediation, and limitations. Do not upload production financial data to a vendor.
