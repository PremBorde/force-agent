import { readProjects } from "../../../../lib/store";
import ProjectCodeViewer from "../../../../components/project-code-viewer";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const projects = await readProjects();
  const project = projects.find((p) => p.id === params.id);

  if (!project) {
    return (
      <div className="rounded-3xl bg-white/80 p-8 shadow-glass">
        <h1 className="text-2xl font-display font-semibold">Project not found</h1>
        <p className="mt-2 text-sm text-ink/70">Run a new generation and try again.</p>
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
