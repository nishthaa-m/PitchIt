import os
import json
import asyncio
from ai.client import OR_CLIENT, get_model

async def classify_stakeholders(company_name: str, profiles: list[dict]) -> list[dict]:
    results = []
    
    for person in profiles:
        prompt = f"""
        You are a B2B sales strategist. Classify this stakeholder for the company {company_name}.
        
        STAKEHOLDER: {person.get('name')}, {person.get('title')}
        
        Classify them into one of these buyer personas:
        - CFO (Economic Buyer)
        - CTO (Technical Evaluator)
        - CPO (Product Champion)
        - CEO (Strategic Buyer)
        - Compliance (Gatekeeper)
        - Champion (Internal Influencer)
        
        Also assign an outreach priority (1-10, where 10 is most critical to contact first).
        
        Return ONLY valid JSON:
        {{
          "buyer_role": "<Persona>",
          "outreach_priority": <integer>,
          "rationale": "<1 short sentence explanation>"
        }}
        """
        
        max_retries = 5
        retry_delay = 10
        
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
                parsed = json.loads(result_text)
                
                results.append({
                    "name": person.get("name"),
                    "title": person.get("title"),
                    "linkedin_url": person.get("linkedin_url"),
                    "buyer_role": parsed.get("buyer_role", "Unknown"),
                    "outreach_priority": parsed.get("outreach_priority", 5),
                    "rationale": parsed.get("rationale", "")
                })
                break # Success!
            except Exception as e:
                if "429" in str(e) and attempt < max_retries - 1:
                    print(f"Rate limit hit for stakeholder {person.get('name')}, retrying in {retry_delay}s...")
                    await asyncio.sleep(retry_delay)
                    retry_delay *= 2
                    continue
                    
                print(f"Error classifying stakeholder {person.get('name')}: {e}")
                results.append({
                    "name": person.get("name"),
                    "title": person.get("title"),
                    "linkedin_url": person.get("linkedin_url"),
                    "buyer_role": "Unknown",
                    "outreach_priority": 5,
                    "rationale": "API Error, fallback classification."
                })
                break
            
    return results
