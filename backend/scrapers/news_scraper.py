import os
import httpx
import json
from google import genai
from datetime import datetime, timedelta

NEWS_API_KEY = os.environ.get("NEWS_API_KEY")
gemini_key = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=gemini_key) if gemini_key else None

async def scrape_news():
    if not NEWS_API_KEY:
        print("No NEWS_API_KEY provided, skipping news scrape.")
        return []

    # Get last 90 days
    date_from = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
    query = '"fintech India funding" OR "NBFC India Series" OR "payments India raised"'
    
    url = f"https://newsapi.org/v2/everything?q={query}&from={date_from}&language=en&sortBy=publishedAt&apiKey={NEWS_API_KEY}"
    
    async with httpx.AsyncClient() as http_client:
        try:
            response = await http_client.get(url)
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            print(f"Error fetching NewsAPI: {e}")
            return []

    articles = data.get("articles", [])
    signals = []

    for article in articles:
        # Use Claude to extract primary company name, funding amount, round, investors
        prompt = f"""
        Extract the primary company name and funding details from this news article.
        Title: {article.get('title')}
        Description: {article.get('description')}
        
        Return ONLY valid JSON (no markdown):
        {{
            "company_name": "<primary company mentioned>",
            "amount": "<funding amount>",
            "round": "<funding round>",
            "investors": ["<investor1>", "<investor2>"]
        }}
        If this doesn't look like a funding announcement for a specific company, return {{}}.
        """
        try:
            if not client:
                print("No GEMINI_API_KEY provided.")
                continue
                
            response = await client.aio.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config={"temperature": 0, "response_mime_type": "application/json"}
            )
            # Parse JSON
            result_text = response.text.strip()
            parsed = json.loads(result_text)
            
            if parsed and parsed.get("company_name"):
                detail = f"Raised {parsed.get('amount', 'undisclosed amount')} in {parsed.get('round', 'funding round')}."
                if parsed.get('investors'):
                    detail += f" Backed by {', '.join(parsed.get('investors'))}."
                
                signals.append({
                    "company_name": parsed["company_name"],
                    "signal_type": "funding",
                    "signal_date": article.get("publishedAt", "").split("T")[0],
                    "signal_detail": detail,
                    "source_url": article.get("url"),
                    "raw_data": article
                })
        except Exception as e:
            print(f"Error parsing news article with Gemini: {e}")

    return signals
