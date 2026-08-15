# dsh-change-attestor

Deterministic workspace-change attestation for DeepSeek Harness.

v0.1 compares two bounded workspace snapshots and produces an attestation describing created, modified, deleted, and unchanged paths plus a SHA-256 digest. Optional action IDs can be attached as observation-window references, but the plugin does **not** claim those actions caused the changes.

## Non-claims

- observed correlation is not causation;
- not a filesystem sandbox or rollback system;
- not a replacement for Git history;
- attestation proves only the supplied snapshots and metadata.

## Development

```bash
npm install
npm test
```

MIT
