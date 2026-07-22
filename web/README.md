# Ledgerly Web

Ledgerly is the production web application for Personal Finance Copilot. It turns bank transaction CSV files into a private, persistent spending dashboard with merchant categorization, monthly forecasting, and behavior-based budget recommendations.

## Architecture

- Next.js-compatible React application on Vinext
- Cloudflare Worker API routes
- Cloudflare D1 relational persistence
- Sign in with ChatGPT for identity and record ownership
- Server-side CSV normalization and validation
- Rule-based, confidence-scored merchant categorization
- Holt linear-trend expense forecasts
- Responsive, accessible dashboard UI

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run build
npm test
```

The root route includes sample data so the product is useful before sign-in. Signed-in users receive an isolated workspace backed by D1 and can import their own CSV history.
