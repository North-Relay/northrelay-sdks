# 02_fix — change the cause, where it is owned

One job: the smallest change at the cause that turns the reproduction green, proposed as one pull request in the repository that owns the file.

## Inputs
- Working (this run): `.github/icm/01-fix/stages/01_reproduce/output/reproduction.md`
- Reference (every run): `.github/icm/_shared/mirror.md`
- Reference (every run): `.github/icm/_shared/build-and-test.md`
- Reference (every run): `.github/icm/_shared/conventions.md`
- Reference (only when the fix touches a publish workflow or needs a version): `.github/icm/_shared/release.md`

Do NOT load: the other pipelines, other runs' output, `.github/icm/_shared/documents.md`.

## Process
1. Read the reproduction and confirm the cause in the code before changing anything; if it moved, record where it really is.
2. SDK code: the pull request is on North-Relay/northrelay-platform, under `sdk/<language>/`, following that repository's own `fix` route. It carries the reproduction's test, a `### Fixed` entry in the SDK's CHANGELOG and, if the fix is to ship now, the version bump in `package.json` or `pyproject.toml` (and `__version__` in `python/northrelay/__init__.py`): the bump is the release ([release.md](../../../_shared/release.md) "Cutting a version"). A defect present in both SDKs is fixed in both, in the same pull request.
3. A defect in this repository's own files (`.github/workflows/`, root documents): the pull request is here, against `master`, with a Conventional Commit subject ([conventions.md](../../../_shared/conventions.md)).
4. Never commit a change to `typescript/` or `python/` here. A pull request someone opened here against them is ported as [mirror.md](../../../_shared/mirror.md) says.
5. Do not edit the reproduction to make it pass; if it was wrong, go back to stage 01. Do not change the public API; if the fix needs that, stop: route `fix-to-feature`.
6. Run the reproduction (green now) and the SDK's full checks ([build-and-test.md](../../../_shared/build-and-test.md) "Locally").

## Outputs
- fix-pr.md → output/ — the cause in one paragraph; the repository, branch and pull request link; each file changed and why; the passing reproduction and the full checks; the version it ships in, or that no version is bumped yet.

## Human check
A person reads the diff beside the reproduction: it removes the cause, it is in the repository that owns the file, and the version bump (or its absence) is what they want. The reviewer merges it there.
