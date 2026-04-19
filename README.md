<h1 align="center">Trovia</h1>


<p align="center">
  <img width="865" height="473" alt="logotrovia" src="https://github.com/user-attachments/assets/93374861-4c3e-4c1b-83dd-360c4f367806" />
</p>


Trovia is an on-chain AI agent marketplace built on HeLa testnet where developers publish agents, users activate them with HLUSD, and agent usage plus automation can be tracked on-chain.

The platform is designed around a freelancer-friendly flow:
- developers can publish and sell AI agents
- buyers can activate agents with one wallet flow
- agents can run manually or through scheduled automation
- revenue is split between the creator and the platform

## What Is Live

Trovia currently supports 6 live agent categories:

1. `Trading Agent`
2. `Farming Agent`
3. `Scheduling Agent`
4. `Portfolio Rebalancing Agent`
5. `Content Reply Agent`
6. `Business Assistant Agent`

All 6 have:
- marketplace listing
- detail page
- activation flow
- run/interaction flow
- dashboard visibility

The finance-oriented agents also support real demo execution paths:
- `Scheduling`: real HLUSD transfer
- `Trading`: real swap through demo router
- `Rebalancing`: real rebalance swap
- `Farming`: real deposit into demo farm

## Core Features

- Wallet connection and HeLa network switching
- Marketplace of curated live agents
- Guided and technical publish flows
- AI safety review before publishing
- On-chain activation with HLUSD payment
- 5% platform fee on paid activations
- Agent dashboard with activity and automation jobs
- Funding agent wallets with HLUSD and gas
- Recurring automation worker
- Demo trading router and demo farming vault

## Platform Fee

Paid activations now include a platform fee split:

- User pays the full listed activation price
- `95%` goes to the agent developer
- `5%` goes to the Trovia platform treasury

Example:
- `3 HLUSD` activation
- developer receives `2.85 HLUSD`
- Trovia receives `0.15 HLUSD`

This split is enforced in [contracts/AgentEscrow.sol](contracts/AgentEscrow.sol).

## Architecture

```text
Next.js App Router frontend
  -> API routes for agent logic, Gemini, automation, deployment helpers
  -> ethers.js contract integration layer
  -> Solidity contracts on HeLa testnet

Contracts:
  AgentRegistry  -> publishes and reads agents
  AgentEscrow    -> handles activation payments and fee split
  AgentExecutor  -> logs execution activity

Automation:
  agent wallets
  recurring jobs
  funding checks
  worker loop
```

## Repo Structure

```text
app/                 Next.js pages and API routes
components/          UI components
contracts/           Solidity contracts
lib/                 Wallet, contract, automation, executor helpers
scripts/             Deploy, seed, verify, worker scripts
test/                Hardhat contract tests
deployments/         Deployment artifacts
data/                Local automation store for demo/runtime state
```

## Smart Contracts

### AgentRegistry
Stores published agents:
- name
- description
- agent type
- price in HLUSD
- developer address
- active status
- config schema

### AgentEscrow
Handles activation:
- buyer approves HLUSD
- buyer activates agent
- escrow receives full amount
- 5% platform fee sent to treasury
- 95% sent to developer
- activation is recorded on-chain

### AgentExecutor
Stores execution logs for auditability.

## Agent Types

### Trading Agent
Monitors thresholds and can execute a real demo swap through the demo router.

Typical config:
- token pair
- threshold price
- direction
- amount

### Farming Agent
Monitors a farming opportunity and can deposit HLUSD into the demo farm.

Typical config:
- protocol
- pool
- amount
- duration

### Scheduling Agent
Creates recurring HLUSD payment behavior and can execute a real on-chain transfer.

Typical config:
- recipient
- amount
- frequency
- start date

### Portfolio Rebalancing Agent
Evaluates allocation drift and can perform a real capped rebalance swap.

Typical config:
- target allocations
- current allocations
- drift tolerance

### Content Reply Agent
Generates content/reply suggestions using Gemini and template automation flows.

Typical config:
- message
- tone
- brand context

### Business Assistant Agent
Handles business drafting, summaries, and structured answers.

Typical config:
- query
- business context
- language
- formality

## Tech Stack

- `Next.js 14`
- `React 18`
- `TypeScript`
- `Tailwind CSS`
- `Hardhat`
- `Solidity`
- `ethers.js v6`
- `Google Gemini`
- `HeLa testnet`

## Network

- Chain: `HeLa Testnet`
- Chain ID: `666888`
- HLUSD token is used for activations and demo execution funding

## Local Setup

### 1. Install

```bash
npm install
```

### 2. Use Node 22

Hardhat behaves best here with Node 22.

```bash
nvm use 22
```

### 3. Configure `.env`

Copy the values from `.env.example` and fill the required keys.

Important envs:

```env
HELA_RPC_URL=
HELA_CHAIN_ID=666888
HLUSD_ADDRESS=
PRIVATE_KEY=

NEXT_PUBLIC_HELA_RPC=
NEXT_PUBLIC_CHAIN_ID=666888
NEXT_PUBLIC_HLUSD_ADDRESS=
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=
NEXT_PUBLIC_AGENT_ESCROW_ADDRESS=
NEXT_PUBLIC_AGENT_EXECUTOR_ADDRESS=
NEXT_PUBLIC_PLATFORM_FEE_BPS=500

PLATFORM_FEE_BPS=500
PLATFORM_FEE_RECIPIENT=
GEMINI_API_KEY=
```

Do not commit `.env`.

### 4. Start the app

```bash
npm run dev
```

## Production Recommendation

### Database

For deployment beyond a local demo, Supabase is the right next step.

Why:
- the current automation state is still stored in `data/automation-store.json`
- that is fine for local demos, but not for Cloud Run or multi-instance deployment
- Supabase gives you:
  - managed Postgres
  - auth if you want it later
  - a clean SQL backend for jobs, logs, agent wallets, and execution history

Recommended migration target:
- `stored_agents`
- `agent_jobs`
- `execution_logs`

This repo now includes the first migration scaffold:
- [supabase/schema.sql](supabase/schema.sql)
- [lib/supabaseAdmin.ts](lib/supabaseAdmin.ts)
- [lib/automationStore.ts](lib/automationStore.ts) with:
  - `AUTOMATION_STORE_PROVIDER=json` fallback
  - `AUTOMATION_STORE_PROVIDER=supabase` for database-backed persistence
- [scripts/migrateAutomationStoreToSupabase.js](scripts/migrateAutomationStoreToSupabase.js) to import local demo data

Short version:
- `local demo` -> JSON store is okay
- `real deployment` -> move persistence to Supabase

### App Hosting

Recommended production hosting:
- frontend + API routes: `Google Cloud Run`
- database: `Supabase Postgres`

This repo now includes:
- [Dockerfile](Dockerfile)
- [cloudbuild.yaml](cloudbuild.yaml)
- [scripts/deploy-gcp.sh](scripts/deploy-gcp.sh)

## Deploying To Google Cloud Run

### 1. Prepare Artifact Registry

Create a Docker repository, for example:
- repository name: `trovia`
- region: `asia-south1`

### 2. Set deploy env vars locally

```bash
export GCP_PROJECT_ID=your-gcp-project-id
export GCP_REGION=asia-south1
export GCP_CLOUD_RUN_SERVICE=trovia-app
export GCP_ARTIFACT_REPOSITORY=trovia
export GCP_IMAGE_NAME=trovia-app
export GCP_IMAGE_TAG=latest
```

### 3. Deploy

```bash
npm run deploy:gcp
```

That command:
- builds the app container
- pushes it to Artifact Registry
- deploys it to Cloud Run

### 4. Important runtime note

If you deploy to Cloud Run without migrating persistence away from the JSON file store, automation state will not be reliable across instances or restarts.

So the safe production order is:
1. move automation storage to Supabase
2. then deploy the app to Cloud Run

### Applying the Supabase schema

Apply [supabase/schema.sql](supabase/schema.sql) in your Supabase SQL editor, then migrate local data if needed:

```bash
npm run automation:migrate:supabase
```

After that, switch the app to the database-backed store:

```env
AUTOMATION_STORE_PROVIDER=supabase
```

### 5. Start the automation worker

Run this in a second terminal:

```bash
npm run automation:watch
```

## Deployment and Seeding

### Deploy core contracts

```bash
npm run deploy:hela
```

This writes:
- `deployments/helaTestnet.json`

Then update your local env with the printed values:
- `NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS`
- `NEXT_PUBLIC_AGENT_ESCROW_ADDRESS`
- `NEXT_PUBLIC_AGENT_EXECUTOR_ADDRESS`

### Seed the 6 live marketplace agents

```bash
npm run seed:hela
```

This republishes the canonical live set into the current registry.

### Verify contracts

```bash
npm run verify:hela
```

## Demo Infrastructure

### Demo trading infrastructure

Deploys:
- demo quote token
- demo swap router

```bash
npm run deploy:trading-demo
```

Useful envs:

```env
TRADING_REAL_EXECUTION_ENABLED=true
TRADING_ROUTER_KIND=uniswap-v2
TRADING_ROUTER_ADDRESS=
TRADING_TOKEN_ADDRESS_MAP_JSON=
TRADING_SWAP_DEADLINE_SECONDS=600
```

### Demo farming infrastructure

Deploys:
- demo yield farm

```bash
npm run deploy:farming-demo
```

Useful envs:

```env
FARMING_REAL_EXECUTION_ENABLED=true
FARMING_VAULT_ADDRESS=
FARMING_DEFAULT_POOL_KEY=hlusd-usdc
```

## Buyer Flow

### Activate an agent

1. Connect wallet
2. Open marketplace
3. Choose an agent
4. Fill config
5. Click `ACTIVATE`
6. Approve HLUSD
7. Confirm on-chain activation

The activation flow:
- validates config against the agent API
- ensures correct network
- approves HLUSD to escrow
- activates agent on-chain

### Use the agent

After activation, users can:
- open interaction page
- run the agent
- create automation jobs
- fund the agent wallet
- run scheduled automation

## Automation

Automation supports:
- recurring jobs
- run now
- pause
- resume
- funding status
- gas funding
- HLUSD funding from connected wallet

Finance automation uses isolated agent wallets instead of the user's main wallet.

Readiness states include:
- `READY TO RUN`
- `NEEDS GAS`
- `NEEDS HLUSD`
- `CHECK FUNDING`

## Publishing Agents

Trovia supports two publish modes:

### Describe with AI
For non-technical users:
- describe the agent in plain English
- Gemini generates the draft and runtime
- safety review runs
- deploy pipeline publishes it

### Technical JSON
For technical users:
- manually define config schema and runtime code
- run safety review
- publish through the same deploy pipeline

## Safety Review

The publish flow includes AI-assisted safety review to catch:
- wallet draining intent
- seed phrase/private key collection
- silent signing behavior
- illegal or unethical workflows

The review returns:
- `approve`
- `review`
- `block`

## Marketplace Curation

The marketplace only shows the canonical live 6 agents.

Weak/demo/noisy historical agents are filtered out from the public list.

There is also a separate `Coming Soon` section for upcoming agent concepts.

## Testing

### Contract tests

```bash
npx hardhat test test/agent-bazaar.test.ts
```

### QA checklist

Use:

- [QA_CHECKLIST.md](QA_CHECKLIST.md)

It covers:
- marketplace
- publish
- wallet
- each agent page
- all 6 activation flows
- automation
- dashboard
- worker behavior

## Important Notes

- `.env` is local-only
- `data/automation-store.json` is local runtime/demo state
- deployment artifacts may differ by machine/network run
- old purchases do not carry over after redeploying new contracts
- if you redeploy the registry, you must seed agents again

## Current Status

Working now:
- 6 live agent categories
- real on-chain activation
- 5% fee split
- scheduling real transfer
- trading real demo swap
- rebalancing real demo swap
- farming real demo deposit
- automation worker
- publish flow and safety review

## Team

- Nabil
- Bhumi
- Aman
- Madhura
- Saad

## License

Hackathon project for DevClash / HeLa ecosystem demo use.
