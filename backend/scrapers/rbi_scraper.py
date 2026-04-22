import feedparser
import os
import json
import asyncio
from datetime import datetime
from ai.client import OR_CLIENT, get_model

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
            "relevance_score": <0-100>,
            "company_name": "<specific entity mentioned, or 'Industry Wide' if general>",
            "summary": "<1 sentence summary of what this means>"
        }}
        """
        try:
            if not OR_CLIENT: raise Exception("No OpenRouter API key")
            response = await OR_CLIENT.chat.completions.create(
                model=get_model(),
                messages=[{"role": "user", "content": prompt}],
                temperature=0
            )
            
            result_text = response.choices[0].message.content.strip()
            if result_text.startswith("```json"):
                result_text = result_text[7:-3]
            parsed = json.loads(result_text)
            
            if parsed and parsed.get("relevance_score", 0) > 60:
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
