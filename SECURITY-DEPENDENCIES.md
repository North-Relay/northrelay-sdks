# Dependency security maintenance — September 2026

Raised the Axios minimum to 1.20.0 and refreshed the npm lockfile. The TypeScript SDK runtime npm audit now reports zero vulnerabilities. Build, typecheck and the two existing tests pass; CI repeats them for pull requests. This is not proof of complete SDK correctness, and the Python/Go packages are unchanged.

Publish a reviewed patch release through the existing release workflow after merge. Updating this repository does not replace dependency versions already locked in consuming applications; consumers must update their own lockfiles.
