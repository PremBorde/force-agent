export type PromptType =
  | "Landing page"
  | "Dashboard"
  | "AI tool"
  | "SaaS platform"
  | "API backend";

export type PipelineStage =
  | "Job Received"
  | "Prompt Analysis"
  | "Clarification"
  | "Code Generation"
  | "Project Assembly"
  | "Zip Packaging"
  | "Submission";

export type PipelineState = {
  stages: {
    name: PipelineStage;
    status: "idle" | "active" | "done" | "error";
    updatedAt?: string;
  }[];
};

export type AgentJob = {
  id: string;
  prompt: string;
  status: "queued" | "running" | "clarification" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
};

export type GeneratedProject = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  promptType: PromptType;
  fileTree: string[];
  preview: string;
  files?: { path: string; content: string }[];
  zipPath?: string;
  outputDir?: string;
};

export type AgentStatus = {
  running: boolean;
  lastRun?: string;
  jobsReceived: number;
  jobsCompleted: number;
  successRate: number;
  recentActivity: string[];
};
