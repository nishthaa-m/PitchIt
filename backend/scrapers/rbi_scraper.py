import feedparser
from google import genai
import os
import json
from datetime import datetime

gemini_key = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=gemini_key) if gemini_key else None

async def scrape_rbi():
    feed_url = "https://rbi.org.in/rss/rss.aspx"
    feed = feedparser.parse(feed_url)
    
    signals = []
    
    for entry in feed.entries[:20]: # Parse top 20 recent
        prompt = f"""
        Determine if this RBI (Reserve Bank of India) announcement is relevant to:
        - New NBFC licence grants
        - Prepaid payment instrument approvals
        - Co-lending guidelines
        - FD rate announcements
        - Digital banking licences
        
        Title: {entry.title}
        Summary: {entry.description}
        
        Return ONLY valid JSON (no markdown):
        {{
            "is_relevant": <true|false>,
            "company_name": "<specific entity mentioned, or 'Industry Wide' if general>",
            "summary": "<1 sentence summary of what this means>"
        }}
        """
        try:
            if not client:
                continue
                
            response = await client.aio.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config={"temperature": 0, "response_mime_type": "application/json"}
            )
            
            result_text = response.text.strip()
            parsed = json.loads(result_text)
            
            if parsed.get("is_relevant"):
                # Extract date from RSS format (e.g., Wed, 05 Jun 2024 16:21:00 GMT)
                try:
                    dt = datetime.strptime(entry.published, "%a, %d %b %Y %H:%M:%S %Z")
                    signal_date = dt.strftime("%Y-%m-%d")
                except:
                    signal_date = datetime.now().strftime("%Y-%m-%d")
                    
                signals.append({
                    "company_name": parsed.get("company_name", "Industry Wide"),
                    "signal_type": "regulatory",
                    "signal_date": signal_date,
                    "signal_detail": parsed.get("summary", ""),
                    "source_url": entry.link,
                    "raw_data": {"title": entry.title, "description": entry.description}
                })
        except Exception as e:
            print(f"Error parsing RBI feed with Gemini: {e}")
            
    return signals
