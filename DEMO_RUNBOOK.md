# Demo Runbook (Nabil)

## Objective
Run a reliable, repeatable blockchain demo sequence before judges with fallback options.

## Preflight (must pass)

1. Compile and test:
```bash
npm run compile
npm run test
```

2. Deployment/demo readiness checks:
```bash
npm run demo:check
```

Expected outcome:
- Deployed contracts have code
- HLUSD address points to a token contract
- All 6 seeded agents are present

## Deploy / Seed Sequence

1. Deploy contracts:
```bash
npm run deploy:hela
```

2. Seed all six agents:
```bash
npm run seed:hela
```

3. Run preflight again:
```bash
npm run demo:check
```

## Live Judge Flow (Blockchain checkpoints)

1. Connect wallet on HeLa testnet (Chain ID 666888).
2. Open marketplace and show all 6 agents listed.
3. Activate Scheduling Agent (HLUSD approval + activation tx).
4. Show tx hash on explorer.
5. Show dashboard activity/activation evidence.

## Fallback Procedure (if tx/RPC issues occur)

1. If HLUSD approval/activation fails:
- Run `npm run demo:check` and inspect blockers.
- Verify HLUSD token address is a real contract in `.env`.
- If wrong, fix `HLUSD_ADDRESS`, redeploy, reseed, rerun preflight.

2. If explorer verification automation fails:
- Use deployed address pages on explorer as proof of deployment.
- Continue with live tx proof and logs.

3. If network is unstable:
- Refresh RPC provider and retry once.
- Use previously successful tx hashes and deployment artifacts from `deployments/`.

## Team Sync Reminder

After each successful push to `main`, broadcast:
- "Pull main now before next commit"
- Require branch rebase/merge with latest main before PR.
