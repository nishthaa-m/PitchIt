import os
import httpx
from datetime import datetime

SERP_API_KEY = os.environ.get("SERP_API_KEY")

async def scrape_jobs():
    if not SERP_API_KEY:
        print("No SERP_API_KEY provided, skipping jobs scrape.")
        return []

    queries = [
        "Head of Deposits India fintech",
        "Banking Products Lead India",
        "FD infrastructure engineer India",
        "Fixed Deposit API India"
    ]
    
    signals = []
    
    async with httpx.AsyncClient() as client:
        for query in queries:
            url = f"https://serpapi.com/search.json?engine=google_jobs&q={query}&hl=en&gl=in&api_key={SERP_API_KEY}"
            try:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                
                jobs = data.get("jobs_results", [])
                for job in jobs[:5]: # Top 5 per query
                    company = job.get("company_name")
                    title = job.get("title")
                    link = job.get("related_links", [{}])[0].get("link", "")
                    
                    if company and title:
                        signals.append({
                            "company_name": company,
                            "signal_type": "job_post",
                            "signal_date": datetime.now().strftime("%Y-%m-%d"), # Jobs API doesn't always have exact standard date
                            "signal_detail": f"{title} role posted — signals product expansion into deposits",
                            "source_url": link,
                            "raw_data": job
                        })
            except Exception as e:
                print(f"Error fetching jobs from SerpAPI for query '{query}': {e}")
                
    return signals
