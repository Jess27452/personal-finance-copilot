# Personal Finance Copilot

A portfolio-ready ML application that turns bank transaction CSV files into spending insights,
expense forecasts, and actionable monthly budgets.

## Features

- Upload bank transactions from a CSV file.
- Categorize transactions with a hybrid rule-based and scikit-learn text classifier.
- Forecast future monthly expenses with Holt linear trend time-series smoothing.
- Generate category-level budget recommendations.
- Explore interactive Plotly charts and categorized transactions in a Streamlit dashboard.

## Demo

The app includes synthetic sample data, so it can be explored without uploading private financial
information.

```bash
python3 -m streamlit run app.py
```

Then open `http://localhost:8501`.

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
```

## Resume Bullet

> Built an ML-powered personal finance dashboard that categorizes bank transactions with a hybrid
> TF-IDF classifier, forecasts monthly spending with time-series smoothing, and generates
> category-level budget recommendations.

