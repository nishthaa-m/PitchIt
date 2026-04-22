import asyncio
import sys

# CRITICAL: Fix for Playwright on Windows - MUST be at the absolute top
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

import os
import json
from datetime import datetime

from fastapi import FastAPI, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from contextlib import asynccontextmanager
from typing import Optional

from db.supabase_client import get_supabase
from scrapers.news_scraper import scrape_news
from scrapers.rbi_scraper import scrape_rbi
from scrapers.jobs_scraper import scrape_jobs
from scrapers.linkedin_scraper import scrape_linkedin
from ai.intent_scorer import score_prospect
from ai.stakeholder_classifier import classify_stakeholders
from ai.outreach_generator import generate_sequence
from ai.compliance_checker import check_compliance

# Setup AP Scheduler
scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    interval_hours = int(os.environ.get("PIPELINE_INTERVAL_HOURS", 6))
    scheduler.add_job(run_full_pipeline, 'interval', hours=interval_hours)
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(title="PitchIt Backend API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def run_full_pipeline(target_company: str = None):
    supabase = get_supabase()
    if not supabase:
        print("Supabase not configured.")
        return

    # 1. Ingest Signals
    print(f"Starting pipeline for {'all companies' if not target_company else target_company}")
    signals = []
    if not target_company:
        news_sig = await scrape_news()
        rbi_sig = await scrape_rbi()
        jobs_sig = await scrape_jobs()
        signals = news_sig + rbi_sig + jobs_sig
        
        # Save signals
        for sig in signals:
            try:
                supabase.table("signals").upsert(sig, on_conflict="company_name,signal_type,signal_date").execute()
            except Exception as e:
                print(f"Error saving signal for {sig.get('company_name')}: {e}")
    else:
        # Fetch existing signals for this company to re-score
        try:
            res = supabase.table("signals").select("*").eq("company_name", target_company).execute()
            signals = res.data
        except Exception as e:
            print(f"Error fetching signals for {target_company}: {e}")
            signals = []
            
    # Group signals by company
    companies = {}
    for sig in signals:
        comp = sig.get("company_name")
        if comp and comp != "Industry Wide":
            if comp not in companies:
                companies[comp] = []
            companies[comp].append(sig)
            
    if target_company and target_company in companies:
        companies = {target_company: companies[target_company]}
    elif target_company and not companies:
        companies = {target_company: []}
        
    for company_name, comp_signals in companies.items():
        # DEMO FALLBACK: If no signals found, add a placeholder signal so the AI can still score the prospect
        if not comp_signals:
            comp_signals = [{
                "company_name": company_name,
                "signal_type": "market_fit",
                "signal_date": datetime.now().strftime('%Y-%m-%d'),
                "signal_detail": "Identified as a high-potential fintech platform in the Indian ecosystem.",
                "source_url": "#"
            }]
        
        print(f"Processing {company_name} with {len(comp_signals)} signals...")
        
        # 2. Score Prospect
        score_res = await score_prospect(company_name, comp_signals)
        score_res["company_name"] = company_name
        score_res["signal_count"] = len(comp_signals)
        
        # Fix possible missing 'recommended_persona' or 'fit_summary' to match DB schema strictly
        db_prospect = {
            "company_name": company_name,
            "intent_score": score_res.get("intent_score", 50),
            "urgency": score_res.get("urgency", "medium"),
            "reasoning": score_res.get("reasoning", ""),
            "recommended_persona": score_res.get("recommended_persona", "CTO"),
            "signal_count": score_res.get("signal_count", 0),
            "scored_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        try:
            p_res = supabase.table("prospects").upsert(db_prospect, on_conflict="company_name").execute()
            if not p_res.data:
                # Need to fetch the prospect ID if upsert didn't return it
                p_res = supabase.table("prospects").select("*").eq("company_name", company_name).execute()
            prospect_id = p_res.data[0]["id"]
        except Exception as e:
            print(f"Error saving prospect {company_name}: {e}")
            continue
            
        # 3. Scrape LinkedIn & Stakeholders (only if intent_score >= 60)
        if db_prospect["intent_score"] >= 60:
            profiles = await scrape_linkedin(company_name)
            classified = await classify_stakeholders(company_name, profiles)
            
            top_stakeholders = []
            for st in classified:
                st_db = {
                    "prospect_id": prospect_id,
                    "name": st.get("name"),
                    "title": st.get("title"),
                    "linkedin_url": st.get("linkedin_url"),
                    "buyer_role": st.get("buyer_role"),
                    "outreach_priority": st.get("outreach_priority", 5)
                }
                try:
                    st_res = supabase.table("stakeholders").insert(st_db).execute()
                    top_stakeholders.append(st_res.data[0])
                except Exception as e:
                    print(f"Error saving stakeholder {st.get('name')}: {e}")
                    
            # 4. Generate sequences for top 2 stakeholders
            top_stakeholders = sorted(top_stakeholders, key=lambda x: x.get("outreach_priority", 0), reverse=True)[:2]
            
            for stakeholder in top_stakeholders:
                seq_dict = await generate_sequence(stakeholder, score_res, comp_signals)
                
                # Check compliance for all 3 emails
                full_text = f"{seq_dict.get('email_1', {}).get('body', '')} {seq_dict.get('email_2', {}).get('body', '')} {seq_dict.get('email_3', {}).get('body', '')}"
                comp_res = await check_compliance(full_text)
                
                seq_db = {
                    "stakeholder_id": stakeholder["id"],
                    "persona": score_res.get("recommended_persona", stakeholder.get("buyer_role")),
                    "email_1_subject": seq_dict.get("email_1", {}).get("subject", ""),
                    "email_1_body": seq_dict.get("email_1", {}).get("body", ""),
                    "email_2_subject": seq_dict.get("email_2", {}).get("subject", ""),
                    "email_2_body": seq_dict.get("email_2", {}).get("body", ""),
                    "email_3_subject": seq_dict.get("email_3", {}).get("subject", ""),
                    "email_3_body": seq_dict.get("email_3", {}).get("body", ""),
                    "compliance_status": "approved" if comp_res.get("is_compliant") else "flagged",
                    "compliance_flags": comp_res.get("flags", [])
                }
                
                try:
                    supabase.table("sequences").insert(seq_db).execute()
                except Exception as e:
                    print(f"Error saving sequence for {stakeholder.get('name')}: {e}")

        # Rate limiting: add a small delay between each company to avoid OpenRouter 429 errors (Free tier is ~8 RPM)
        await asyncio.sleep(10) 

    print(f"Pipeline finished for {'all companies' if not target_company else target_company}")

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.post("/pipeline/run")
async def pipeline_run(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_full_pipeline)
    return {"status": "started", "message": "Pipeline started for all companies in background."}

@app.post("/pipeline/run/{company}")
async def pipeline_run_company(company: str):
    try:
        await run_full_pipeline(company)
        return {"status": "success", "company": company}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/prospects")
async def get_prospects(min_score: Optional[int] = Query(None), urgency: Optional[str] = Query(None), limit: int = Query(100)):
    supabase = get_supabase()
    if not supabase: return []
    
    query = supabase.table("prospects").select("*, stakeholders(count)").order("intent_score", desc=True).limit(limit)
    if min_score:
        query = query.gte("intent_score", min_score)
    if urgency:
        query = query.eq("urgency", urgency)
        
    res = query.execute()
    return res.data

@app.get("/prospects/{id}")
async def get_prospect(id: str):
    supabase = get_supabase()
    if not supabase: return {}
    
    p_res = supabase.table("prospects").select("*").eq("id", id).execute()
    if not p_res.data: return {}
    prospect = p_res.data[0]
    
    # Get signals
    s_res = supabase.table("signals").select("*").eq("company_name", prospect["company_name"]).order("signal_date", desc=True).execute()
    prospect["signals"] = s_res.data
    
    # Get stakeholders & sequences
    st_res = supabase.table("stakeholders").select("*, sequences(*)").eq("prospect_id", id).execute()
    prospect["stakeholders"] = st_res.data
    
    return prospect

@app.get("/signals")
async def get_signals(company: Optional[str] = Query(None), signal_type: Optional[str] = Query(None), days: int = Query(90)):
    supabase = get_supabase()
    if not supabase: return []
    
    query = supabase.table("signals").select("*").order("signal_date", desc=True).limit(100)
    if company:
        query = query.eq("company_name", company)
    if signal_type:
        query = query.eq("signal_type", signal_type)
        
    res = query.execute()
    return res.data

@app.post("/sequences/{id}/approve")
async def approve_sequence(id: str):
    supabase = get_supabase()
    if not supabase: return {}
    
    res = supabase.table("sequences").update({"compliance_status": "approved"}).eq("id", id).execute()
    return res.data

@app.post("/sequences/{id}/send")
async def send_sequence(id: str):
    supabase = get_supabase()
    if not supabase: return {}
    
    # Here we would integrate Resend API
    res = supabase.table("sequences").update({
        "compliance_status": "sent",
        "sent_at": datetime.now().isoformat()
    }).eq("id", id).execute()
    return res.data

@app.get("/analytics")
async def get_analytics():
    supabase = get_supabase()
    if not supabase: return {}
    
    try:
        # Simplistic analytics for demo
        prospects = supabase.table("prospects").select("intent_score").execute().data
        signals = supabase.table("signals").select("signal_type").execute().data
        sequences = supabase.table("sequences").select("compliance_status").execute().data
        
        return {
            "total_prospects": len(prospects),
            "avg_score": sum(p["intent_score"] for p in prospects) / max(len(prospects), 1),
            "total_signals": len(signals),
            "total_emails": len(sequences) * 3,
            "flagged_sequences": len([s for s in sequences if s["compliance_status"] == "flagged"])
        }
    except Exception as e:
        print(f"Error fetching analytics: {e}")
        return {}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), reload=True)
