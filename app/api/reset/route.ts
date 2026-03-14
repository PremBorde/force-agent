import { NextResponse } from "next/server";
import { resetStore } from "../../../lib/store";

export async function POST() {
  try {
    await resetStore();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
