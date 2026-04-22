"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { fetchProspect } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Activity, Target, AlertCircle, Building2, Calendar } from "lucide-react";
import Link from "next/link";
import StakeholderCard from "@/components/StakeholderCard";
import EmailSequenceViewer from "@/components/EmailSequenceViewer";
import { Progress } from "@/components/ui/progress";

export default function ProspectDetail() {
  const params = useParams();
  const id = params.id as string;

  const [mounted, setMounted] = useState(false);
  const [demoMode, setDemoMode] = useState(true);
  const [prospect, setProspect] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStakeholder, setSelectedStakeholder] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const handleDemoChange = () => {
      const saved = localStorage.getItem("pitchit_demo_mode");
      setDemoMode(saved === null ? true : saved === "true");
    };
    window.addEventListener("demo-mode-changed", handleDemoChange);
    handleDemoChange();
    return () => window.removeEventListener("demo-mode-changed", handleDemoChange);
  }, []);

  useEffect(() => {
    async function load() {
      if (!mounted) return;
      setLoading(true);
      setProspect(null);
      setSelectedStakeholder(null);
      try {
        if (demoMode) {
          // Mock data
          const isFlagged = id === "1"; // Jupiter Money mock id
          
          let mockProspect;
          if (isFlagged) {
            mockProspect = {
              id,
              company_name: "Jupiter Money",
              intent_score: 87,
              urgency: "high",
              fit_summary: "Strong deposit pipeline candidate.",
              reasoning: "Raised ₹280Cr Series C on March 12. Posted Head of Deposits role 3 weeks later. Strong signal of deposits product launch.",
              signals: [
                { id: "s1", signal_type: "funding", signal_date: "2024-03-12", signal_detail: "Raised ₹280Cr Series C", source_url: "#" },
                { id: "s2", signal_type: "job_post", signal_date: "2024-04-02", signal_detail: "Posted Head of Deposits role", source_url: "#" },
              ],
              stakeholders: [
                {
                  id: "st1",
                  name: "Rahul Sharma",
                  title: "Chief Technology Officer",
                  buyer_role: "Technical Evaluator",
                  outreach_priority: 9,
                  linkedin_url: "https://linkedin.com",
                  sequences: [
                    {
                      id: "seq1",
                      compliance_status: "flagged",
                      compliance_flags: [{ phrase: "guaranteed returns of 8%", suggested_replacement: "attractive yields within RBI guidelines" }],
                      email_1_subject: "Quick question about Jupiter's deposits infra",
                      email_1_body: `Hi Rahul,\n\nSaw that Jupiter just raised Series C. Congrats! With the new focus on deposits, you should check out Blostem's FD APIs. We offer guaranteed returns of 8% for your users.\n\nLet's chat.`,
                      email_2_subject: "FD API Integration timeline", 
                      email_2_body: `Hi Rahul,\n\nFollowing up on my previous note. Since Jupiter is actively expanding its deposit offerings, I wanted to share that our API infrastructure can go live in under 2 weeks with minimal engineering overhead.\n\nWould you be open to a brief technical demo next week?`,
                      email_3_subject: "Any thoughts on deposit infrastructure?", 
                      email_3_body: `Hi Rahul,\n\nI know you're busy, so I'll keep this short. If deposit infrastructure is on your roadmap for this quarter, just reply 'yes' and I'll send over our technical documentation and API reference for your team to review.`
                    }
                  ]
                },
                {
                  id: "st2",
                  name: "Priya Patel",
                  title: "Head of Products",
                  buyer_role: "Champion",
                  outreach_priority: 8,
                  linkedin_url: "https://linkedin.com",
                  sequences: []
                }
              ]
            };
          } else {
            mockProspect = {
              id,
              company_name: "Fi Money",
              intent_score: 75,
              urgency: "high",
              fit_summary: "Evaluating deposit infrastructure partners.",
              reasoning: "Received regulatory nod for new product lines. Actively expanding wealth management offerings.",
              signals: [
                { id: "s1", signal_type: "regulatory", signal_date: "2024-04-10", signal_detail: "Received nod for expanding wealth products", source_url: "#" },
              ],
              stakeholders: [
                {
                  id: "st3",
                  name: "Sujith Narayanan",
                  title: "Co-Founder & CEO",
                  buyer_role: "Economic Buyer",
                  outreach_priority: 9,
                  linkedin_url: "https://linkedin.com",
                  sequences: [
                    {
                      id: "seq2",
                      compliance_status: "pending",
                      compliance_flags: [],
                      email_1_subject: "Fi Money's wealth management expansion",
                      email_1_body: `Hi Sujith,\n\nCongratulations on the recent regulatory progress for Fi's new product lines. As you scale your wealth management offerings, integrating compliant Fixed Deposit infrastructure can be challenging and time-consuming.\n\nBlostem provides ready-to-use, RBI-compliant FD APIs that can accelerate your time-to-market. Would you be open to a brief chat next week to discuss this?`,
                      email_2_subject: "FD APIs for Fi Money", 
                      email_2_body: `Hi Sujith,\n\nFollowing up on my previous note. We recently helped a similar platform launch their deposit products in under two weeks.\n\nLet me know if you'd like to see a quick technical demo of our API infrastructure.`,
                      email_3_subject: "Any thoughts on deposit infrastructure?", 
                      email_3_body: `Hi Sujith,\n\nI know you're busy, so I'll keep this short. If deposit infrastructure is on your roadmap for this quarter, just reply 'yes' and I'll send over some technical documentation for your team to review.`
                    }
                  ]
                }
              ]
            };
          }
          setProspect(mockProspect);
          if (mockProspect.stakeholders?.length > 0) {
            setSelectedStakeholder(mockProspect.stakeholders[0]);
          } else {
            setSelectedStakeholder(null);
          }
        } else {
          const data = await fetchProspect(id);
          setProspect(data);
          if (data.stakeholders?.length > 0) {
            setSelectedStakeholder(data.stakeholders[0]);
          } else {
            setSelectedStakeholder(null);
          }
        }
      } catch(e) { console.error(e) }
      setLoading(false);
    }
    if (mounted) {
      load();
    }
  }, [id, demoMode, mounted]);

  if (!mounted) return null;

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Activity className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!prospect) return <div>Prospect not found.</div>;

  const getSignalIcon = (type: string) => {
    switch(type) {
      case 'funding': return "💰";
      case 'job_post': return "👤";
      case 'regulatory': return "📋";
      default: return "📰";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Pipeline
        </Link>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-border shadow-[0_0_20px_rgba(var(--primary),0.1)]">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{prospect.company_name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant={prospect.urgency === 'high' ? 'destructive' : 'secondary'} className="uppercase text-xs">{prospect.urgency} URGENCY</Badge>
                <span className="text-sm text-muted-foreground">{prospect.fit_summary || "Potential FD API fit"}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground font-medium mb-1">AI Intent Score</p>
            <div className="flex items-center justify-end gap-3">
              <span className="text-4xl font-black text-primary">{prospect.intent_score}</span>
              <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${prospect.intent_score}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] min-h-[600px]">
        {/* Left: Signals */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Signal Timeline
          </h3>
          <div className="glass-panel p-4 flex-1 overflow-y-auto">
            <div className="relative border-l border-border/50 ml-3 pl-5 space-y-6 py-2">
              {prospect.signals?.map((signal: any) => (
                <div key={signal.id} className="relative group">
                  <div className="absolute -left-[30px] top-0 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-xs shadow-sm">
                    {getSignalIcon(signal.signal_type)}
                  </div>
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase">{signal.signal_type}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {signal.signal_date}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90">{signal.signal_detail}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> AI Reasoning
              </h4>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {prospect.reasoning}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Stakeholders */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Stakeholders
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-2">
            {prospect.stakeholders?.map((stakeholder: any) => (
              <StakeholderCard 
                key={stakeholder.id}
                stakeholder={stakeholder}
                isSelected={selectedStakeholder?.id === stakeholder.id}
                onClick={() => setSelectedStakeholder(stakeholder)}
              />
            ))}
          </div>
        </div>

        {/* Right: Sequence */}
        <div className="lg:col-span-6 flex flex-col gap-4 overflow-hidden h-full">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Generated Sequence
          </h3>
          <div className="glass-panel overflow-hidden flex-1 flex flex-col h-full">
            {selectedStakeholder ? (
              <EmailSequenceViewer 
                sequence={selectedStakeholder.sequences?.[0]} 
                stakeholderId={selectedStakeholder.id}
                demoMode={demoMode}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground p-8 text-center">
                Select a stakeholder to view their personalised outreach sequence.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Ensure lucide-react imports that were missing are here:
import { Users, Mail } from "lucide-react";
