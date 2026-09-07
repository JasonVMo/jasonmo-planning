# Local proposal fixtures

Proposals never enter browser output and never fetch external sources. The
executable synthetic fixture builder is
`packages/content-pipeline/tests/fixtures.ts`; it records the current Git
revision, exact file hashes, stable request key, and isolated proposed files.
The companion reconciliation tests demonstrate dry-run, apply, same-request
retry, no-change verification, stale hashes, source/authentication failure,
contradiction, ownership violations, and interrupted recovery.

No static proposal with invented “current” hashes or completed research is
provided. Create a fresh manifest from actual canonical bytes for a supervised
request. Read `references/agents/reconciliation.md` first. Real supervised
research cycles remain pending.
