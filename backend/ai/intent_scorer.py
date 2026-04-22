import os
import json
from google import genai

gemini_key = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=gemini_key) if gemini_key else None

async def score_prospect(company_name: str, signals: list[dict]) -> dict:
    prompt = f"""
    You are a B2B sales intelligence AI for Blostem, a fintech infrastructure company 
    that provides Fixed Deposit (FD) APIs and banking infrastructure to fintechs and NBFCs in India.

    Analyze the following signals about {company_name} and score their likelihood of needing 
    FD infrastructure in the next 90 days.

    SIGNALS:
    {json.dumps(signals, indent=2)}

    SCORING CRITERIA:
    - Funding recency and size (40%): Recent Series A/B = strong signal, seed = mild
    - Job signal match (30%): "Head of Deposits", "Banking Products" = high; generic tech = low  
    - Regulatory trigger (20%): New NBFC licence or co-lending approval = very high
    - Company stage (10%): Growth-stage fintech with payments/lending products = good fit

    Return ONLY valid JSON (no markdown, no explanation outside JSON):
    {{
      "intent_score": <integer 0-100>,
      "urgency": "<high|medium|low>",
      "reasoning": "<2-3 specific sentences citing exact signals, funding amounts, dates>",
      "recommended_persona": "<CTO|CFO|CPO|CEO|Compliance>",
      "fit_summary": "<one line: why Blostem's FD API is relevant to this company right now>"
    }}

    Scoring guide: 80-100 = immediate opportunity (act within 2 weeks), 
    60-79 = strong interest (nurture now), 40-59 = warm (monitor), below 40 = cold.
    """
    
    try:
        # Use sonnet 4 (claude-3-5-sonnet-20240620 or requested sonnet version)
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
        print(f"Error scoring prospect {company_name}: {e}")
        # Fallback values
        return {
            "intent_score": 50,
            "urgency": "medium",
            "reasoning": "Could not analyze signals due to API error. Default medium score applied.",
            "recommended_persona": "CTO",
            "fit_summary": "Potential fit based on basic fintech profile."
        }
