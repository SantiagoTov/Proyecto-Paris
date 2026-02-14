# SOP: Data Enrichment & Prospecting

## 🎯 Objective
Locate business leads geographically and enrich their profile with contact info and "buying signals" before the call.

## 🛠️ Tools
- **Grid Search:** Serper.dev / Outscraper.
- **Enrichment:** Firecrawl (Crawl & Scrape).
- **Analysis:** Gemini 1.5 Flash (Cost-effective batch processing).

## 🔄 Flow
1.  **Grid Trigger:** User defines `lat`, `lng`, `radius`.
2.  **Search:** System divides area into micro-sectors and queries Google Maps for specific keywords (e.g., "Ferretería").
3.  **Filter:** Exclude results without phone numbers or websites (unless "Walk-in" strategy).
4.  **Visit (Firecrawl):** For each result with a website:
    - Scrape Homepage + About Us + Contact.
    - Extract: Emails, Founder Names, Technology Stack.
5.  **Score (Gemini):** Analyze scraped text.
    - *Is this business valid?* (Yes/No)
    - *Buying Signal Strength:* (1-10) based on "Pains" defined in `gemini.md`.

## 💾 Output
JSON Object stored in Supabase `leads` table.
