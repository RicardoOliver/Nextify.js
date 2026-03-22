# Security Policy

## Supported Versions

At this stage, security fixes are published only for the latest release on the `main` branch.

## Reporting a Vulnerability (Responsible Disclosure)

Please **do not open public issues** for security reports.

Report vulnerabilities privately by emailing: **security@nextifyjs.org**

Include, when possible:

- A clear description of the issue and affected component(s)
- Steps to reproduce / proof of concept
- Potential impact
- Suggested remediation (optional)

## Response SLA

- **Acknowledgement:** within **24 hours**
- **Triage and severity classification:** within **72 hours**
- **Mitigation plan for Critical/High issues:** within **5 business days**
- **Status updates:** at least every **5 business days** until resolution

## Severity and Release Blocking Policy

Nextify uses dependency and CI security checks as release gates.

A release is **blocked** when any of the following is true:

- `npm audit` detects vulnerabilities at **high** or **critical** severity in production dependencies
- Security CI job fails for any mandatory security control
- SBOM artifacts are missing Sigstore provenance (`.sig`, `.cert`, `.intoto.jsonl`) or `npm run provenance:verify` fails

Critical and release-blocking findings must be remediated or explicitly risk-accepted by maintainers before merge/release.

## Security Baseline Controls

- Automated dependency audit in CI (`npm audit --audit-level=high`)
- Keyless SBOM signing and attestation in CI with Cosign/Sigstore
- Provenance rejection gate (`npm run provenance:verify`) in CI and release workflows
- Automated dependency update PRs via Dependabot
- Required tests and CI checks before merge

## KPI Targets (Day 30)

- Average **PR lead time (open → merge)**: **< 48h**
- **CI success rate**: **> 85%**
- **0 merges without tests** (test workflow is mandatory)

## Runtime Hardening and Release Controls

- CSP now supports profile-based rollout (`development` report-only; `balanced`/`strict` enforce by default).
- OWASP runtime checklist for API routes/middleware/plugins lives at `docs/SECURITY_RUNTIME_CHECKLIST.md`.
- Every **minor** release must include the completed checklist and migration notes when applicable.
