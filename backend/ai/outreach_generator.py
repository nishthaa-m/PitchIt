import os
import json
import asyncio
from ai.client import OR_CLIENT, get_model

async def generate_sequence(stakeholder: dict, prospect: dict, signals: list[dict]) -> dict:
    persona_mapping = {
        "CFO": "Lead with margin, yield enhancement, revenue from float, balance sheet impact",
        "CTO": "Lead with API quality, integration time (<1 day), documentation, uptime SLA",
        "CPO": "Lead with user experience, product differentiation, time-to-market",
        "CEO": "Lead with strategic partnership, market positioning, revenue impact",
        "Compliance": "Lead with RBI licence, audit trails, regulatory compliance, FEMA alignment",
        "Champion": "Lead with user experience, product differentiation, time-to-market", # fallback
        "Economic Buyer": "Lead with margin, yield enhancement, revenue from float, balance sheet impact", # fallback
        "Technical Evaluator": "Lead with API quality, integration time (<1 day), documentation, uptime SLA", # fallback
        "Compliance Gatekeeper": "Lead with RBI licence, audit trails, regulatory compliance, FEMA alignment", # fallback
        "Unknown": "Lead with general value proposition, integration speed, and compliance"
    }
    
    # Try to map persona from recommended_persona or fallback to buyer_role mapped persona
    persona = prospect.get("recommended_persona")
    if not persona or persona not in persona_mapping:
        persona = stakeholder.get("buyer_role", "Unknown")
        
    persona_frame = persona_mapping.get(persona, persona_mapping["Unknown"])
    
    prompt = f"""
    You are a senior B2B sales writer for Blostem (https://blostem.in), backed by Zerodha's 
    Rainmatter fund. Write a 3-email drip sequence for this prospect.

    COMPANY: {prospect.get('company_name')}
    SIGNALS: {json.dumps(signals, indent=2)}
    STAKEHOLDER: {stakeholder.get('name')}, {stakeholder.get('title')} — Role: {stakeholder.get('buyer_role')}
    PERSONA FRAME: {persona_frame}
    BLOSTEM VALUE PROPS: 
      - FD APIs live in <1 day integration
      - RBI-compliant infrastructure
      - Powers 30+ platforms across India
      - Backed by Rainmatter (Zerodha), MobiKwik, AC Ventures

    EMAIL 1 (Signal hook): Reference a specific signal (funding, job post, or regulatory news).
      Subject: [Short, specific, not salesy]
      Body: 3-4 short paragraphs. Congratulate on signal. Connect signal to FD need. 
      Light ask: 15-minute call.

    EMAIL 2 (Social proof): 1-week follow-up.
      Subject: [Reference a peer company or use case]  
      Body: Lead with what similar companies did. 1-2 specific outcomes. 
      Medium ask: share relevant case study, reply with interest.

    EMAIL 3 (Soft CTA): 2-week follow-up.
      Subject: [Direct but warm]
      Body: Short. Acknowledge they're busy. Offer value (benchmark data, regulatory guide).
      Ask: calendar link or "just reply yes/no".
      
    CRITICAL: MUST contain at least 2 company-specific facts (like their specific funding round, job post name, etc).

    Return ONLY valid JSON:
    {{
      "email_1_subject": "...",
      "email_1_body": "...",
      "email_2_subject": "...",
      "email_2_body": "...",
      "email_3_subject": "...",
      "email_3_body": "..."
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
            return json.loads(result_text)
        except Exception as e:
            if "429" in str(e) and attempt < max_retries - 1:
                print(f"Rate limit hit for sequence generation, retrying in {retry_delay}s...")
                await asyncio.sleep(retry_delay)
                retry_delay *= 2
                continue
                
            print(f"Error generating sequence for {stakeholder.get('name')}: {e}")
            return {
                "email_1_subject": "Quick question regarding FD infra",
                "email_1_body": "Could not generate email due to API error. Please try again.",
                "email_2_subject": "Following up",
                "email_2_body": "Could not generate email due to API error. Please try again.",
                "email_3_subject": "Any thoughts?",
                "email_3_body": "Could not generate email due to API error. Please try again."
            }
