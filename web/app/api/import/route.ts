import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getUserTransactions, saveTransactions } from "../../../db/repository";
import { buildDashboard, parseCsv } from "../../../lib/finance";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Sign in before importing private financial data." }, { status: 401 });
  try {
    const body = await request.json() as { csv?: unknown };
    if (typeof body.csv !== "string" || body.csv.length > 5_000_000) return NextResponse.json({ error: "Provide a CSV smaller than 5 MB." }, { status: 400 });
    const imported = parseCsv(body.csv);
    await saveTransactions(user.email, imported);
    const all = await getUserTransactions(user.email, user.displayName);
    return NextResponse.json({ imported: imported.length, dashboard: buildDashboard(all) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The import could not be processed." }, { status: 400 });
  }
}
