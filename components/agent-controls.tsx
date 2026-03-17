"use client";

import { useState } from "react";
import { Button } from "./ui/button";

export default function AgentControls() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const run = async (path: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(path, { method: "POST" });
      const data = (await res.json().catch(() => null)) as null | { processed?: number };
      if (path.includes("/start")) {
        setMsg(
          typeof data?.processed === "number"
            ? `Checked Seedstr: ${data.processed} job(s)`
            : "Started"
        );
      } else if (path.includes("/stop")) {
        setMsg("Stopped");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-8 space-y-3">
      <Button size="sm" className="w-full" disabled={busy} onClick={() => run("/api/agent/start")}>
        Check Seedstr Jobs
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
          Working…
        </div>
      )}
      {!busy && msg && (
        <div className="text-xs uppercase tracking-[0.2em] text-ink/60">{msg}</div>
      )}
    </div>
  );
}
