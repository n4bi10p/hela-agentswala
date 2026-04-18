# Nabil Implementation Plan (HeLa Agent Bazaar)

Owner: Nabil
Scope: Smart contracts + blockchain integration + deployment reliability
Last updated: 2026-04-18

## Objective
Deliver a production-grade, demo-safe blockchain layer for the Agent Bazaar with:
- Deployable contracts on HeLa testnet
- Reliable HLUSD payment + activation flow
- Stable frontend integration APIs for Aman
- Verified end-to-end demo path for judging

## Ground Rules
- Nabil owns `contracts/*`, `lib/contracts.ts`, `lib/wallet.ts`, and deploy scripts.
- Keep merges to `main` only after compile/tests pass.
- Freeze blockchain feature additions before judging windows; only bug fixes after freeze.

## Phase 0: Constants Lock (Must finish first)
Status: COMPLETE

- [x] Confirm chain ID to use everywhere (`666888` locked for this repo).
- [x] Confirm HeLa testnet RPC URL.
- [x] Confirm HLUSD token contract address (testnet).
- [x] Confirm HeLa explorer base URL.
- [x] Confirm faucet URL for demo recovery.
- [x] Write final values into `.env` and team notes.

Deliverable:
- Single source-of-truth env/config values shared with team.

## Phase 1: Contract Baseline Completion
Status: COMPLETE

### 1.1 AgentRegistry
- [x] Verify `publishAgent` input validation is complete.
- [x] Verify `getAgent` / `getAllAgents` behavior and gas safety for expected list size.
- [x] Verify activation toggle permission checks.
- [x] Ensure publish/toggle events contain fields needed by UI/indexing.

### 1.2 AgentEscrow
- [x] Validate payment path: `transferFrom` buyer -> escrow -> developer.
- [x] Validate behavior for `priceHLUSD == 0` (free agent flow).
- [x] Validate activation record structure and retrieval needs.
- [x] Decide duplicate activation policy (allow multiple vs once-per-user-agent).
- [x] Emit complete activation event payload for dashboard feed.

### 1.3 AgentExecutor
- [x] Decide caller restriction model:
  - Option A: public logging
  - Option B: restricted relayer/backend signer
- [x] Emit consistent execution events for on-chain auditability.

Deliverable:
- Contract set finalized for testnet deployment.

## Phase 2: Security and Failure Semantics
Status: COMPLETE

- [x] Ensure all invalid states revert with clear messages.
- [x] Ensure no zero-address critical dependencies.
- [x] Ensure token transfer failures cannot silently pass.
- [x] Review potential replay/duplicate behavior for activation/execution logs.
- [x] Validate no accidental privileged methods are left open.

Deliverable:
- Hardened contracts with explicit revert behavior.

## Phase 3: Testing (Critical)
Status: COMPLETE

- [x] Add unit tests for `AgentRegistry` success + revert paths.
- [x] Add unit tests for `AgentEscrow` success + revert paths.
- [x] Add unit tests for `AgentExecutor` success + guard behavior.
- [x] Add integration test:
  - publish agent -> approve HLUSD -> activate -> verify payout -> verify activation event.
- [x] Ensure tests run green locally before every deployment.

Deliverable:
- Repeatable confidence via test suite.

## Phase 4: Deployment + Verification
Status: IN PROGRESS

- [x] Keep `scripts/deploy.ts` environment-driven.
- [x] Add output summary format for quick copy to `.env.local`.
- [x] Deploy contracts to HeLa testnet.
- [ ] Verify all contracts on explorer.
- [x] Save addresses and verification links in README/demo notes.

Note: Hardhat automated verification currently fails with explorer API HTML response parsing.
Deployment addresses are confirmed live on explorer links above.
Demo preflight check currently fails because configured `HLUSD_ADDRESS` has no contract code on testnet.
Fixing this address and redeploying is required before paid activation demo.

Latest deployment (2026-04-18):
- AgentRegistry: https://testnet-blockexplorer.helachain.com/address/0xB24786dB9E3DCC2Fb51A3033799AB7E7B0e05a1c
- AgentEscrow: https://testnet-blockexplorer.helachain.com/address/0x05DEf75fbA3FF426Ca0Bc49CD39D4f15CE2aa39f
- AgentExecutor: https://testnet-blockexplorer.helachain.com/address/0x6206F2F64a2B2F1D34832C2398c50F1020D9b1C7

Deliverable:
- Publicly verifiable deployed contracts.

## Phase 5: Frontend Integration Layer
Status: COMPLETE

### 5.1 `lib/contracts.ts`
- [x] Confirm function signatures used by Aman pages.
- [x] Standardize return types and transaction wait handling.
- [x] Add safe parsing/typing for bigint and structured agent data.

### 5.2 `lib/wallet.ts`
- [x] Ensure connect wallet flow is deterministic.
- [x] Ensure chain switch/add flow handles missing network cleanly.
- [x] Ensure HLUSD balance and approve flow is stable.
- [x] Add user-friendly error mapping for:
  - user rejected request
  - wrong network
  - insufficient balance/allowance
  - RPC/network failures

Deliverable:
- Stable blockchain adapter layer for frontend consumption.

## Phase 6: Seed Data for Demo
Status: COMPLETE

- [x] Create script or runbook to publish all 6 required agents.
- [x] Validate each agent has name/type/price/schema correctly set.
- [x] Ensure marketplace always has complete data set for judging.

Latest seed run (2026-04-18):
- Registry: `0xB24786dB9E3DCC2Fb51A3033799AB7E7B0e05a1c`
- Published in run: 6 agents
- Total registry count after run: 6

Deliverable:
- All six agents visible and activatable in UI.

## Phase 7: E2E Demo Rehearsal
Status: IN PROGRESS

- [ ] Connect MetaMask on HeLa.
- [ ] Browse marketplace -> open agent details.
- [ ] Approve HLUSD -> activate Scheduling Agent.
- [ ] Capture tx hash and explorer link.
- [ ] Run Content Reply interaction and verify log path.
- [ ] Validate dashboard shows activations/events.
- [x] Record fallback procedure if RPC/tx fails live.

Implemented rehearsal tooling:
- `npm run demo:check` for automated preflight validation (contracts, seed data, HLUSD token contract check)
- `DEMO_RUNBOOK.md` for live demo flow + fallback playbook

Deliverable:
- Judging-ready demo with backup paths.

## Day Execution Order (Recommended)
1. Phase 0 constants lock
2. Finish Phase 1 contract decisions
3. Complete Phase 3 tests
4. Complete Phase 4 deploy + verify
5. Finalize Phase 5 integration layer
6. Complete Phase 6 seed data
7. Run Phase 7 rehearsal and freeze

## Open Decisions (Resolve ASAP)
- [x] Final chain ID (`666888`)
- [x] HLUSD testnet address
- [x] AgentExecutor access control mode (restricted relayer + self logging)
- [x] Duplicate activation behavior policy (once-per-user-per-agent)
- [x] Scheduling execution mode (backend-triggered execution with on-chain logging)

## Freeze Policy
- 4:30 PM onward: no new blockchain features.
- Only bug fixes, test fixes, and deployment reliability changes.

## Quick Command Checklist
```bash
npm run compile
npm run test
npm run deploy:hela
```

## Working Notes
- Hardhat currently compiles and runs under this workspace; Node 22 LTS is preferred for stability.
- Keep env secrets local; commit only `.env.example`.
- Chain ID is standardized to `666888` in code/config/docs for this repository baseline.
