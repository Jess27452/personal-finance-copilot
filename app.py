"""Streamlit dashboard for the Personal Finance Copilot."""

from __future__ import annotations

from pathlib import Path

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

from finance_copilot import (
    TransactionCategorizer,
    build_budget_recommendations,
    forecast_monthly_expenses,
    load_transactions,
)
from finance_copilot.forecasting import monthly_expenses


SAMPLE_DATA = Path(__file__).parent / "data" / "sample_transactions.csv"


@st.cache_resource
def get_categorizer() -> TransactionCategorizer:
    return TransactionCategorizer()


@st.cache_data
def prepare_transactions(source: str | Path) -> pd.DataFrame:
    return get_categorizer().categorize(load_transactions(source))


def render_forecast_chart(transactions: pd.DataFrame) -> None:
    actual = monthly_expenses(transactions)
    forecast = forecast_monthly_expenses(transactions)

    figure = go.Figure()
    figure.add_trace(
        go.Scatter(x=actual.index, y=actual["actual"], name="Actual spending", mode="lines+markers")
    )
    figure.add_trace(
        go.Scatter(
            x=forecast.index,
            y=forecast["forecast"],
            name="Forecast",
            mode="lines+markers",
            line={"dash": "dash"},
        )
    )
    figure.add_trace(
        go.Scatter(
            x=list(forecast.index) + list(forecast.index[::-1]),
            y=list(forecast["upper_bound"]) + list(forecast["lower_bound"][::-1]),
            fill="toself",
            fillcolor="rgba(76, 110, 245, 0.15)",
            line={"color": "rgba(255,255,255,0)"},
            hoverinfo="skip",
            name="Forecast range",
        )
    )
    figure.update_layout(height=360, margin={"l": 10, "r": 10, "t": 20, "b": 10})
    st.plotly_chart(figure, use_container_width=True)


def main() -> None:
    st.set_page_config(page_title="Personal Finance Copilot", page_icon="💸", layout="wide")
    st.title("Personal Finance Copilot")
    st.caption("Upload transactions, understand spending, forecast expenses, and build a budget.")

    uploaded_file = st.sidebar.file_uploader("Upload a bank transaction CSV", type=["csv"])
    st.sidebar.caption("Required columns: date, description, amount")
    use_sample = st.sidebar.toggle("Use sample transactions", value=uploaded_file is None)

    source = uploaded_file if uploaded_file is not None else SAMPLE_DATA if use_sample else None
    if source is None:
        st.info("Upload a CSV or enable sample transactions to explore the dashboard.")
        return

    try:
        transactions = get_categorizer().categorize(load_transactions(source))
    except ValueError as error:
        st.error(str(error))
        return

    forecast = forecast_monthly_expenses(transactions)
    budgets = build_budget_recommendations(transactions)
    total_spending = transactions["amount"].sum()

    col1, col2, col3 = st.columns(3)
    col1.metric("Transactions analyzed", f"{len(transactions):,}")
    col2.metric("Total spending", f"${total_spending:,.2f}")
    col3.metric("Next-month forecast", f"${forecast['forecast'].iloc[0]:,.2f}")

    st.subheader("Spending by category")
    category_totals = (
        transactions.groupby("category", as_index=False)["amount"].sum().sort_values("amount")
    )
    category_chart = px.bar(
        category_totals,
        x="amount",
        y="category",
        orientation="h",
        labels={"amount": "Spending ($)", "category": "Category"},
    )
    st.plotly_chart(category_chart, use_container_width=True)

    st.subheader("Expense forecast")
    render_forecast_chart(transactions)

    st.subheader("Suggested monthly budget")
    st.dataframe(
        budgets,
        use_container_width=True,
        hide_index=True,
        column_config={
            "recent_monthly_average": st.column_config.NumberColumn(format="$%.2f"),
            "projected_next_month": st.column_config.NumberColumn(format="$%.2f"),
            "recommended_budget": st.column_config.NumberColumn(format="$%.2f"),
        },
    )

    with st.expander("Categorized transactions"):
        st.dataframe(transactions, use_container_width=True, hide_index=True)


if __name__ == "__main__":
    main()

