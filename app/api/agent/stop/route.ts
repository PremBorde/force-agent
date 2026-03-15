import { NextResponse } from "next/server";
import { stopAgent, isRunning } from "../../../../lib/runtime";
import { logEvent, setAgentRunning } from "../../../../lib/store";

export async function POST() {
  stopAgent();
  await setAgentRunning(false);
  await logEvent("agent loop stopped");
  return NextResponse.json({ ok: true, running: isRunning() });
}
