import fs from "fs";
import path from "path";
import type { AgentJob, AgentStatus, GeneratedProject, PipelineState } from "./types";
import { PATHS } from "./paths";

const LOG_PATH = path.join(PATHS.logsDir, "agent.log");
const STATE_PATH = path.join(PATHS.pipelineDir, "state.json");
const JOBS_PATH = path.join(PATHS.pipelineDir, "jobs.json");
const PROJECTS_PATH = path.join(PATHS.projectsDir, "index.json");
const STATUS_PATH = path.join(PATHS.pipelineDir, "status.json");

const KV_PREFIX = "forge:";
const DEFAULT_PIPELINE: PipelineState = {
  stages: [
    { name: "Job Received", status: "idle" },
    { name: "Prompt Analysis", status: "idle" },
    { name: "Clarification", status: "idle" },
    { name: "Code Generation", status: "idle" },
    { name: "Project Assembly", status: "idle" },
    { name: "Zip Packaging", status: "idle" },
    { name: "Submission", status: "idle" }
  ]
};

function useKv(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function getKv() {
  const { kv } = await import("@vercel/kv");
  return kv;
}

export function ensureStore() {
  if (!fs.existsSync(PATHS.logsDir)) fs.mkdirSync(PATHS.logsDir, { recursive: true });
  if (!fs.existsSync(PATHS.pipelineDir)) fs.mkdirSync(PATHS.pipelineDir, { recursive: true });
  if (!fs.existsSync(PATHS.projectsDir)) fs.mkdirSync(PATHS.projectsDir, { recursive: true });
  if (!fs.existsSync(PATHS.generatedDir)) fs.mkdirSync(PATHS.generatedDir, { recursive: true });
  if (!fs.existsSync(LOG_PATH)) fs.writeFileSync(LOG_PATH, "", "utf-8");
  if (!fs.existsSync(STATE_PATH)) fs.writeFileSync(STATE_PATH, JSON.stringify(DEFAULT_PIPELINE, null, 2), "utf-8");
  if (!fs.existsSync(JOBS_PATH)) fs.writeFileSync(JOBS_PATH, "[]", "utf-8");
  if (!fs.existsSync(PROJECTS_PATH)) fs.writeFileSync(PROJECTS_PATH, "[]", "utf-8");
  if (!fs.existsSync(STATUS_PATH)) fs.writeFileSync(STATUS_PATH, JSON.stringify({ running: false }, null, 2), "utf-8");
}

function readJsonSync<T>(filePath: string, fallback: T): T {
  ensureStore();
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return raw.trim().length ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonSync<T>(filePath: string, payload: T) {
  ensureStore();
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
}

export async function readPipelineState(): Promise<PipelineState> {
  if (useKv()) {
    const kv = await getKv();
    const raw = await kv.get<string>(`${KV_PREFIX}state`);
    return raw ? (JSON.parse(raw) as PipelineState) : DEFAULT_PIPELINE;
  }
  return readJsonSync<PipelineState>(STATE_PATH, DEFAULT_PIPELINE);
}

export async function updatePipelineStage(
  name: string,
  status: PipelineState["stages"][number]["status"]
) {
  const state = await readPipelineState();
  const updated = state.stages.map((stage) =>
    stage.name === name ? { ...stage, status, updatedAt: new Date().toISOString() } : stage
  );
  if (useKv()) {
    const kv = await getKv();
    await kv.set(`${KV_PREFIX}state`, JSON.stringify({ stages: updated }));
    return;
  }
  writeJsonSync(STATE_PATH, { stages: updated });
}

export async function readJobs(): Promise<AgentJob[]> {
  if (useKv()) {
    const kv = await getKv();
    const raw = await kv.get<string>(`${KV_PREFIX}jobs`);
    return raw ? (JSON.parse(raw) as AgentJob[]) : [];
  }
  return readJsonSync<AgentJob[]>(JOBS_PATH, []);
}

export async function addJob(job: AgentJob) {
  const jobs = await readJobs();
  jobs.unshift(job);
  const slice = jobs.slice(0, 50);
  if (useKv()) {
    const kv = await getKv();
    await kv.set(`${KV_PREFIX}jobs`, JSON.stringify(slice));
    return;
  }
  writeJsonSync(JOBS_PATH, slice);
}

export async function updateJob(id: string, status: AgentJob["status"]) {
  const jobs = await readJobs();
  const updated = jobs.map((job) =>
    job.id === id ? { ...job, status, updatedAt: new Date().toISOString() } : job
  );
  if (useKv()) {
    const kv = await getKv();
    await kv.set(`${KV_PREFIX}jobs`, JSON.stringify(updated));
    return;
  }
  writeJsonSync(JOBS_PATH, updated);
}

export async function readProjects(): Promise<GeneratedProject[]> {
  if (useKv()) {
    const kv = await getKv();
    const raw = await kv.get<string>(`${KV_PREFIX}projects`);
    return raw ? (JSON.parse(raw) as GeneratedProject[]) : [];
  }
  return readJsonSync<GeneratedProject[]>(PROJECTS_PATH, []);
}

export async function addProject(project: GeneratedProject) {
  const projects = await readProjects();
  projects.unshift(project);
  const slice = projects.slice(0, 20);
  if (useKv()) {
    const kv = await getKv();
    await kv.set(`${KV_PREFIX}projects`, JSON.stringify(slice));
    return;
  }
  writeJsonSync(PROJECTS_PATH, slice);
}

export async function readLogs(limit = 50): Promise<string[]> {
  if (useKv()) {
    const kv = await getKv();
    const raw = await kv.get<string>(`${KV_PREFIX}logs`);
    const lines: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    return lines.slice(-limit).reverse();
  }
  ensureStore();
  const raw = fs.readFileSync(LOG_PATH, "utf-8");
  const lines = raw.trim().length ? raw.trim().split("\n") : [];
  return lines.slice(-limit).reverse();
}

export async function appendLogLine(line: string) {
  if (useKv()) {
    const kv = await getKv();
    const raw = await kv.get<string>(`${KV_PREFIX}logs`);
    const lines: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    lines.push(line);
    await kv.set(`${KV_PREFIX}logs`, JSON.stringify(lines.slice(-100)));
    return;
  }
  ensureStore();
  fs.appendFileSync(LOG_PATH, line + "\n", "utf-8");
}

export async function readStatus(): Promise<AgentStatus> {
  const jobs = await readJobs();
  const completed = jobs.filter((j) => j.status === "completed").length;
  const total = jobs.length;
  const successRate = total ? Math.round((completed / total) * 100) : 0;
  const running = useKv()
    ? !!(await (await getKv()).get<boolean>(`${KV_PREFIX}running`))
    : readJsonSync<{ running?: boolean }>(STATUS_PATH, { running: false }).running ?? false;
  const logs = await readLogs(6);
  const recentActivity = logs.map((line) => {
    try {
      return (JSON.parse(line) as { message?: string }).message ?? line;
    } catch {
      return line;
    }
  });
  return {
    running,
    lastRun: jobs[0]?.updatedAt ?? jobs[0]?.createdAt,
    jobsReceived: total,
    jobsCompleted: completed,
    successRate,
    recentActivity
  };
}

export async function setAgentRunning(running: boolean) {
  if (useKv()) {
    const kv = await getKv();
    await kv.set(`${KV_PREFIX}running`, running);
    return;
  }
  writeJsonSync(STATUS_PATH, { running });
}

export async function logEvent(message: string, meta?: Record<string, unknown>) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), message, ...meta });
  await appendLogLine(line);
}

export async function resetStore() {
  if (useKv()) {
    const kv = await getKv();
    await kv.set(`${KV_PREFIX}state`, JSON.stringify(DEFAULT_PIPELINE));
    await kv.set(`${KV_PREFIX}jobs`, "[]");
    await kv.set(`${KV_PREFIX}projects`, "[]");
    await kv.set(`${KV_PREFIX}logs`, "[]");
    await kv.set(`${KV_PREFIX}running`, false);
    return;
  }
  ensureStore();
  fs.writeFileSync(LOG_PATH, "", "utf-8");
  fs.writeFileSync(JOBS_PATH, "[]", "utf-8");
  fs.writeFileSync(PROJECTS_PATH, "[]", "utf-8");
  fs.writeFileSync(STATUS_PATH, JSON.stringify({ running: false }, null, 2), "utf-8");
  fs.writeFileSync(STATE_PATH, JSON.stringify(DEFAULT_PIPELINE, null, 2), "utf-8");
  if (fs.existsSync(PATHS.generatedDir)) {
    for (const entry of fs.readdirSync(PATHS.generatedDir)) {
      fs.rmSync(path.join(PATHS.generatedDir, entry), { recursive: true, force: true });
    }
  }
}
