export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  confidence: number;
  method: "rule" | "fallback" | "manual";
};

export type Dashboard = {
  transactions: Transaction[];
  totalSpending: number;
  monthlyAverage: number;
  forecast: number;
  savingsOpportunity: number;
  categories: Array<{ category: string; amount: number; share: number }>;
  months: Array<{ month: string; amount: number; forecast?: boolean }>;
  budgets: Array<{ category: string; spent: number; recommended: number; rationale: string }>;
};

const rows: Array<[string, string, number]> = [
  ["2025-11-01","Monthly Rent",1650],["2025-11-04","Whole Foods Market",138.54],["2025-11-06","Metro Transit",32],["2025-11-10","Electric Bill",74.25],["2025-11-14","Netflix",15.49],["2025-11-19","Chipotle",18.75],
  ["2025-12-01","Monthly Rent",1650],["2025-12-03","Trader Joes",121.43],["2025-12-07","Uber Trip",26.18],["2025-12-11","Internet Service",59.99],["2025-12-16","Spotify",11.99],["2025-12-21","Amazon Marketplace",82.35],
  ["2026-01-01","Monthly Rent",1650],["2026-01-05","Kroger Grocery",149.62],["2026-01-09","Shell Gas",44.30],["2026-01-12","Mobile Phone Bill",52],["2026-01-18","Local Cafe",13.70],["2026-01-24","Gym Membership",39],
  ["2026-02-01","Monthly Rent",1650],["2026-02-04","Whole Foods Market",158.81],["2026-02-10","Lyft Ride",22.40],["2026-02-13","Electric Bill",81.36],["2026-02-17","Movie Theater",29.50],["2026-02-25","Target Store",64.18],
  ["2026-03-01","Monthly Rent",1650],["2026-03-06","Costco Groceries",174.92],["2026-03-11","Metro Transit",32],["2026-03-14","Internet Service",59.99],["2026-03-20","Starbucks Coffee",17.84],["2026-03-27","Online Course",49],
  ["2026-04-01","Monthly Rent",1650],["2026-04-05","Trader Joes",142.67],["2026-04-09","Uber Trip",34.76],["2026-04-12","Mobile Phone Bill",52],["2026-04-16","Spotify",11.99],["2026-04-23","Amazon Marketplace",96.52],
  ["2026-05-01","Monthly Rent",1650],["2026-05-04","Kroger Grocery",167.10],["2026-05-08","Shell Gas",51.42],["2026-05-13","Electric Bill",88.25],["2026-05-18","DoorDash Restaurant",31.64],["2026-05-25","Pharmacy",24.80],
];

const keywords: Record<string, string[]> = {
  Housing: ["rent", "lease", "mortgage", "property"],
  Groceries: ["grocery", "groceries", "whole foods", "trader joe", "kroger", "costco"],
  Dining: ["restaurant", "cafe", "coffee", "starbucks", "chipotle", "doordash"],
  Transportation: ["uber", "lyft", "gas", "shell", "metro", "parking", "transit"],
  Utilities: ["electric", "water", "utility", "internet", "phone", "verizon", "comcast"],
  Entertainment: ["netflix", "spotify", "movie", "concert", "steam"],
  Shopping: ["amazon", "target", "clothing", "best buy"],
  Health: ["pharmacy", "doctor", "dental", "gym", "cvs", "walgreens"],
  Travel: ["airline", "hotel", "airbnb", "rental car", "flight"],
  Education: ["course", "textbook", "tuition", "udemy", "coursera"],
};

export function categorize(description: string) {
  const normalized = description.trim().toLowerCase();
  for (const [category, terms] of Object.entries(keywords)) {
    if (terms.some((term) => normalized.includes(term))) return { category, confidence: .99, method: "rule" as const };
  }
  return { category: "Other", confidence: .35, method: "fallback" as const };
}

export const sampleTransactions: Transaction[] = rows.map(([date, description, amount], index) => ({
  id: `demo-${index + 1}`, date, description, amount, ...categorize(description),
}));

function round(value: number) { return Math.round(value * 100) / 100; }

function holt(values: number[], alpha = .6, beta = .25) {
  if (!values.length) return 0;
  if (values.length === 1) return values[0];
  let level = values[0];
  let trend = values[1] - values[0];
  for (const value of values.slice(1)) {
    const previous = level;
    level = alpha * value + (1 - alpha) * (level + trend);
    trend = beta * (level - previous) + (1 - beta) * trend;
  }
  return Math.max(level + trend, 0);
}

export function buildDashboard(input: Transaction[]): Dashboard {
  const transactions = [...input].sort((a, b) => b.date.localeCompare(a.date));
  const categoryMap = new Map<string, number>();
  const monthMap = new Map<string, number>();
  for (const item of transactions) {
    categoryMap.set(item.category, (categoryMap.get(item.category) ?? 0) + item.amount);
    const month = item.date.slice(0, 7);
    monthMap.set(month, (monthMap.get(month) ?? 0) + item.amount);
  }
  const totalSpending = [...categoryMap.values()].reduce((a, b) => a + b, 0);
  const monthEntries = [...monthMap.entries()].sort(([a], [b]) => a.localeCompare(b));
  const forecast = round(holt(monthEntries.map(([, amount]) => amount)));
  const categories = [...categoryMap.entries()].sort((a, b) => b[1] - a[1]).map(([category, amount]) => ({ category, amount: round(amount), share: totalSpending ? amount / totalSpending : 0 }));
  const discretionary = new Set(["Dining", "Entertainment", "Shopping", "Travel"]);
  const monthsCount = Math.max(monthEntries.length, 1);
  const monthlyCategoryTotal = categories.reduce((sum, item) => sum + item.amount / monthsCount, 0) || 1;
  const budgets = categories.map((item) => {
    const projected = forecast * (item.amount / monthsCount) / monthlyCategoryTotal;
    const recommended = projected * (discretionary.has(item.category) ? .9 : 1);
    return {
      category: item.category,
      spent: round(item.amount / monthsCount),
      recommended: round(recommended),
      rationale: discretionary.has(item.category) ? `A 10% trim creates room without changing fixed costs.` : "Keep this close to your recent monthly pattern.",
    };
  });
  const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
  const months: Dashboard["months"] = monthEntries.map(([month, amount]) => ({ month: monthFormatter.format(new Date(`${month}-02T00:00:00`)), amount: round(amount) }));
  const next = monthEntries.at(-1)?.[0] ?? "2026-05";
  const nextDate = new Date(`${next}-02T00:00:00`); nextDate.setMonth(nextDate.getMonth() + 1);
  months.push({ month: monthFormatter.format(nextDate), amount: forecast, forecast: true });
  const savingsOpportunity = round(budgets.reduce((sum, item) => sum + Math.max(item.spent - item.recommended, 0), 0));
  return { transactions, totalSpending: round(totalSpending), monthlyAverage: round(totalSpending / monthsCount), forecast, savingsOpportunity, categories, months, budgets };
}

function splitCsvLine(line: string) {
  const fields: string[] = []; let value = ""; let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') { value += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { fields.push(value.trim()); value = ""; }
    else value += char;
  }
  fields.push(value.trim()); return fields;
}

export function parseCsv(csv: string): Transaction[] {
  const lines = csv.replace(/\r/g, "").split("\n").filter(Boolean);
  if (lines.length < 2) throw new Error("The CSV does not contain any transactions.");
  const aliases: Record<string, string> = { "transaction date": "date", "posted date": "date", merchant: "description", memo: "description", transaction: "description", value: "amount" };
  const headers = splitCsvLine(lines[0]).map((header) => aliases[header.trim().toLowerCase().replaceAll("_", " ")] ?? header.trim().toLowerCase().replaceAll(" ", "_"));
  for (const required of ["date", "description", "amount"]) if (!headers.includes(required)) throw new Error(`CSV is missing required column: ${required}`);
  const parsed: Transaction[] = [];
  for (const [index, line] of lines.slice(1).entries()) {
    const fields = splitCsvLine(line); const record = Object.fromEntries(headers.map((header, i) => [header, fields[i] ?? ""]));
    const amount = Math.abs(Number(record.amount.replace(/[$,]/g, "")));
    const date = new Date(record.date);
    if (!record.description.trim() || !Number.isFinite(amount) || amount <= 0 || Number.isNaN(date.getTime())) continue;
    parsed.push({ id: crypto.randomUUID(), date: date.toISOString().slice(0, 10), description: record.description.trim(), amount, ...categorize(record.description) });
  }
  if (!parsed.length) throw new Error("The CSV does not contain any valid transactions.");
  return parsed;
}
