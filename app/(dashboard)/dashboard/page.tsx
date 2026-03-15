import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { readJobs, readStatus, readPipelineState } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [status, allJobs, pipeline] = await Promise.all([
    readStatus(),
    readJobs(),
    readPipelineState()
  ]);
  const jobs = allJobs.slice(0, 5);

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-white/80 p-8 shadow-glass">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/60">
          Agent Overview
        </p>
        <h1 className="mt-4 text-4xl font-display font-semibold">
          ForgeAgent Mission Control
        </h1>
        <p className="mt-3 text-sm text-ink/70">
          Autonomously interpreting Seedstr jobs, generating full-stack SaaS apps, and
          submitting artifacts on your behalf.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.2em] text-ink/60">
              Jobs Received
            </p>
            <p className="text-2xl font-display font-semibold">
              {status.jobsReceived}
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.2em] text-ink/60">
              Jobs Completed
            </p>
            <p className="text-2xl font-display font-semibold">
              {status.jobsCompleted}
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.2em] text-ink/60">
              Success Rate
            </p>
            <p className="text-2xl font-display font-semibold">
              {status.successRate}%
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.2em] text-ink/60">
              Latest Activity
            </p>
            <p className="text-sm text-ink/70">
              {status.recentActivity[0] ?? "Awaiting first job"}
            </p>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.2em] text-ink/60">
              Live Pipeline
            </p>
            <p className="text-lg font-display font-semibold">Current Run</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-ink/70">
              {pipeline.stages.map((stage) => (
                <li key={stage.name} className="flex items-center justify-between">
                  <span>{stage.name}</span>
                  <span className="rounded-full bg-ink/5 px-3 py-1 text-xs uppercase">
                    {stage.status}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.2em] text-ink/60">
              Recent Jobs
            </p>
            <p className="text-lg font-display font-semibold">Latest Queue</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-ink/70">
              {jobs.map((job) => (
                <li key={job.id} className="flex flex-col gap-1">
                  <span className="font-semibold text-ink">{job.prompt}</span>
                  <span className="text-xs uppercase tracking-[0.2em]">
                    {job.status}
                  </span>
                </li>
              ))}
              {!jobs.length && <li>No jobs yet.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
