import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { readProjects } from "../../../../lib/store";

export const dynamic = "force-dynamic";

type ProjectFile = { path: string; content: string };

function readFilesFromDir(rootDir: string): ProjectFile[] {
  const files: ProjectFile[] = [];

  const visit = (currentDir: string) => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
        continue;
      }
      files.push({
        path: path.relative(rootDir, fullPath).replace(/\\/g, "/"),
        content: fs.readFileSync(fullPath, "utf-8")
      });
    }
  };

  visit(rootDir);
  return files;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const projects = await readProjects();
  const project = projects.find((item) => item.id === params.id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const files = project.files?.length
    ? project.files
    : project.outputDir && fs.existsSync(project.outputDir)
      ? readFilesFromDir(project.outputDir)
      : [];

  if (!files.length) {
    return NextResponse.json({ error: "Project files not found" }, { status: 404 });
  }

  return NextResponse.json({
    project: {
      id: project.id,
      title: project.title,
      description: project.description
    },
    files
  });
}
