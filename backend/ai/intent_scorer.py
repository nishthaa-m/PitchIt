import os
import json
import asyncio
from ai.client import OR_CLIENT, get_model

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
      "recommended_persona": "<STRICTLY one of: CTO, CFO, CPO, CEO, Compliance>",
      "fit_summary": "<one line: why Blostem's FD API is relevant to this company right now>"
    }}
    
    IMPORTANT: The "recommended_persona" field MUST be EXACTLY one of: CTO, CFO, CPO, CEO, Compliance. Do NOT add descriptions or slashes.

    Scoring guide: 80-100 = immediate opportunity (act within 2 weeks), 
    60-79 = strong interest (nurture now), 40-59 = warm (monitor), below 40 = cold.
    """
    
    max_retries = 5
    retry_delay = 10 # initial delay in seconds
    
    for attempt in range(max_retries):
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
            return json.loads(result_text)
        except Exception as e:
            if "429" in str(e) and attempt < max_retries - 1:
                print(f"Rate limit hit for {company_name}, retrying in {retry_delay}s...")
                await asyncio.sleep(retry_delay)
                retry_delay *= 2 # exponential backoff
                continue
            
            print(f"Error scoring prospect {company_name}: {e}")
            # Fallback values
            return {
                "intent_score": 50,
                "urgency": "medium",
                "reasoning": "Could not analyze signals due to API error. Default medium score applied.",
                "recommended_persona": "CTO",
                "fit_summary": "Potential fit based on basic fintech profile."
            }
