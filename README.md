# ProductIQ

**AI-powered market intelligence for Indian importers and e-commerce sellers.**

🔗 **Live app:** [product-iq-analyzer.vercel.app](https://product-iq-analyzer.vercel.app/)

ProductIQ takes a product name and returns a full market intelligence report — pricing and margin analysis, demand signals, legal/import compliance (BIS, HSN, GST, customs), competitor landscape, and a clear BUY / CAUTION / SKIP verdict — so sellers can decide what to import and sell before spending a rupee on stock.

---

## What it does

Give it a product name, and ProductIQ returns a structured report containing:

- **IQ Score & Verdict** — a BUY / CAUTION / SKIP call with a rationale
- **Market Performance** — category, market size, average rating, review volume, demand level, entry difficulty
- **Pricing & Margins** — min/max/avg price, import price estimate, customs duty, GST, shipping, clearance fees, landed cost, suggested MSRP, gross margin %, net profit estimate, ROI %, and breakeven units
- **Legal & Compliance** — BIS certification status, HSN code, GST %, DGFT import status, and a checklist of mandatory/conditional/not-required items
- **Competitive Landscape** — platform-wise listings (price range, avg price, estimated units listed), brand market share, and a list of top products with price/rating/reviews
- **Product Variants & Features** — common variants and feature list for the product
- **Demand Trends** — Google Trends interest-over-time data
- **Seasonality** — a seasonality label plus advice
- **SWOT Analysis** — strengths, weaknesses, opportunities, threats
- **Strategy Advice** — a short text recommendation

Reports are cached in Redis and persisted to Supabase, so repeat lookups for the same product are fast, and a history of the last 20 analyzed products is available via the API.

---

## Screenshots & Demo

<!--
Add screenshots or a demo video/GIF here. For example:

![Search / Landing Page](./docs/screenshots/search-landing.png)
![Market Report Overview](./docs/screenshots/market-report-overview.png)
![Pricing & Margins](./docs/screenshots/pricing-margins.png)
![Report Generation Progress](./docs/screenshots/report-generation.png)

For a demo video, either embed a GIF directly:
![Demo](./docs/demo.gif)

or link to a hosted video (YouTube, Loom, etc.):
[![Watch the demo](./docs/screenshots/thumbnail.png)](https://your-video-link)
-->
[![Watch the demo](./docs/DEMO VIDEO/Screenshot 2026-07-24 174202.png)](https://drive.google.com/file/d/14r89F1socSBz19faL6eSfEb-6ckjQy5-/view?usp=sharing)



---

## Tech Stack

**Frontend**
- React 19 + Vite
- Tailwind CSS 4
- Recharts (data visualization)
- jsPDF (export reports as PDF)
- Axios

**Backend**
- FastAPI (Python)
- Google Gemini (`google-generativeai`) — structured report generation
- Serper.dev — real-time search/market data
- pytrends — Google Trends demand signals
- Supabase — persistent report storage
- Upstash Redis — response caching

This is a deliberately zero/low-cost stack, built to run entirely on free tiers.

---

## Project Structure

```
ProductIQ/
├── backend/
│   ├── main.py            # FastAPI app: endpoints, Gemini prompting, data aggregation
│   ├── legal_data.json    # Static BIS/HSN/GST/DGFT lookup database
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
├── ProductIQ UI/          # Design references / UI screens
├── schema.sql             # Supabase table definitions
└── DEPLOYMENT.md          # Full deployment guide (Render + Vercel)
```

---

## API Endpoints

| Method | Endpoint       | Description                                             |
|--------|----------------|-----------------------------------------------------------|
| GET    | `/api/ping`    | Health check                                               |
| POST   | `/api/analyze` | Analyze a product and return a full `MarketReport`         |
| GET    | `/api/history` | Fetch the last 20 previously analyzed products             |

`/api/analyze` follows a cache-first strategy: **Redis → Supabase → fresh generation** (Serper + Trends + Gemini, run concurrently), falling back to a mock report generator if Gemini fails.

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- API keys: Google Gemini, Serper.dev, Supabase, Upstash Redis

### 1. Clone the repo
```bash
git clone https://github.com/kartikbansalx/ProductIQ.git
cd ProductIQ
```

### 2. Backend setup
```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the project root with:
```env
GEMINI_API_KEY=your_gemini_key
SERPER_API_KEY=your_serper_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
UPSTASH_URL=your_upstash_url
UPSTASH_TOKEN=your_upstash_token
```

Set up the database by running `schema.sql` in the Supabase SQL Editor, then start the API:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend setup
```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:
```env
VITE_BACKEND_URL=http://localhost:8000
```

Then run:
```bash
npm run dev
```

---

## Deployment

ProductIQ is designed to deploy for free, and is currently live at [product-iq-analyzer.vercel.app](https://product-iq-analyzer.vercel.app/):
- **Backend** → [Render](https://render.com) (Python web service or Docker)
- **Frontend** → [Vercel](https://vercel.com) (Vite static build)

Full step-by-step instructions, including environment variable setup and Supabase table creation, are in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

---

## License

This project currently has no explicit license. Contact the repository owner before reuse or distribution.
