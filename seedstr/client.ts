import type { AgentJob } from "../lib/types";
import { logEvent } from "../lib/store";

const baseUrl = process.env.SEEDSTR_BASE_URL ?? process.env.SEEDSTR_API_URL ?? "https://www.seedstr.io/api/v2";

export async function registerAgent() {
  const apiKey = process.env.SEEDSTR_API_KEY;
  const agentId = process.env.SEEDSTR_AGENT_ID;
  if (!apiKey || !agentId) {
    logEvent("Seedstr credentials missing, skipping register");
    return { ok: false, status: 401 };
  }

  try {
    const res = await fetch(`${baseUrl}/agents/register`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ agentId })
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    logEvent("Seedstr register failed", { error: String(err) });
    return { ok: false, status: 500 };
  }
}

export async function pollJobs(): Promise<AgentJob[]> {
  const apiKey = process.env.SEEDSTR_API_KEY;
  const agentId = process.env.SEEDSTR_AGENT_ID;
  if (!apiKey || !agentId) {
    return [];
  }

  try {
    const res = await fetch(`${baseUrl}/agents/${agentId}/jobs`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { jobs?: { id: string; prompt: string }[] };
    return (data.jobs ?? []).map((job) => ({
      id: job.id,
      prompt: job.prompt,
      status: "queued",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  } catch (err) {
    logEvent("Seedstr poll failed", { error: String(err) });
    return [];
  }
}

export async function submitJob(jobId: string, payload: Record<string, unknown>) {
  const apiKey = process.env.SEEDSTR_API_KEY;
  const agentId = process.env.SEEDSTR_AGENT_ID;
  if (!apiKey || !agentId) {
    return { ok: false, status: 401 };
  }

  try {
    const res = await fetch(`${baseUrl}/agents/${agentId}/jobs/${jobId}/submit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    logEvent("Seedstr submit failed", { error: String(err) });
    return { ok: false, status: 500 };
  }
}
