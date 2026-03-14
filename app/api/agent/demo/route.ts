import { NextResponse } from "next/server";
import { handleJob } from "../../../../agent/processor";
import { addJob } from "../../../../lib/store";
import type { AgentJob } from "../../../../lib/types";

export async function POST() {
  const job: AgentJob = {
    id: `demo-${Date.now()}`,
    prompt: "Build a crypto analytics dashboard.",
    status: "queued",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await addJob(job);
  await handleJob(job);
  return NextResponse.json({ ok: true, jobId: job.id });
}
