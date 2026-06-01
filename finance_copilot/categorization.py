"""Hybrid transaction categorization using rules and a text classifier."""

from __future__ import annotations

from dataclasses import dataclass

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline


TRAINING_EXAMPLES = {
    "Housing": ["monthly rent", "apartment lease", "property management", "mortgage payment"],
    "Groceries": ["whole foods market", "trader joes", "kroger grocery", "costco groceries"],
    "Dining": ["chipotle", "starbucks coffee", "local cafe", "doordash restaurant"],
    "Transportation": ["uber trip", "lyft ride", "shell gas", "metro transit", "parking garage"],
    "Utilities": ["electric bill", "water utility", "internet service", "mobile phone bill"],
    "Entertainment": ["netflix", "spotify", "movie theater", "concert tickets", "steam games"],
    "Shopping": ["amazon marketplace", "target store", "clothing shop", "best buy"],
    "Health": ["pharmacy", "doctor copay", "gym membership", "dental clinic"],
    "Travel": ["airline ticket", "hotel booking", "airbnb", "rental car"],
    "Education": ["online course", "textbook", "tuition payment", "udemy"],
}

KEYWORDS = {
    "Housing": ("rent", "lease", "mortgage", "property"),
    "Groceries": ("grocery", "groceries", "whole foods", "trader joe", "kroger", "costco"),
    "Dining": ("restaurant", "cafe", "coffee", "starbucks", "chipotle", "doordash"),
    "Transportation": ("uber", "lyft", "gas", "shell", "metro", "parking", "transit"),
    "Utilities": ("electric", "water", "utility", "internet", "phone", "verizon", "comcast"),
    "Entertainment": ("netflix", "spotify", "movie", "concert", "steam"),
    "Shopping": ("amazon", "target", "clothing", "best buy"),
    "Health": ("pharmacy", "doctor", "dental", "gym", "cvs", "walgreens"),
    "Travel": ("airline", "hotel", "airbnb", "rental car", "flight"),
    "Education": ("course", "textbook", "tuition", "udemy", "coursera"),
}


@dataclass(frozen=True)
class CategoryPrediction:
    """Categorization result with an interpretable confidence score."""

    category: str
    confidence: float
    method: str


class TransactionCategorizer:
    """Categorize merchant descriptions with deterministic rules and ML fallback."""

    def __init__(self) -> None:
        descriptions = []
        categories = []
        for category, examples in TRAINING_EXAMPLES.items():
            descriptions.extend(examples)
            categories.extend([category] * len(examples))

        self.pipeline = Pipeline(
            [
                ("tfidf", TfidfVectorizer(ngram_range=(1, 2), lowercase=True)),
                ("classifier", LogisticRegression(max_iter=500, random_state=42)),
            ]
        )
        self.pipeline.fit(descriptions, categories)

    def predict(self, description: str) -> CategoryPrediction:
        """Return a category prediction for a single transaction description."""
        normalized = description.strip().lower()
        for category, keywords in KEYWORDS.items():
            if any(keyword in normalized for keyword in keywords):
                return CategoryPrediction(category=category, confidence=0.99, method="rule")

        probabilities = self.pipeline.predict_proba([normalized])[0]
        best_index = int(probabilities.argmax())
        confidence = float(probabilities[best_index])
        category = str(self.pipeline.classes_[best_index])
        if confidence < 0.2:
            return CategoryPrediction(category="Other", confidence=confidence, method="fallback")
        return CategoryPrediction(category=category, confidence=confidence, method="ml")

    def categorize(self, transactions: pd.DataFrame) -> pd.DataFrame:
        """Add category metadata to a normalized transaction DataFrame."""
        categorized = transactions.copy()
        predictions = categorized["description"].map(self.predict)
        categorized["category"] = predictions.map(lambda prediction: prediction.category)
        categorized["category_confidence"] = predictions.map(
            lambda prediction: round(prediction.confidence, 3)
        )
        categorized["category_method"] = predictions.map(lambda prediction: prediction.method)
        return categorized

