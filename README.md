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

## Set-up

Clone the repository and move into the project folder:

```bash
git clone https://github.com/Jess27452/personal-finance-copilot.git
cd personal-finance-copilot
```

### Python analytics prototype

You need Python 3 installed. Create and activate a virtual environment for your operating system.

#### macOS and Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
```

#### Windows PowerShell

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

#### Windows Command Prompt

```bat
py -m venv .venv
.venv\Scripts\activate.bat
```

With the virtual environment active, install all Python dependencies and start the app:

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m streamlit run app.py
```

Open the URL shown by Streamlit. When you are finished, leave the virtual environment with
`deactivate`.

### Hosted web app

The web app requires Node.js 22.13 or newer and npm:

```bash
cd web
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Demo

The app includes synthetic sample data, so it can be explored without uploading private financial
information. Follow the [Set-up](#set-up) instructions for either implementation, then explore the
sample dashboard without providing personal financial data.

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
python -m pytest -q
cd web && npm test
```
