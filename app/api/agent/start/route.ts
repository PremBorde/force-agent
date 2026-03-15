import { NextResponse } from "next/server";
import { startAgent, isRunning } from "../../../../lib/runtime";
import { logEvent, setAgentRunning } from "../../../../lib/store";

export async function POST() {
  startAgent();
  await setAgentRunning(true);
  await logEvent("agent waiting for request");
  return NextResponse.json({ ok: true, running: isRunning() });
}
