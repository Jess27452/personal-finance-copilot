import { FinanceDashboard } from "./components/finance-dashboard";
import { getChatGPTUser } from "./chatgpt-auth";
import { buildDashboard, sampleTransactions } from "../lib/finance";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  const initialDashboard = buildDashboard(sampleTransactions);

  return (
    <FinanceDashboard
      initialDashboard={initialDashboard}
      user={user ? { displayName: user.displayName, email: user.email } : null}
    />
  );
}
