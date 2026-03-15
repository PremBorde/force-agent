 "use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { AgentJob, AgentStatus, PipelineState } from "@/lib/types";

const initialStatus: AgentStatus = {
  running: false,
  jobsReceived: 0,
  jobsCompleted: 0,
  successRate: 0,
  recentActivity: []
};

const initialPipeline: PipelineState = { stages: [] };

export default function DashboardPage() {
  const [status, setStatus] = useState<AgentStatus>(initialStatus);
  const [pipeline, setPipeline] = useState<PipelineState>(initialPipeline);
  const [jobs, setJobs] = useState<AgentJob[]>([]);

  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const res = await fetch("/api/state", { cache: "no-store" });
        const data = (await res.json()) as {
          status: AgentStatus;
          pipeline: PipelineState;
          jobs: AgentJob[];
        };

        if (!active) return;
        setStatus(data.status);
        setPipeline(data.pipeline);
        setJobs((data.jobs ?? []).slice(0, 5));
      } catch {
        // ignore dashboard polling failures
      }
    };

    void poll();
    const id = window.setInterval(() => {
      void poll();
    }, 2000);

    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

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
