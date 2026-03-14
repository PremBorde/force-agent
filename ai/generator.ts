import { logEvent } from "../lib/store";

type GeneratedFile = {
  path: string;
  content: string;
};

type GeneratedProject = {
  name: string;
  description: string;
  files: GeneratedFile[];
};

const DEFAULT_NAME = "Forge Generated App";

export async function generateProject(prompt: string, plan: unknown): Promise<GeneratedProject> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    await logEvent("OpenRouter API key missing, using template fallback");
    return {
      name: DEFAULT_NAME,
      description: "Template fallback project",
      files: []
    };
  }

  const model = process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-chat";
  const systemPrompt =
    "You are an expert software generator. Return JSON only with keys: name, description, files. files is an array of {path, content}.";
  const userPrompt = `Generate a complete working SaaS application based on the following requirements.\n\nRequirements:\n${prompt}\n\nTech stack:\n\nNext.js\nTailwind\nPrisma\nSQLite\n\nReturn a full project including folder structure and all files.\n\nPlan:\n${JSON.stringify(plan, null, 2)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://forge-agent.local",
        "X-Title": "ForgeAgent"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 3000
      })
    });
    clearTimeout(timeout);

    if (!response.ok) {
      await logEvent("OpenRouter response error", { status: response.status });
      return { name: DEFAULT_NAME, description: "Template fallback project", files: [] };
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const content = payload.choices?.[0]?.message?.content ?? "";
    const parsed = safeParse(content);
    if (!parsed || !Array.isArray(parsed.files)) {
      await logEvent("OpenRouter response parse failed", { sample: content.slice(0, 200) });
      return { name: DEFAULT_NAME, description: "Template fallback project", files: [] };
    }

    return {
      name: parsed.name ?? DEFAULT_NAME,
      description: parsed.description ?? "Generated SaaS app",
      files: parsed.files
    };
  } catch (err) {
    await logEvent("OpenRouter request failed", { error: String(err) });
    return { name: DEFAULT_NAME, description: "Template fallback project", files: [] };
  }
}

function safeParse(text: string): GeneratedProject | null {
  try {
    return JSON.parse(text) as GeneratedProject;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const slice = text.slice(start, end + 1);
      try {
        return JSON.parse(slice) as GeneratedProject;
      } catch {
        return null;
      }
    }
    return null;
  }
}
