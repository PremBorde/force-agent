"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

export default function PromptRunner() {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  const statusLabel =
    status === "running"
      ? "Generating…"
      : status === "done"
      ? "Done"
      : status === "failed"
      ? "Failed"
      : status;

  const run = async () => {
    if (!prompt.trim()) return;
    setStatus("running");
    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      setStatus(data.ok ? "done" : "failed");
      if (data.ok) {
        router.push("/pipeline");
      }
    } catch {
      setStatus("failed");
    }
  };

  return (
    <div className="mt-6 rounded-3xl border border-ink/10 bg-white/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-ink/60">Custom Prompt</p>
      <textarea
        className="mt-3 h-24 w-full resize-none rounded-2xl border border-ink/10 bg-white/90 p-3 text-sm"
        placeholder="Describe the app you want the agent to generate..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={status === "running"}
      />
      <div className="mt-3 flex items-center gap-3">
        <Button size="sm" onClick={run} disabled={status === "running"}>
          Run Prompt
        </Button>
        {status && (
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink/60">
            {status === "running" && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-ink/20 border-t-ink/60" />
            )}
            {statusLabel}
          </span>
        )}
      </div>
    </div>
  );
}
