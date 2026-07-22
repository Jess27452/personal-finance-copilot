import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getUserTransactions } from "../../../db/repository";
import { buildDashboard, sampleTransactions } from "../../../lib/finance";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json(buildDashboard(sampleTransactions));
  try {
    const transactions = await getUserTransactions(user.email, user.displayName);
    return NextResponse.json(buildDashboard(transactions));
  } catch {
    return NextResponse.json(buildDashboard(sampleTransactions), { headers: { "x-ledgerly-mode": "demo-fallback" } });
  }
}
