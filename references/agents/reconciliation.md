# Supervised reconciliation

Prepare `proposals/<run-id>/manifest.yaml` and `changes/` payloads. The strict
Proposal schema requires schema/run/workflow/base revision/request key, scope
IDs, explicit as-of, policy version, outcome, and exact changed paths with
expected SHA-256 (null only for an allowed new research file).

```sh
corepack yarn content:reconcile --proposal proposals/<run-id>/manifest.yaml --dry-run
corepack yarn content:reconcile --proposal proposals/<run-id>/manifest.yaml --apply
```

Omitting both mode flags is dry-run. Reconciliation validates the current
corpus, current Git revision, all hashes, central permissions, exact manual
regions, research transitions, complete isolated in-memory candidate corpus,
and every audience projection before writing. Existing exact approvals cannot
be silently invalidated. Unsupported owner-only operations fail explicitly.

One local lease protects the writer; hashes are rechecked after acquiring it.
A durable journal records original bytes before staged per-file replacements.
Errors roll back every replaced file. Readers fail closed while a lease or
journal exists, so partially promoted state cannot compile. Applied request
dispositions enable exact retry without duplicate outcomes.

Read-only compilation also brackets the **entire** corpus load with the durable
`research/.local/reconcile-generation` counter: it samples generation before
the initial lease/journal checks, then checks lease/journal again before its
final generation sample. Any overlapping apply/recovery fails the read rather
than silently retrying. This catches writers that finish, including complete
rollbacks, between file reads. Every writer atomically replaces and syncs an
increased generation before any canonical write; recovery does the same.
Generation is never rolled back, deleted, or included in browser data/digests.
Do not clean this counter while the checkout remains in use.

Dispositions are fully written and synced in the lease directory, then installed
atomically using a no-replace hard link. A write or sync failure leaves no
partial final disposition. Rollback removes only the installed file that shares
the staging file's identity, preserving unknown existing files. The journal
binds the expected disposition digest so recovery refuses to delete an unrelated
file. Successful retry uses the same original proposal and hashes.

Each publication approval stores its normalized `basePath`. Both isolated and
lease-held reconciliation validate exact approvals using that recorded path,
not an assumed `/`. Private operational changes may preserve a `/tracker/`
approval; changing any projected byte still invalidates it.

The complete recovery journal is bounded to 256 KiB (including base64 original
bytes). A larger proposal fails in dry-run before writing; reduce the bounded
scope rather than weakening recovery or file-size checks.

A filesystem cannot atomically rename several independent files. If the process
or machine stops during promotion, the durable journal intentionally blocks
readers rather than claiming transaction completion. The owner must inspect
`research/.local/reconcile.lock/owner.json`, verify the process is no longer
active, remove only that stale lease, and explicitly call the exported
`recoverReconciliation(root)` API. It checks every current file against old/new
hashes, refuses unrelated edits, restores originals, validates, and removes the
journal. This is local crash recovery, not a distributed lock.

If rollback or recovery itself encounters an I/O failure, the lease remains
in place to block readers. Do not clear it merely to resume compilation:
inspect the canonical files and available journal first. Repeated filesystem
failures may require owner-led repair rather than automatic recovery.

Do not edit a proposal after apply. Repeating a request with different content
or stale canonical hashes fails. New source verification uses a new as-of/request
key and evidenced run; unchanged conclusions retain `updatedAt`.
