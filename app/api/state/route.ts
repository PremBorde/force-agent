import { NextResponse } from "next/server";
import { isRunning } from "../../../lib/runtime";

export const dynamic = "force-dynamic";
import { readJobs, readPipelineState, readProjects, readStatus, readLogs } from "../../../lib/store";
import fs from "fs";
import path from "path";
import { PATHS } from "../../../lib/paths";

export async function GET() {
  const [allProjects, status, pipeline, jobs, logs] = await Promise.all([
    readProjects(),
    readStatus(),
    readPipelineState(),
    readJobs(),
    readLogs(40)
  ]);
  const projects = process.env.KV_REST_API_URL
    ? allProjects
    : allProjects.filter((p) => {
        if (p.outputDir && fs.existsSync(p.outputDir)) return true;
        return fs.existsSync(path.join(PATHS.generatedDir, p.id));
      });

  const response = NextResponse.json({
    status: { ...status, running: status.running || isRunning() },
    pipeline,
    jobs,
    projects,
    logs
  });

  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("CDN-Cache-Control", "no-store");
  response.headers.set("Vercel-CDN-Cache-Control", "no-store");
  return response;
}
