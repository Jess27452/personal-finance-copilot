"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dashboard } from "../../lib/finance";

type User = { displayName: string; email: string } | null;
type View = "overview" | "transactions" | "budgets";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const preciseMoney = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function FinanceDashboard({ initialDashboard, user }: { initialDashboard: Dashboard; user: User }) {
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [view, setView] = useState<View>("overview");
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: Dashboard) => setDashboard(data))
      .catch(() => undefined);
  }, []);

  const visibleTransactions = useMemo(() => {
    const normalized = query.toLowerCase();
    return dashboard.transactions.filter((item) => `${item.description} ${item.category} ${item.date}`.toLowerCase().includes(normalized));
  }, [dashboard.transactions, query]);

  async function importCsv() {
    if (!file) { setStatus("Choose a CSV file first."); return; }
    setBusy(true); setStatus("Analyzing and categorizing your transactions…");
    try {
      const response = await fetch("/api/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ csv: await file.text() }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Import failed.");
      setDashboard(payload.dashboard); setStatus(`${payload.imported} transactions imported successfully.`);
      setTimeout(() => { setUploadOpen(false); setStatus(""); setFile(null); }, 900);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Import failed."); }
    finally { setBusy(false); }
  }

  const maxMonth = Math.max(...dashboard.months.map((item) => item.amount), 1);
  const firstName = user?.displayName.split(" ")[0] ?? "there";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">L</span> LEDGERLY</div>
        <nav className="nav" aria-label="Main navigation">
          <NavButton view="overview" current={view} onClick={setView} symbol="⌂">Overview</NavButton>
          <NavButton view="transactions" current={view} onClick={setView} symbol="↕">Transactions</NavButton>
          <NavButton view="budgets" current={view} onClick={setView} symbol="◒">Budgets</NavButton>
        </nav>
        <div className="account-card">
          <div className="account-name">{user ? user.displayName : "Demo workspace"}</div>
          <div className="account-email">{user ? user.email : "Sample data · read only"}</div>
          <a className="sign-link" href={user ? "/signout-with-chatgpt?return_to=/" : "/signin-with-chatgpt?return_to=/"}>{user ? "Sign out" : "Sign in to save data →"}</a>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <span className="demo-pill">{user ? "Private workspace" : "Interactive portfolio demo"}</span>
          <div className="top-actions">
            <button className="button secondary" onClick={() => setView("transactions")}>View transactions</button>
            {user ? <button className="button" onClick={() => setUploadOpen(true)}>Import CSV</button> : <a className="button" href="/signin-with-chatgpt?return_to=/">Sign in to import</a>}
          </div>
        </header>

        {view === "overview" && <>
          <section className="hero-row">
            <div><div className="eyebrow">Your financial picture</div><h1>Good {greeting()}, {firstName}.<br />Here’s the story.</h1></div>
            <p className="hero-note">A clear view of your spending patterns, what next month may look like, and where a small change can make room.</p>
          </section>

          <section className="metrics" aria-label="Financial summary">
            <Metric label="Total analyzed" value={money.format(dashboard.totalSpending)} delta={`${dashboard.transactions.length} transactions`} />
            <Metric label="Monthly average" value={money.format(dashboard.monthlyAverage)} delta="Across imported history" />
            <Metric label="Next month" value={money.format(dashboard.forecast)} delta="Holt trend forecast" warn />
            <Metric label="Room to save" value={money.format(dashboard.savingsOpportunity)} delta="Suggested monthly trim" />
          </section>

          <section className="grid">
            <article className="panel dark">
              <div className="panel-header"><h2>Monthly spending</h2><span className="panel-caption">Actual + forecast</span></div>
              <div className="month-bars" aria-label="Monthly spending chart">
                {dashboard.months.map((item, index) => <div className="month-bar-wrap" key={`${item.month}-${index}`}><div className={`month-bar ${item.forecast ? "forecast" : ""}`} data-value={money.format(item.amount)} style={{ height: `${Math.max((item.amount / maxMonth) * 100, 3)}%` }} /><span className="month-label">{item.month}</span></div>)}
              </div>
              <div className="chart-legend"><span><i className="legend-dot" />Actual</span><span><i className="legend-dot gold" />Forecast</span></div>
            </article>
            <article className="panel">
              <div className="panel-header"><h2>Where it went</h2><span className="panel-caption">All time</span></div>
              <div className="category-list">
                {dashboard.categories.slice(0, 6).map((item) => <div className="category-row" key={item.category}><span>{item.category}</span><span className="category-amount">{money.format(item.amount)}</span><div className="track"><div className="fill" style={{ width: `${item.share * 100}%` }} /></div></div>)}
              </div>
            </article>
          </section>

          <section className="insight">
            <div><strong>A practical place to start</strong><p>Your discretionary categories have the most flexible room. Ledgerly recommends a modest 10% trim—not an unrealistic overhaul.</p></div>
            <div className="insight-amount">+{money.format(dashboard.savingsOpportunity)} / mo</div>
          </section>
        </>}

        {view === "transactions" && <section className="data-page">
          <div className="section-title"><div><div className="eyebrow">Imported history</div><h2>Transactions</h2></div><input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search merchant or category" aria-label="Search transactions" /></div>
          <div className="table-wrap"><table><thead><tr><th>Date</th><th>Merchant</th><th>Category</th><th>Method</th><th style={{ textAlign: "right" }}>Amount</th></tr></thead><tbody>{visibleTransactions.map((item) => <tr key={item.id}><td>{new Date(`${item.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td><td>{item.description}</td><td><span className="category-chip">{item.category}</span></td><td>{item.method === "rule" ? `${Math.round(item.confidence * 100)}% match` : "Review"}</td><td className="amount">{preciseMoney.format(item.amount)}</td></tr>)}</tbody></table></div>
        </section>}

        {view === "budgets" && <section className="data-page">
          <div className="section-title"><div><div className="eyebrow">Recommendations</div><h2>A budget built from behavior</h2></div></div>
          <div className="budget-grid">{dashboard.budgets.map((item) => { const progress = Math.min((item.spent / Math.max(item.recommended, 1)) * 100, 100); return <article className="budget-card" key={item.category}><div className="budget-top"><h3>{item.category}</h3><strong>{money.format(item.recommended)}</strong></div><p>{item.rationale}</p><div className="track"><div className="fill" style={{ width: `${progress}%` }} /></div><div className="budget-values"><span>Recent {money.format(item.spent)}</span><span>Target {money.format(item.recommended)}</span></div></article>; })}</div>
        </section>}
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <NavButton view="overview" current={view} onClick={setView}>Home</NavButton><NavButton view="transactions" current={view} onClick={setView}>Activity</NavButton><NavButton view="budgets" current={view} onClick={setView}>Budget</NavButton>
      </nav>

      {uploadOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setUploadOpen(false); }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="upload-title"><h2 id="upload-title">Import bank transactions</h2><p>Upload a CSV with date, description, and amount columns. Ledgerly normalizes charges, categorizes merchants, and refreshes every forecast.</p><div className="dropzone"><input type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} aria-label="Choose transaction CSV" /></div><div className="modal-actions"><button className="button secondary" onClick={() => setUploadOpen(false)}>Cancel</button><button className="button" disabled={busy} onClick={importCsv}>{busy ? "Importing…" : "Import transactions"}</button></div>{status && <p className={`status ${status.includes("failed") || status.includes("missing") || status.includes("Choose") ? "error" : ""}`}>{status}</p>}</div></div>}
    </div>
  );
}

function NavButton({ view, current, onClick, symbol, children }: { view: View; current: View; onClick: (view: View) => void; symbol?: string; children: React.ReactNode }) {
  return <button className={current === view ? "active" : ""} onClick={() => onClick(view)} aria-current={current === view ? "page" : undefined}>{symbol && <span className="nav-symbol">{symbol}</span>}{children}</button>;
}

function Metric({ label, value, delta, warn }: { label: string; value: string; delta: string; warn?: boolean }) {
  return <div className="metric"><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className={`metric-delta ${warn ? "warn" : ""}`}>{delta}</div></div>;
}

function greeting() { const hour = new Date().getHours(); return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"; }
