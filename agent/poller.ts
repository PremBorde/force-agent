import { pollJobs } from "../seedstr/client";
import { addJob, updatePipelineStage, logEvent } from "../lib/store";
import type { AgentJob } from "../lib/types";

const intervalMs = Number(process.env.POLL_INTERVAL ?? 5000);

export function startPolling(handler: (job: AgentJob) => Promise<void>) {
  let timer: NodeJS.Timeout | null = null;
  let stopped = false;

  const tick = async () => {
    if (stopped) return;
    try {
      const jobs = await pollJobs();
      if (jobs.length) {
        for (const job of jobs) {
          await addJob(job);
          await updatePipelineStage("Job Received", "active");
          await logEvent("job received", { jobId: job.id });
          await handler(job);
        }
      }
    } catch (err) {
      await logEvent("polling error", { error: String(err) });
    }
  };

  timer = setInterval(tick, intervalMs);
  tick();

  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
  };
}
