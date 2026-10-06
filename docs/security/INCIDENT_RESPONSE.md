# Incident Response

## Preparation

Keep deployment owner and hosting-provider contact details outside the repository. Maintain protected backups, restore procedures, dependency inventory/SBOM, and access-controlled audit exports. Never put credentials or financial exports in incident tickets.

## Response steps

1. **Detect and report:** Preserve timestamp, request ID, affected route, actor/account ID where known, and sanitized logs. Avoid copying session cookies, passwords, AI keys, or transaction bodies.
2. **Triage:** Determine affected accounts, assets, environment, exposure window, and whether data was read or modified. Engage the service owner and legal/privacy contact as required.
3. **Contain:** Disable compromised accounts/sessions, revoke sessions, rotate affected JWT/AI secrets, restrict ingress, and isolate the affected deployment as appropriate.
4. **Eradicate and recover:** Patch the root cause, rebuild from reviewed source/lockfile, rotate exposed credentials, restore verified data if needed, and validate with regression tests and scans.
5. **Notify:** Follow applicable law, institutional policy, provider terms, and contractual deadlines. Do not make unsupported claims about impact.
6. **Learn:** Record sanitized timeline, root cause, scope, evidence, remediation, and preventive actions. Restrict access to the record.

## FinTrack specifics

- Session records can be revoked by deletion; password change deletes the user's existing sessions.
- AI configuration can be removed; if `AI_KEY_SECRET` is compromised, rotate it through a controlled migration/re-encryption plan rather than silently changing it (existing ciphertext becomes unreadable).
- Protect and verify SQLite backups; account deletion cascades through owned financial records.
- Audit writes are local and best-effort, so correlate with trusted ingress/host logs when available.
