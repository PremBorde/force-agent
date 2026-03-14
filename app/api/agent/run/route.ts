import { NextResponse } from "next/server";
import { handleJob } from "../../../../agent/processor";
import { addJob } from "../../../../lib/store";
import type { AgentJob } from "../../../../lib/types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { prompt?: string };
  const prompt = body.prompt?.trim();

  if (!prompt) {
    return NextResponse.json({ ok: false, error: "Prompt is required" }, { status: 400 });
  }

  const job: AgentJob = {
    id: `manual-${Date.now()}`,
    prompt,
    status: "queued",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await addJob(job);
  await handleJob(job);

  return NextResponse.json({ ok: true, jobId: job.id });
}
