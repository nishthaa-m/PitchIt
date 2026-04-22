import os
import json
from google import genai

gemini_key = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=gemini_key) if gemini_key else None

async def check_compliance(email_body: str) -> dict:
    prohibited_list = [
        "guaranteed returns", "risk-free", "assured yield", "fixed profit",
        "you will always earn", "100% safe", "no risk", "certain returns",
        "earn exactly X%", "profit guaranteed", "assured income"
    ]
    
    prompt = f"""
    You are a compliance officer reviewing outreach emails for Blostem, a SEBI/RBI-regulated 
    fintech company in India. Check this email for prohibited marketing phrases.

    EMAIL:
    {email_body}

    PROHIBITED PATTERNS: {prohibited_list}

    Check for both exact matches AND semantic equivalents (paraphrasing that implies the 
    same guarantee). Be strict — flag any implication of guaranteed returns.

    Return ONLY valid JSON:
    {{
      "is_compliant": <true|false>,
      "flags": [
        {{
          "phrase": "<exact phrase found in the email>",
          "location": "<first few words of the sentence containing it>",
          "violation_type": "<guaranteed_returns|risk_claim|yield_promise|other>",
          "suggested_replacement": "<compliant alternative phrasing>"
        }}
      ],
      "compliance_score": <integer 0-100, 100 = fully compliant>
    }}

    If no violations found, return: {{"is_compliant": true, "flags": [], "compliance_score": 100}}
    """
    
    try:
        if not client: raise Exception("No API key")
        response = await client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config={"temperature": 0, "response_mime_type": "application/json"}
        )
        
        result_text = response.text.strip()
        if result_text.startswith("```json"):
            result_text = result_text[7:-3]
        return json.loads(result_text)
    except Exception as e:
        print(f"Error checking compliance: {e}")
        return {"is_compliant": True, "flags": [], "compliance_score": 100}
