import { NextResponse } from "next/server";
import { startAgent, isRunning } from "../../../../lib/runtime";
import { logEvent, setAgentRunning } from "../../../../lib/store";
import { registerAgent, pollJobs } from "../../../../seedstr/client";
import { handleJob } from "../../../../agent/processor";
import { addJob, updatePipelineStage } from "../../../../lib/store";

export async function POST() {
  // On Vercel/serverless, we can't keep a long-running poll loop alive.
  // Instead, treat "Start" as "check Seedstr now" (one poll cycle).
  if (process.env.VERCEL) {
    await setAgentRunning(true);
    await logEvent("checking Seedstr for jobs");
    await registerAgent();
    const jobs = await pollJobs();
    for (const job of jobs) {
      await addJob(job);
      await updatePipelineStage("Job Received", "active");
      await logEvent("job received", { jobId: job.id });
      await handleJob(job);
    }
    await setAgentRunning(false);
    return NextResponse.json({ ok: true, processed: jobs.length, running: false });
  }

  startAgent();
  await setAgentRunning(true);
  await logEvent("agent waiting for request");
  return NextResponse.json({ ok: true, running: isRunning() });
}
