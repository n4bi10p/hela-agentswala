import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { AgentJob, ExecutionLogRecord, StoredAgent } from "../types/agent";

type StoreShape = {
  agents: StoredAgent[];
  jobs: AgentJob[];
  executionLogs: ExecutionLogRecord[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "automation-store.json");

function ensureStoreExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(STORE_PATH)) {
    const initial: StoreShape = {
      agents: [],
      jobs: [],
      executionLogs: []
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), "utf8");
  }
}

function readStore(): StoreShape {
  ensureStoreExists();
  const raw = fs.readFileSync(STORE_PATH, "utf8");
  return JSON.parse(raw) as StoreShape;
}

function writeStore(store: StoreShape) {
  ensureStoreExists();
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function upsertStoredAgent(agentRecord: StoredAgent) {
  const store = readStore();
  const existingIndex = store.agents.findIndex((entry) => entry.agentId === agentRecord.agentId);

  if (existingIndex >= 0) {
    store.agents[existingIndex] = agentRecord;
  } else {
    store.agents.push(agentRecord);
  }

  writeStore(store);
  return agentRecord;
}

export function listStoredAgents() {
  return readStore().agents;
}

export function getStoredAgent(agentId: string) {
  return readStore().agents.find((entry) => entry.agentId === agentId);
}

export function createAgentJob(input: Omit<AgentJob, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const job: AgentJob = {
    ...input,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now
  };

  const store = readStore();
  store.jobs.push(job);
  writeStore(store);
  return job;
}

export function listAgentJobs() {
  return readStore().jobs;
}

export function listJobsForOwner(ownerAddress: string) {
  return readStore().jobs.filter((job) => job.ownerAddress.toLowerCase() === ownerAddress.toLowerCase());
}

export function getAgentJob(jobId: string) {
  return readStore().jobs.find((job) => job.id === jobId);
}

export function updateAgentJob(jobId: string, updater: (job: AgentJob) => AgentJob) {
  const store = readStore();
  const index = store.jobs.findIndex((job) => job.id === jobId);

  if (index < 0) {
    return null;
  }

  const updated = updater(store.jobs[index]);
  updated.updatedAt = new Date().toISOString();
  store.jobs[index] = updated;
  writeStore(store);
  return updated;
}

export function listDueJobs(referenceTime = new Date().toISOString()) {
  const cutoff = new Date(referenceTime).getTime();
  return readStore().jobs.filter((job) => job.status === "active" && new Date(job.nextRunAt).getTime() <= cutoff);
}

export function appendExecutionLog(record: Omit<ExecutionLogRecord, "id">) {
  const store = readStore();
  const logRecord: ExecutionLogRecord = {
    ...record,
    id: randomUUID()
  };
  store.executionLogs.push(logRecord);
  writeStore(store);
  return logRecord;
}

export function listExecutionLogsForOwner(ownerAddress: string) {
  return readStore().executionLogs.filter(
    (log) => log.ownerAddress.toLowerCase() === ownerAddress.toLowerCase()
  );
}

export function listExecutionLogs() {
  return readStore().executionLogs;
}
