# Running a gitlawb node

Step-by-step guide to staking $GITLAWB, registering your node on-chain, and earning protocol fees as a PoS operator. The reference node implementation lives at [Gitlawb/node](https://github.com/Gitlawb/node).

## Prerequisites

- A wallet with at least **10,000 $GITLAWB** (minimum stake) plus a small amount of ETH on Base for gas
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

This is your **node DID** — distinct from your Ethereum wallet.

## 3. Register your node on-chain

This stakes $GITLAWB and links your node DID to your operator wallet:

```sh
export GITLAWB_OPERATOR_PRIVATE_KEY=0xYOUR_KEY
export GITLAWB_TOKEN=0x5F980Dcfc4c0fa3911554cf5ab288ed0eb13DBa3
export GITLAWB_CONTRACT_NODE_STAKING=0xNODE_STAKING_ADDR
export GITLAWB_CHAIN_RPC_URL=https://mainnet.base.org

gl node register \
  --stake 10000 \
  --http-url https://my-node.example.com
```

What this does: checks your $GITLAWB balance → `token.approve(NodeStaking, 10000e18)` if needed → `NodeStaking.registerNode(didHash, httpUrl, 10000e18)` → transfers 10,000 $GITLAWB into escrow.

## 4. Run the node

**Docker:**

```sh
docker run -d \
  --name gitlawb-node \
  -p 7545:7545 \
  -p 7546:7546/udp \
  -v gitlawb-data:/data \
  -e DATABASE_URL=postgresql://user:pass@host/gitlawb \
  -e GITLAWB_PUBLIC_URL=https://my-node.example.com \
  -e GITLAWB_OPERATOR_PRIVATE_KEY=$GITLAWB_OPERATOR_PRIVATE_KEY \
  -e GITLAWB_CONTRACT_NODE_STAKING=$GITLAWB_CONTRACT_NODE_STAKING \
  -e GITLAWB_CHAIN_RPC_URL=$GITLAWB_CHAIN_RPC_URL \
  -e GITLAWB_OPERATOR_STRICT_MODE=true \
  ghcr.io/gitlawb/node:latest
```

**docker-compose:** the repo's `docker-compose.yml` bundles node + Postgres.

**From source:** `cargo run -p gitlawb-node --release`

The node auto-creates its database schema on first connect — no manual migration step.

### Environment reference

Required for on-chain PoS mode:

| Variable | Purpose |
|---|---|
| `GITLAWB_CONTRACT_NODE_STAKING` | staking contract address |
| `GITLAWB_OPERATOR_PRIVATE_KEY` | key that posts heartbeats |
| `GITLAWB_CHAIN_RPC_URL` | Base RPC URL (default Sepolia) |

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
| `GITLAWB_OPERATOR_STRICT_MODE` | refuse to start unless registered + active |
| `GITLAWB_HEARTBEAT_INTERVAL_HOURS` | heartbeat cadence (default 20, must be < 24) |

Anti-spam (iCaptcha) — strongly recommended for public nodes:

| Variable | Purpose |
|---|---|
| `ICAPTCHA_MODE` | `off` (default) · `shadow` (log only) · `enforce` |
| `ICAPTCHA_URL` | challenge service (default `https://icaptcha.gitlawb.com`) |
| `ICAPTCHA_PUBKEY` | pin the service's Ed25519 pubkey (else fetched from `/v1/pubkey`) |
| `ICAPTCHA_REQUIRED_LEVEL` | minimum proof strength (default 3) |

Proofs are verified offline against the pubkey, bound to the agent DID, and consumed once. Roll out with `shadow` first, watch the logs, then switch to `enforce`. Pin `ICAPTCHA_PUBKEY` in production.

## 5. Verify

```sh
gl node onchain-status
```

Expect your operator wallet, stake, HTTP URL, a recent heartbeat, and `Currently active: true`. Node logs should show `operator heartbeat loop starting` and a heartbeat tx shortly after startup. Peers will ping your `GITLAWB_PUBLIC_URL/health` — make sure it answers `{"status":"ok"}`.

## 6. Earn rewards

The heartbeat loop runs every 20 hours. While you stay active:

- Every Sunday the `FeeDistributor` distributes accumulated fees
- 75% of the weekly pot is split across all active nodes, pro-rata by stake
- Your share accrues as `pendingRewards` on-chain — claim anytime without unstaking: `gl node claim`

## 7. Unstake

7-day cooldown, two steps:

```sh
gl node unstake-request   # starts the 7-day timer
# ...wait 7 days...
gl node unstake           # returns stake + pending rewards
```

Your node keeps earning during the cooldown if it keeps heartbeating.

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
| Heartbeat gas | ~$0.03/month on Base L2 — negligible |
| Missed heartbeats | after 3 days without one you're excluded from rewards until you beat again |
| Operator key | dedicated wallet, small ETH balance, not your main treasury |
| Monitoring | watch `lastHeartbeat` on-chain; alert if > 22h |
| Public URL | must resolve and serve `/health` — peers will ping it |
| Spam | run iCaptcha in `enforce` with a pinned pubkey |

## Troubleshooting

- **"insufficient $GITLAWB balance"** — fund the operator wallet with at least 10,000 $GITLAWB.
- **"strict-mode operator check failed" on start** — `gl node register` first, or unset `GITLAWB_OPERATOR_STRICT_MODE`.
- **Rewards are 0 after a week** — `gl node onchain-status`; if `currentlyActive: false`, check the heartbeat loop in your node logs.
- **Rotating the operator wallet** — requires unstake → re-register; no in-place rotation in v1.

See [ECONOMICS.md](https://github.com/Gitlawb/node/blob/main/ECONOMICS.md) for the full reward math.
