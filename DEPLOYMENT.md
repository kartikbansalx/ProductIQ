# ProductIQ Deployment Guide

This guide describes how to deploy the **ProductIQ** application to production hosting platforms. ProductIQ is composed of a FastAPI backend and a React/Vite frontend.

---

## 1. Environment Variables Checklist

Ensure these variables are configured on your hosting dashboards:

### Backend Environment Variables
* `GEMINI_API_KEY`: Your Google Gemini API Studio key.
* `SERPER_API_KEY`: Your serper.dev search token.
* `SUPABASE_URL`: Your Supabase project URL.
* `SUPABASE_ANON_KEY`: Your Supabase anonymous API key.
* `UPSTASH_URL`: Your Upstash Redis URL (caching).
* `UPSTASH_TOKEN`: Your Upstash Redis access token (caching).
* `REPORT_FRESHNESS_DAYS`: Optional report freshness window in days (defaults to `30`).

### Frontend Environment Variables
* `VITE_BACKEND_URL`: The URL of your deployed backend service (e.g., `https://productiq-backend.onrender.com`).

---

## 2. Supabase Database Table Configuration

Run the complete [`schema.sql`](./schema.sql) in the Supabase SQL Editor. It creates or migrates `product_reports` with a normalized unique `product_key`, `generated_at`, `expires_at`, and `updated_at` fields. Existing records are backfilled with a 30-day expiry. The migration keeps the newest record if legacy product names differ only by case or whitespace.

The backend reuses reports only while they are fresh. Redis entries have a 24-hour TTL; Supabase is the persistent store and the default freshness window is 30 days. Set `REPORT_FRESHNESS_DAYS` to change that window.

---

## 3. Backend Deployment (Render.com)

Render is recommended for hosting Python web services for free.

1. **Sign Up / Log In**: Create an account on [Render.com](https://render.com).
2. **Create Web Service**: Click **New +** > **Web Service**.
3. **Connect Repository**: Connect your GitHub/GitLab repository.
4. **Configure Settings**:
   * **Name**: `productiq-backend` (or any unique name).
   * **Root Directory**: `backend`
   * **Language**: `Python` (or `Docker` if you choose to deploy using the provided `Dockerfile`).
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 8000`
5. **Add Environment Variables**: Go to **Environment** tab, click **Add Environment Variable**, and fill in the keys/values listed in section 1.
6. **Deploy**: Click **Create Web Service**. Render will automatically build and deploy the backend. Copy the generated service URL (e.g., `https://productiq-backend.onrender.com`).

---

## 4. Frontend Deployment (Vercel)

Vercel is the recommended host for React/Vite applications.

1. **Sign Up / Log In**: Create an account on [Vercel](https://vercel.com).
2. **Import Project**: Click **Add New** > **Project** and link your GitHub repository.
3. **Configure Build Settings**:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `frontend`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. **Configure Environment Variables**:
   * Add a variable named `VITE_BACKEND_URL`.
   * Set its value to the URL of your deployed backend (e.g., `https://productiq-backend.onrender.com`).
5. **Deploy**: Click **Deploy**. Vercel will build and serve your app static files globally on a CDN.

---

## 5. Local Production Build Testing (Optional)

To build and run the production environment locally:

```bash
# 1. Compile frontend build assets
cd frontend
npm run build

# 2. Start Vite production preview server
npm run preview
```

## 6. Backend tests and report-generation benchmark

From the `backend` directory:

```bash
pip install -r requirements-dev.txt
pytest -q
```

Start the backend, then measure end-to-end request latency and the backend's recorded original report-generation time:

```bash
python benchmark_report.py "wireless earbuds" --base-url http://127.0.0.1:8000 --runs 3
```

The API response includes `generation_time_ms` and `generation_stages_ms` (`data_collection`, `gemini_and_validation`, and `persistence_and_cache`). On a cache hit, the saved report retains the original generation duration; the benchmark separately reports current request latency. Google Trends provenance is exposed as `trends_source` (`google_trends` or `simulated`) and `trends_fetched_at`.

### Pricing calculation notes

The backend now recalculates customs amount, import GST amount, landed cost, net profit, gross margin, ROI, and units required to recover the assumed INR 500,000 target in Python. Customs/GST percentages are taken from the matched local legal reference record. Import cost, shipping, clearance, and suggested MSRP remain estimates/assumptions supplied by the AI and/or fallback logic; deterministic arithmetic does not make those input estimates verified market quotes. The INR 500,000 units metric is `ceil(500000 / positive net_profit_per_unit)` and should be described as units required to recover that target from per-unit contribution, not as a complete accounting break-even analysis with all fixed and variable costs.
