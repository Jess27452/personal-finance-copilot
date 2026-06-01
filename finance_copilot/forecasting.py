"""Monthly expense forecasting with Holt linear trend smoothing."""

from __future__ import annotations

from dataclasses import dataclass

import pandas as pd


@dataclass(frozen=True)
class HoltState:
    """Final state for Holt linear trend exponential smoothing."""

    level: float
    trend: float


def _holt_forecast(
    values: list[float], periods: int, alpha: float = 0.6, beta: float = 0.25
) -> list[float]:
    if not values:
        return [0.0] * periods
    if len(values) == 1:
        return [max(values[0], 0.0)] * periods

    state = HoltState(level=values[0], trend=values[1] - values[0])
    for value in values[1:]:
        previous_level = state.level
        level = alpha * value + (1 - alpha) * (state.level + state.trend)
        trend = beta * (level - previous_level) + (1 - beta) * state.trend
        state = HoltState(level=level, trend=trend)

    return [max(state.level + step * state.trend, 0.0) for step in range(1, periods + 1)]


def monthly_expenses(transactions: pd.DataFrame) -> pd.DataFrame:
    """Aggregate transactions into calendar-month expense totals."""
    monthly = (
        transactions.set_index("date")["amount"]
        .resample("MS")
        .sum()
        .rename("actual")
        .to_frame()
    )
    return monthly


def forecast_monthly_expenses(transactions: pd.DataFrame, periods: int = 3) -> pd.DataFrame:
    """Forecast future monthly spending using Holt linear trend smoothing."""
    if periods < 1:
        raise ValueError("Forecast periods must be at least 1.")

    history = monthly_expenses(transactions)
    values = history["actual"].astype(float).tolist()
    forecasts = _holt_forecast(values, periods)
    future_months = pd.date_range(
        history.index.max() + pd.offsets.MonthBegin(1),
        periods=periods,
        freq="MS",
    )
    forecast = pd.DataFrame({"forecast": forecasts}, index=future_months)

    residual_scale = max(history["actual"].std(ddof=0) if len(history) > 1 else 0.0, 1.0)
    forecast["lower_bound"] = (forecast["forecast"] - residual_scale).clip(lower=0)
    forecast["upper_bound"] = forecast["forecast"] + residual_scale
    return forecast.round(2)

