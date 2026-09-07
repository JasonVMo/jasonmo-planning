# Research continuation

Research state is never browser input. Each entity has a bounded objective,
open questions, next action, and a human review date. Initial entities are
unverified and use manual refresh; no successful timestamps or run outcomes
have been invented.

**Pending operating gate:** approve sources and conduct at least three real,
supervised refresh cycles. Synthetic tests cover idempotency, outage,
authentication failure, contradiction, and conflicts but do not close this
gate. No scheduled writes, external source retrieval, or publication command
is enabled.

Curated source manifests and concise evidence belong here. Raw transcripts,
credentials, downloads, and connector logs do not. `.local/` is private,
ignored operational storage. Downloads and logs may be disposable, but preserve
reconciliation journals, dispositions, and the monotonic `reconcile-generation`
counter: deleting/resetting the counter can invalidate concurrent-read safety.
Generation advances before apply/recovery writes and is never rolled back.
