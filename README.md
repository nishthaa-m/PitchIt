# PitchIt AI 🚀
**Autonomous Multi-Agent B2B Prospecting for Banking Infrastructure**

PitchIt is an AI-powered sales intelligence platform that helps banking infrastructure providers (like Blostem) identify, score, and reach out to high-potential fintech partners autonomously.

## 🔗 Links
- **Live Demo:** [pitchit-ai.vercel.app](https://pitchit-ai.vercel.app)
- **Backend API:** [pitchit-api.railway.app](https://pitchit-api.railway.app) (Example)

## 💡 The Problem
In B2B sales for banking APIs (Fixed Deposits, Payments, Compliance), timing is everything. Sales teams spend hours manually scanning news for funding rounds or job boards for "Head of Product" hires. By the time they reach out, competitors have already moved in.

## 🤖 The Multi-Agent Solution
PitchIt uses a coordinated swarm of AI agents to automate the entire workflow:

1.  **The Signal Scraper:** Monitors NewsAPI, RBI Circulars, and Job Boards in real-time.
2.  **The Intent Scorer:** Analyzes signals and assigns a 0-100 "Buying Intent" score based on market fit.
3.  **The Stakeholder Classifier:** Scrapes LinkedIn/Team pages to find the CFO, CTO, and CPO.
4.  **The Outreach Architect:** Drafts personalized 3-email drip sequences tailored to each persona.
5.  **The Compliance Guard:** A specialized agent that audits every email to ensure all claims follow RBI guardrails and regulatory requirements.

## 🛠 Tech Stack
- **Frontend:** Next.js 14, Tailwind CSS, Framer Motion, Lucide React
- **Backend:** FastAPI, Python 3.11+, Httpx, Playwright
- **AI Orchestration:** OpenRouter (Llama 3.3, Claude 3.5, Gemini 1.5)
- **Database:** Supabase (PostgreSQL + Real-time)

## 🚀 Getting Started

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/scripts/activate # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---
Built with ❤️ for the **Blostem Hackathon**.
