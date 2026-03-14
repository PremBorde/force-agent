import { NextResponse } from "next/server";
import { registerAgent, pollJobs } from "../../../../seedstr/client";
import { handleJob } from "../../../../agent/processor";
import { addJob, updatePipelineStage, logEvent } from "../../../../lib/store";

export const maxDuration = 300;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await registerAgent();
  const jobs = await pollJobs();
  for (const job of jobs) {
    await addJob(job);
    await updatePipelineStage("Job Received", "active");
    await logEvent("job received", { jobId: job.id });
    await handleJob(job);
  }
  return NextResponse.json({ ok: true, processed: jobs.length });
}
