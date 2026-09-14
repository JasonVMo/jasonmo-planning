# Publication policy

Public GitHub Pages publication is owner-approved for the exact public
projection built at `/jasonmo-planning/`. Local and private-owner artifacts remain
non-deployable. The deployment workflow has no authority to broaden content
eligibility or create an approval; it can upload only the committed, audited
`docs/` artifact after the exact public approval matches.

Local may view all permitted repository content. Private-owner excludes
local-only/restricted content. Group/public additionally require explicit
requested targets, audience-visible taxonomy closure, safe sources, and one
exact owner-controlled approval. Public eligibility requires public,
non-personal content. Source URLs for broader audiences require an exact
owner-approved hostname, and hidden Markdown link labels are removed.

Approvals live under `approvals/` as strict JSON/YAML, with authorized reviewer,
destination/audience, policy version, sorted entity selection, projection
digest, and taxonomy/citation/asset/relationship-closure digests. The digest is
SHA-256 of canonical JSON containing publication policy and the complete
browser projection (excluding its own digest). Changes to any projected byte,
base path, audience, or policy invalidate approval. Hidden research fields do
not enter the digest. The asset digest covers each audience-projected asset's
entity ID, same-origin href, and exact byte digest.

Every approval must additionally record its exact normalized `basePath`, for
example `/` or `/tracker/` (leading and trailing slash, safe path segments only).
Compilation requires both this field and the digest to match. Reconciliation
checks every stored approval at its recorded base path, including in the
lease-held pass. Missing, unnormalized, or misdeclared approval paths fail
closed. No seed approvals exist to migrate; older externally prepared records
require explicit owner review rather than a silent reader rewrite.

The owner-authorized reviewer and GitHub Pages destination are listed in
`policy.yaml`. Agents cannot add reviewers, destinations, or approvals without
an explicit owner instruction. Review candidate digests using the pure
`projectCorpus(corpus, options, false)` internal review API; this does not write
or authorize an artifact. CLI compilation always enforces approval.

Time-limited approvals fail closed in deterministic compilation: the current
pure API has no trusted validation clock. Use the owner-reviewed non-expiring
digest-bound approval, or extend the contract with a trusted explicit approval
clock before enabling expiration support. Do not use ambient build time.
