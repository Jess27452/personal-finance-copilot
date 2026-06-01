"""Budget recommendations based on categorized expenses and forecasts."""

from __future__ import annotations

import pandas as pd

from .forecasting import forecast_monthly_expenses


DISCRETIONARY_CATEGORIES = {"Dining", "Entertainment", "Shopping", "Travel"}


def build_budget_recommendations(transactions: pd.DataFrame) -> pd.DataFrame:
    """Recommend category budgets with short, actionable explanations."""
    if "category" not in transactions.columns:
        raise ValueError("Transactions must be categorized before building a budget.")

    data = transactions.copy()
    data["month"] = data["date"].dt.to_period("M")
    months = max(data["month"].nunique(), 1)
    averages = data.groupby("category")["amount"].sum().div(months)
    forecast_total = float(forecast_monthly_expenses(data, periods=1)["forecast"].iloc[0])
    average_total = max(float(averages.sum()), 1.0)

    recommendations = []
    for category, average in averages.sort_values(ascending=False).items():
        projected = forecast_total * float(average) / average_total
        target_multiplier = 0.9 if category in DISCRETIONARY_CATEGORIES else 1.0
        recommended = max(projected * target_multiplier, 0.0)
        difference = projected - recommended

        if category in DISCRETIONARY_CATEGORIES and difference > 1:
            rationale = f"Trim about ${difference:,.0f} from projected {category.lower()} spending."
        else:
            rationale = "Keep this close to your recent monthly spending pattern."

        recommendations.append(
            {
                "category": category,
                "recent_monthly_average": round(float(average), 2),
                "projected_next_month": round(projected, 2),
                "recommended_budget": round(recommended, 2),
                "recommendation": rationale,
            }
        )

    return pd.DataFrame(recommendations)

