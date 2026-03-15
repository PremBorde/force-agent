import { interpretPrompt } from "../ai/interpreter";
import { generatePlan } from "../ai/planner";
import { generateProject } from "../ai/generator";
import { buildProject } from "../builder/template";
import { writeProject } from "../builder/writer";
import { zipProject } from "../builder/zipper";
import { submitJob } from "./submission";
import { needsClarification, clarificationQuestions } from "../clarification/questions";
import { addProject, updateJob, updatePipelineStage, logEvent } from "../lib/store";
import type { AgentJob } from "../lib/types";

export async function handleJob(job: AgentJob) {
  await updateJob(job.id, "running");
  await updatePipelineStage("Job Received", "done");

  if (!job.prompt.trim()) {
    await updateJob(job.id, "failed");
    await updatePipelineStage("Prompt Analysis", "error");
    await logEvent("invalid prompt", { jobId: job.id });
    return;
  }

  try {
    await updatePipelineStage("Prompt Analysis", "active");
    const interpretation = interpretPrompt(job.prompt);
    await updatePipelineStage("Prompt Analysis", "done");

    let clarification = null as null | string[];
    await updatePipelineStage("Clarification", "active");
    if (needsClarification(job.prompt)) {
      clarification = clarificationQuestions(job.prompt);
      await updateJob(job.id, "clarification");
      await logEvent("clarification required", { jobId: job.id, questions: clarification });
    }
    await updatePipelineStage("Clarification", "done");

    await updatePipelineStage("Code Generation", "active");
    const plan = generatePlan(job.prompt, interpretation.type);
    const aiProject = await generateProject(job.prompt, plan);
    await updatePipelineStage("Code Generation", "done");

    await updatePipelineStage("Project Assembly", "active");
    const templateProject = buildProject({
      name: aiProject.name,
      description: aiProject.description,
      promptType: interpretation.type
    });
    const finalProject = {
      ...templateProject,
      files: aiProject.files.length ? aiProject.files : templateProject.files
    };
    const written = await writeProject(finalProject);
    await updatePipelineStage("Project Assembly", "done");

    await updatePipelineStage("Zip Packaging", "active");
    const zipPath = await zipProject(written.outputDir, written.projectId);
    await updatePipelineStage("Zip Packaging", "done");

    await updatePipelineStage("Submission", "active");
    const submission = await submitJob(job.id, zipPath, {
      prompt: job.prompt,
      clarification,
      plan
    });
    await updatePipelineStage("Submission", "done");

    await addProject({
      id: written.projectId,
      title: finalProject.name,
      description: finalProject.description,
      createdAt: new Date().toISOString(),
      promptType: interpretation.type,
      fileTree: written.fileTree,
      preview: written.preview,
      files: finalProject.files,
      zipPath,
      outputDir: written.outputDir
    });

    await updateJob(job.id, submission.ok ? "completed" : "failed");
    await logEvent("job completed", { jobId: job.id, submission });
  } catch (err) {
    await updateJob(job.id, "failed");
    await updatePipelineStage("Submission", "error");
    await logEvent("job failed", { jobId: job.id, error: String(err) });
  }
}
