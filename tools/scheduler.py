import schedule
import time
import tools.leads_enrichment as enrichment

def job():
    print("[INFO] Running scheduled prospecting job...")
    # Example: Run grid search for a fixed target
    # In production, fetch active campaigns from DB
    results = enrichment.hunter.grid_search(4.71, -74.07, 5, "Ferreterías")
    print(f"[INFO] Job finished. Found {len(results)} leads.")

# Schedule job every 24 hours
schedule.every(24).hours.do(job)
# schedule.every(10).seconds.do(job) # For testing

if __name__ == "__main__":
    print("[INFO] Scheduler started. Press Ctrl+C to exit.")
    while True:
        schedule.run_pending()
        time.sleep(1)
