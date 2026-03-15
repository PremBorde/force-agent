import { NextResponse } from "next/server";
import archiver from "archiver";
import fs from "fs";
import { PassThrough } from "stream";
import { readProjects } from "../../../../../lib/store";

export const dynamic = "force-dynamic";

async function buildZip(files: { path: string; content: string }[]) {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = new PassThrough();
  const chunks: Buffer[] = [];

  stream.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));

  const done = new Promise<Buffer>((resolve, reject) => {
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);
  });

  archive.pipe(stream);
  for (const file of files) {
    archive.append(file.content, { name: file.path });
  }
  await archive.finalize();

  return done;
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

  if (project.files?.length) {
    const zip = await buildZip(project.files);
    return new NextResponse(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${project.id}.zip"`
      }
    });
  }

  if (project.zipPath && fs.existsSync(project.zipPath)) {
    const zip = fs.readFileSync(project.zipPath);
    return new NextResponse(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${project.id}.zip"`
      }
    });
  }

  return NextResponse.json({ error: "Project zip not found" }, { status: 404 });
}
