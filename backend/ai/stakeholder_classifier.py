import os
import json
from google import genai

gemini_key = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=gemini_key) if gemini_key else None

async def classify_stakeholders(company_name: str, people: list[dict]) -> list[dict]:
    results = []
    
    for person in people:
        prompt = f"""
        For the company "{company_name}" which is evaluating FD/banking infrastructure APIs,
        classify this person's role in the buying decision:

        Person: {person.get('name')}, Title: {person.get('title')}

        Buyer roles:
        - Champion: Likely to advocate internally (Head of Product, VP Engineering, Product Manager)
        - Economic Buyer: Controls budget and final approval (CFO, CEO, Finance Director)  
        - Technical Evaluator: Evaluates API quality and integration (CTO, Lead Engineer, Architect)
        - Compliance Gatekeeper: Reviews regulatory fit (Compliance Officer, Legal, Risk Manager)
        - Unknown: Cannot determine from title alone

        Return ONLY valid JSON:
        {{
          "buyer_role": "<Champion|Economic Buyer|Technical Evaluator|Compliance Gatekeeper|Unknown>",
          "outreach_priority": <integer 1-10, 10 = highest priority>,
          "rationale": "<one sentence>"
        }}
        """
        
        try:
            if not client: raise Exception("No API key")
            response = await client.aio.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt,
                config={"temperature": 0, "response_mime_type": "application/json"}
            )
            
            result_text = response.text.strip()
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
        except Exception as e:
            print(f"Error classifying stakeholder {person.get('name')}: {e}")
            results.append({
                "name": person.get("name"),
                "title": person.get("title"),
                "linkedin_url": person.get("linkedin_url"),
                "buyer_role": "Unknown",
                "outreach_priority": 5,
                "rationale": "API Error, fallback classification."
            })
            
    return results
