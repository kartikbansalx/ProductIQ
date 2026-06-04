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

### Frontend Environment Variables
* `VITE_BACKEND_URL`: The URL of your deployed backend service (e.g., `https://productiq-backend.onrender.com`).

---

## 2. Supabase Database Table Configuration

Execute the following SQL command in your Supabase SQL Editor to set up the report storage table:

```sql
CREATE TABLE IF NOT EXISTS product_reports (
    id SERIAL PRIMARY KEY,
    product_name TEXT UNIQUE NOT NULL,
    report_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

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
