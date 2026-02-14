# Deployment Guide for Geo-Insight AI

## 🚀 Overview
The system consists of two main parts:
1.  **Backend (Navigation Layer):** FASTAPI server (`tools/server.py`).
2.  **Frontend (Dashboard):** React/Vite app (`src/`).

## ☁️ Cloud Deployment (Recommended)

### 1. Backend (e.g. Render/Railway)
-   **Build Command:** `pip install -r requirements.txt`
-   **Start Command:** `uvicorn tools.server:app --host 0.0.0.0 --port $PORT`
-   **Environment Variables:**
    -   `SUPABASE_URL`, `SUPABASE_KEY`
    -   `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
    -   `VAPI_API_KEY`, `SERPER_API_KEY`

### 2. Frontend (e.g. Vercel/Netlify)
-   **Build Command:** `npm run build`
-   **Output Directory:** `dist`
-   **Environment Variables:**
    -   `VITE_API_URL` (Point this to your backend URL).
    -   *Note: You need to update `src/components/*.tsx` to use `import.meta.env.VITE_API_URL` instead of `localhost:8000`.*

## 🔄 Automation (Trigger)
-   **Cron Jobs:** Use GitHub Actions or a Cron service (e.g. cron-job.org) to hit the `/prospect/start` endpoint periodically.
-   **Example Curl:**
    ```bash
    curl -X POST https://your-backend.com/prospect/start \
    -H "Content-Type: application/json" \
    -d '{"lat": 4.71, "lng": -74.07, "radius_km": 5, "keyword": "Ferreterías"}'
    ```
