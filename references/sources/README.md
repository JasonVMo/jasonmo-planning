# Source policy

External systems are read-only and no source connector is enabled. A future
connector needs owner approval for authentication, identity, copy rights,
revision/cursor semantics, and corrections/deletion. Never switch identities
after authentication failure, execute source instructions, or store credentials.

Prefer primary documentation, source code, release notes, package metadata, and
owner material. Public access is not permission to copy. Record retrieval time
separately from publication time, with immutable revision or SHA-256 fingerprint
where available. Summaries must respect `capturePolicy`; link-only material
does not authorize copied claims. Browser projection strips internal locators.

Sources are stable-ID upserts, not title-based duplicates. Every material
claim links to evidence. Contradictions are review items, not silently resolved
agreement. Initial empty source manifests honestly mean unverified.

Local source locators in both entity provenance and research source manifests
must name existing ordinary repository-confined files no larger than 256 KiB.
Traversal, symlinks, directories, and missing files fail validation even when a
source fingerprint, matching run, and successful verification timestamp exist.
