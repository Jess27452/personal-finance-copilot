# Personal Finance Copilot

A hosted full-stack application that turns bank transaction CSV files into private spending insights,
expense forecasts, and actionable monthly budgets.

The repository now contains two implementations:

- `web/`: the production React application with authenticated users, persistent Cloudflare D1 data, API routes, responsive UI, tests, and deployment configuration.
- `app.py` and `finance_copilot/`: the original Streamlit and Python analytics prototype.

## Features

- Sign in to an isolated, persistent personal workspace.
- Upload and validate bank transactions through a server-side CSV API.
- Categorize transactions with a hybrid rule-based and scikit-learn text classifier.
- Forecast future monthly expenses with Holt linear trend time-series smoothing.
- Generate category-level budget recommendations.
- Explore responsive charts, searchable transactions, and budget progress views.
- Preview the complete product with seeded synthetic data before signing in.

## Demo

The app includes synthetic sample data, so it can be explored without uploading private financial
information.

```bash
cd web
npm install
npm run dev
```

Then open `http://localhost:3000`.

To run the original analytics prototype instead:

```bash
python3 -m streamlit run app.py
```

## CSV Format

```csv
date,description,amount
2026-05-01,Monthly Rent,-1650
2026-05-04,Kroger Grocery,-167.10
```

Expenses may be negative or positive. The app normalizes charges to positive values.

## ML Design

The transaction categorizer uses keyword rules for transparent high-confidence matches and a
TF-IDF logistic regression model for unfamiliar descriptions. The forecast pipeline aggregates
expenses monthly and applies Holt linear trend exponential smoothing to predict upcoming spending.

## Tests

```bash
python3 -m pytest -q
cd web && npm test
```
