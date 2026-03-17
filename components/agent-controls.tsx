"use client";

import { useState } from "react";
import { Button } from "./ui/button";

export default function AgentControls() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [action, setAction] = useState<"start" | "stop" | "demo" | null>(null);

  const run = async (path: string) => {
    setBusy(true);
    setMsg(null);
    setAction(
      path.includes("/start") ? "start" : path.includes("/stop") ? "stop" : "demo"
    );
    try {
      const res = await fetch(path, { method: "POST" });
      const data = (await res.json().catch(() => null)) as null | { processed?: number };
      if (path.includes("/start")) {
        setMsg(
          typeof data?.processed === "number"
            ? data.processed > 0
              ? `Processed ${data.processed} job${data.processed > 1 ? "s" : ""}`
              : "Waiting for job"
            : "Waiting for job"
        );
      } else if (path.includes("/stop")) {
        setMsg("Agent stopped");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-8 space-y-3">
      <Button size="sm" className="w-full" disabled={busy} onClick={() => run("/api/agent/start")}>
        Start Agent
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="w-full"
        disabled={busy}
        onClick={() => run("/api/agent/stop")}
      >
        Stop Agent
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className="w-full"
        disabled={busy}
        onClick={() => run("/api/agent/demo")}
      >
        Run Demo Job
      </Button>
      {busy && (
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink/60">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-ink/20 border-t-ink/60" />
          {action === "start"
            ? "Starting agent…"
            : action === "stop"
            ? "Stopping agent…"
            : "Working…"}
        </div>
      )}
      {!busy && msg && (
        <div className="text-xs uppercase tracking-[0.2em] text-ink/60">{msg}</div>
      )}
    </div>
  );
}
