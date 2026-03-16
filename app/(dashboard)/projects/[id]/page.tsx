"use client";

import { useEffect, useState } from "react";
import ProjectCodeViewer from "../../../../components/project-code-viewer";

type ProjectMeta = { id: string; title: string; description: string };

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<ProjectMeta | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/projects/${params.id}`, { cache: "no-store" });
        if (!active) return;
        if (!res.ok) {
          setMissing(true);
          return;
        }
        const data = (await res.json()) as { project?: ProjectMeta };
        setProject(data.project ?? null);
      } catch {
        if (active) setMissing(true);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [params.id]);

  if (missing) {
    return (
      <div className="rounded-3xl bg-white/80 p-8 shadow-glass">
        <h1 className="text-2xl font-display font-semibold">Project not found</h1>
        <p className="mt-2 text-sm text-ink/70">Run a new generation and try again.</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="rounded-3xl bg-white/80 p-8 shadow-glass">
        <h1 className="text-2xl font-display font-semibold">Loading project…</h1>
        <p className="mt-2 text-sm text-ink/70">Fetching files and metadata.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-white/80 p-8 shadow-glass">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/60">Project Code</p>
        <h1 className="mt-4 text-3xl font-display font-semibold">{project.title}</h1>
        <p className="mt-2 text-sm text-ink/70">{project.description}</p>
      </header>
      <ProjectCodeViewer projectId={project.id} />
    </div>
  );
}
