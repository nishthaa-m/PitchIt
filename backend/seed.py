import asyncio
import os
from datetime import datetime, timedelta
from db.supabase_client import get_supabase

async def seed_data():
    supabase = get_supabase()
    if not supabase:
        print("Cannot seed data: Supabase credentials not found.")
        return

    print("Seeding database with mock data...")

    # Clear existing
    print("Clearing existing data...")
    supabase.table("prospects").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    supabase.table("signals").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()

    companies = [
        {"name": "Jupiter Money", "score": 87, "urgency": "high", "persona": "CTO"},
        {"name": "Fi Money", "score": 75, "urgency": "high", "persona": "Compliance"},
        {"name": "Slice", "score": 92, "urgency": "high", "persona": "CEO"},
        {"name": "Freo", "score": 64, "urgency": "medium", "persona": "CPO"},
        {"name": "Niyo", "score": 81, "urgency": "high", "persona": "CFO"},
        {"name": "Open Financial", "score": 77, "urgency": "high", "persona": "CTO"},
        {"name": "Razorpay", "score": 58, "urgency": "medium", "persona": "CPO"},
        {"name": "KreditBee", "score": 69, "urgency": "medium", "persona": "Compliance"},
        {"name": "Stashfin", "score": 88, "urgency": "high", "persona": "CEO"},
        {"name": "LazyPay", "score": 62, "urgency": "medium", "persona": "CTO"},
        {"name": "Cred", "score": 95, "urgency": "high", "persona": "CEO"},
        {"name": "BharatPe", "score": 71, "urgency": "high", "persona": "CFO"},
        {"name": "Groww", "score": 83, "urgency": "high", "persona": "CPO"},
        {"name": "MobiKwik", "score": 66, "urgency": "medium", "persona": "Compliance"},
        {"name": "Navi", "score": 90, "urgency": "high", "persona": "CEO"}
    ]

    for c in companies:
        name = c["name"]
        
        # 1. Insert Prospect
        prospect = {
            "company_name": name,
            "intent_score": c["score"],
            "urgency": c["urgency"],
            "reasoning": f"Strong signals observed. Raised funding recently and hiring for deposit products. Fits Blostem's ideal customer profile perfectly.",
            "recommended_persona": c["persona"],
            "signal_count": 2
        }
        res = supabase.table("prospects").upsert(prospect, on_conflict="company_name").execute()
        if not res.data:
            res = supabase.table("prospects").select("*").eq("company_name", name).execute()
        p_id = res.data[0]["id"]

        # 2. Insert Signals
        signals = [
            {
                "company_name": name,
                "signal_type": "funding",
                "signal_date": (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d"),
                "signal_detail": "Raised ₹280Cr Series C on March 12.",
                "source_url": "https://newsapi.example.com"
            },
            {
                "company_name": name,
                "signal_type": "job_post",
                "signal_date": (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"),
                "signal_detail": "Posted Head of Deposits role 3 weeks later. Strong signal of deposits product launch.",
                "source_url": "https://linkedin.com/jobs"
            }
        ]
        for sig in signals:
            supabase.table("signals").upsert(sig, on_conflict="company_name,signal_type,signal_date").execute()

        # 3. Insert Stakeholders
        stakeholder1 = {
            "prospect_id": p_id,
            "name": f"Rahul {name.split()[0]}",
            "title": "Chief Technology Officer",
            "linkedin_url": "https://linkedin.com/in/demo",
            "buyer_role": "Technical Evaluator",
            "outreach_priority": 9
        }
        st_res = supabase.table("stakeholders").insert(stakeholder1).execute()
        st_id = st_res.data[0]["id"]

        # 4. Insert Sequence (Mandatory Compliance Flag for Demo on Jupiter Money)
        is_flagged = name == "Jupiter Money"
        
        body1 = f"Hi Rahul,\n\nSaw that {name} just raised Series C. Congrats! With the new focus on deposits, you should check out Blostem's FD APIs. We offer guaranteed returns of 8% for your users.\n\nLet's chat." if is_flagged else f"Hi Rahul,\n\nSaw that {name} just raised Series C. Congrats! With the new focus on deposits, Blostem's FD APIs can get you live in <1 day.\n\nLet's chat."
        
        seq = {
            "stakeholder_id": st_id,
            "persona": c["persona"],
            "email_1_subject": f"Quick question about {name}'s deposits infra",
            "email_1_body": body1,
            "email_2_subject": "Following up",
            "email_2_body": "Similar companies like Fi Money use our compliant infra.",
            "email_3_subject": "Any thoughts?",
            "email_3_body": "Just checking if this is on your roadmap.",
            "compliance_status": "flagged" if is_flagged else "approved",
            "compliance_flags": [{"phrase": "guaranteed returns of 8%", "location": "We offer...", "violation_type": "guaranteed_returns", "suggested_replacement": "attractive yields within RBI guidelines"}] if is_flagged else []
        }
        supabase.table("sequences").insert(seq).execute()

    print("Seed data inserted successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
