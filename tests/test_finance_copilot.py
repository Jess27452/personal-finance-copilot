from io import StringIO

import pandas as pd
import pytest

from finance_copilot.budgets import build_budget_recommendations
from finance_copilot.categorization import TransactionCategorizer
from finance_copilot.data import load_transactions
from finance_copilot.forecasting import forecast_monthly_expenses


def test_load_transactions_normalizes_bank_csv():
    source = StringIO("Transaction Date,Merchant,Amount\n2026-01-01,Coffee Shop,\"-$4.50\"\n")

    transactions = load_transactions(source)

    assert transactions.loc[0, "description"] == "Coffee Shop"
    assert transactions.loc[0, "amount"] == 4.5


def test_load_transactions_requires_expected_columns():
    with pytest.raises(ValueError, match="missing required columns"):
        load_transactions(StringIO("date,amount\n2026-01-01,-10\n"))


def test_categorizer_uses_rule_for_known_merchant():
    categorizer = TransactionCategorizer()

    prediction = categorizer.predict("Uber Trip Downtown")

    assert prediction.category == "Transportation"
    assert prediction.method == "rule"


def test_forecast_returns_requested_future_months():
    transactions = pd.DataFrame(
        {
            "date": pd.to_datetime(["2026-01-01", "2026-02-01", "2026-03-01"]),
            "amount": [100.0, 120.0, 140.0],
        }
    )

    forecast = forecast_monthly_expenses(transactions, periods=2)

    assert len(forecast) == 2
    assert forecast.index[0] == pd.Timestamp("2026-04-01")
    assert forecast["forecast"].iloc[0] > 140


def test_budget_recommendations_trim_discretionary_spending():
    transactions = pd.DataFrame(
        {
            "date": pd.to_datetime(["2026-01-01", "2026-02-01"]),
            "amount": [100.0, 120.0],
            "category": ["Dining", "Dining"],
        }
    )

    budget = build_budget_recommendations(transactions)

    assert budget.loc[0, "recommended_budget"] < budget.loc[0, "projected_next_month"]

