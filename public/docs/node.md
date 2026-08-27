# Running a gitlawb node

Step-by-step guide to registering and operating a gitlawb node. The reference node implementation lives at [Gitlawb/node](https://github.com/Gitlawb/node).

Running a node requires no token. Write-node access lock is not live on Base yet. The live network does not require a lock today.

## Prerequisites

- Docker or Rust 1.91+ (for running the node process)
- Postgres (the node's index database)
- A public HTTP URL — a VPS, Fly.io app, or anything reachable. A Fly.io config ships in the repo at `infra/fly/fly.toml`

## 1. Install the CLI

```sh
curl -fsSL https://gitlawb.com/install.sh | sh
# or build from source:
cargo install --path crates/gl
```

## 2. Create a node identity

Every node is identified by an Ed25519 DID keypair:

```sh
gl identity new
gl identity show
# → did:key:z6Mk...
```

This is your **node DID**. Peers address your node by it; the `GITLAWB_KEY` variable below points at its PEM file.

## 3. Run the node

**Docker:**

```sh
docker run -d \
  --name gitlawb-node \
  -p 7545:7545 \
  -p 7546:7546/udp \
  -v gitlawb-data:/data \
  -e DATABASE_URL=postgresql://user:pass@host/gitlawb \
  -e GITLAWB_PUBLIC_URL=https://my-node.example.com \
  ghcr.io/gitlawb/node:latest
```

**docker-compose:** the repo's `docker-compose.yml` bundles node + Postgres.

**From source:** `cargo run -p gitlawb-node --release`

The node auto-creates its database schema on first connect — no manual migration step.

### Environment reference

Core node settings:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (required) |
| `GITLAWB_PUBLIC_URL` | the URL peers reach you at |
| `GITLAWB_PORT` | HTTP port (default 7545) |
| `GITLAWB_P2P_PORT` | libp2p port (default 7546; `0` disables p2p) |
| `GITLAWB_REPOS_DIR` | where bare repos are stored |
| `GITLAWB_KEY` | path to the node identity PEM |
| `GITLAWB_BOOTSTRAP_PEERS` | comma-separated peer node URLs |
| `GITLAWB_MAX_PACK_BYTES` | max accepted pack size |

Leave `GITLAWB_OPERATOR_STRICT_MODE` unset: it refuses to start unless the node is registered with an on-chain operator contract, and that contract is not live on Base mainnet. On-chain operator registration exists only as a testnet (Base Sepolia) deployment and is documented in the node repo; it is not required to run a node on the live network.

Anti-spam (iCaptcha) — strongly recommended for public nodes:

| Variable | Purpose |
|---|---|
| `ICAPTCHA_MODE` | `off` (default) · `shadow` (log only) · `enforce` |
| `ICAPTCHA_URL` | challenge service (default `https://icaptcha.gitlawb.com`) |
| `ICAPTCHA_PUBKEY` | pin the service's Ed25519 pubkey (else fetched from `/v1/pubkey`) |
| `ICAPTCHA_REQUIRED_LEVEL` | minimum proof strength (default 3) |

Proofs are verified offline against the pubkey, bound to the agent DID, and consumed once. Roll out with `shadow` first, watch the logs, then switch to `enforce`. Pin `ICAPTCHA_PUBKEY` in production.

## 4. Verify

```sh
curl https://my-node.example.com/health
# → {"status":"ok"}
```

Peers will ping your `GITLAWB_PUBLIC_URL/health` — make sure it answers `{"status":"ok"}`. Point `gl` at your node to confirm it serves the API:

```sh
gl --node https://my-node.example.com node info
```

## Hardening: owner-only push

By default the node authenticates every push (valid RFC 9421 `did:key` signature) but only checks repo ownership on explicitly protected branches. Because `did:key` is self-certifying, any keyholder can push to an unprotected branch — authentication is not authorization.

To require the pusher to be the repo owner on **every** branch:

```sh
GITLAWB_ENFORCE_OWNER_PUSH=true
```

**Caution:** this blocks every non-owner pusher, including your own delegated and CI agents — UCAN `git/push` capabilities are verified but not yet honored for push authorization. Don't enable it until every identity that pushes to your repos is the owner. Per-branch protection (`gl protect`) is the finer-grained alternative.

## Operational checklist

| Concern | Recommendation |
|---|---|
| Public URL | must resolve and serve `/health` — peers will ping it |
| Node key | back up the identity PEM; losing it means a new node DID |
| Database | back up Postgres; repos on disk are rebuildable from peers only if peers hold them |
| Monitoring | alert if `/health` stops answering or the ref-update feed stops advancing |
| Spam | run iCaptcha in `enforce` with a pinned pubkey |

## Troubleshooting

- **"strict-mode operator check failed" on start** — unset `GITLAWB_OPERATOR_STRICT_MODE`; on-chain operator registration is not live on Base mainnet.
- **Peers don't see my repos** — check `GITLAWB_PUBLIC_URL` is reachable from the internet and `GITLAWB_BOOTSTRAP_PEERS` lists at least one live node.
- **`/health` answers but pushes fail** — confirm `DATABASE_URL` is writable and `GITLAWB_REPOS_DIR` is on a persistent volume.
