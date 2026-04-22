"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Send, Edit, RefreshCw, Mail } from "lucide-react";
import { approveSequence } from "@/lib/api";

export default function EmailSequenceViewer({ sequence, stakeholderId, demoMode }: { sequence: any, stakeholderId?: string, demoMode: boolean }) {
  const [localSequence, setLocalSequence] = useState(sequence);
  const [status, setStatus] = useState("pending");
  const [flags, setFlags] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("email_1");
  const [emails, setEmails] = useState({ email_1: "", email_2: "", email_3: "" });

  const [isEditing, setIsEditing] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (sequence) {
      setLocalSequence(sequence);
    } else if (demoMode && stakeholderId) {
      const savedMock = localStorage.getItem(`mock_seq_${stakeholderId}`);
      if (savedMock) {
        setLocalSequence(JSON.parse(savedMock));
      } else {
        setLocalSequence(null);
      }
    } else {
      setLocalSequence(null);
    }
  }, [sequence, stakeholderId, demoMode]);

  useEffect(() => {
    if (localSequence) {
      const savedStatus = demoMode ? localStorage.getItem(`seq_status_${localSequence.id}`) : null;
      setStatus(savedStatus || localSequence.compliance_status || "pending");
      setFlags(localSequence.compliance_flags || []);
      setEmails({
        email_1: localSequence.email_1_body || "",
        email_2: localSequence.email_2_body || "",
        email_3: localSequence.email_3_body || "",
      });
    }
  }, [localSequence, demoMode]);

  const isFlagged = status === "flagged";
  const isApproved = status === "approved";
  const isSent = status === "sent";

  const handleFixAI = async () => {
    setFixing(true);
    setTimeout(() => {
      let newBody = emails.email_1;
      flags.forEach(flag => {
        newBody = newBody.replace(flag.phrase, flag.suggested_replacement);
      });
      setEmails(prev => ({ ...prev, email_1: newBody }));
      setFlags([]);
      setStatus("pending");
      setFixing(false);
    }, 1500);
  };

  const handleApprove = async () => {
    if (!demoMode && localSequence?.id) {
      try {
        await approveSequence(localSequence.id);
      } catch (e) { console.error(e) }
    } else if (demoMode && localSequence?.id) {
      localStorage.setItem(`seq_status_${localSequence.id}`, "approved");
    }
    setStatus("approved");
  };

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setStatus("sent");
      if (demoMode && localSequence?.id) {
        localStorage.setItem(`seq_status_${localSequence.id}`, "sent");
      }
      setSending(false);
    }, 1500);
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const mockSeq = {
        id: `mock_generated_${stakeholderId}`,
        compliance_status: "pending",
        compliance_flags: [],
        email_1_subject: "Exploring FD API synergies for your new product lines",
        email_1_body: "Hi Priya,\n\nI noticed your team is heavily focused on expanding the product suite this quarter. Given your role driving the product roadmap, I wanted to introduce Blostem's RBI-compliant FD infrastructure.\n\nWe can get your platform live with deposit products in <1 day, unlocking a massive new revenue stream without tying up your engineering resources.\n\nAre you open to a brief technical demo next Tuesday?",
        email_2_subject: "Time-to-market for deposit products",
        email_2_body: "Hi Priya,\n\nFollowing up on my previous note. We recently helped a similar fintech launch their deposit offering in just 8 days, generating ₹50Cr in AUM within the first month.\n\nLet me know if you'd like me to send over our API documentation so your team can evaluate the integration effort.",
        email_3_subject: "Any thoughts?",
        email_3_body: "Hi Priya,\n\nIf deposit infrastructure isn't a priority for the upcoming sprint, no worries at all. Just reply 'yes' when you're ready and I'll ensure you get immediate access to our sandbox environment."
      };
      setLocalSequence(mockSeq);
      if (demoMode && stakeholderId) {
        localStorage.setItem(`mock_seq_${stakeholderId}`, JSON.stringify(mockSeq));
      }
      setGenerating(false);
    }, 2500);
  };

  const highlightFlags = (text: string) => {
    if (!isFlagged || flags.length === 0) return text;
    let highlightedText = text;
    flags.forEach(flag => {
      const regex = new RegExp(`(${flag.phrase})`, "gi");
      highlightedText = highlightedText.replace(regex, `<span class="bg-red-500/30 text-red-400 font-semibold px-1 rounded cursor-help relative group">$1<span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg hidden group-hover:block z-10 border border-border">Suggested: ${flag.suggested_replacement}</span></span>`);
    });
    return <div dangerouslySetInnerHTML={{ __html: highlightedText.replace(/\n/g, '<br/>') }} />;
  };

  if (!localSequence) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center gap-4">
        <p>No sequence generated for this stakeholder yet.</p>
        <Button onClick={handleGenerate} disabled={generating} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)]">
          {generating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
          {generating ? "AI is generating..." : "Generate Sequence with AI"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className={`p-3 border-b flex items-center justify-between transition-colors ${isFlagged ? 'bg-red-500/10 border-red-500/20' :
          isApproved ? 'bg-green-500/10 border-green-500/20' :
            isSent ? 'bg-blue-500/10 border-blue-500/20' : 'bg-muted/30 border-border'
        }`}>
        <div className="flex items-center gap-2">
          {isFlagged ? <AlertTriangle className="w-5 h-5 text-red-500" /> :
            isApproved ? <CheckCircle2 className="w-5 h-5 text-green-500" /> :
              isSent ? <Send className="w-5 h-5 text-blue-500" /> : <AlertTriangle className="w-5 h-5 text-amber-500" />}

          <span className={`font-semibold ${isFlagged ? 'text-red-500' : isApproved ? 'text-green-500' : isSent ? 'text-blue-500' : 'text-amber-500'
            }`}>
            {isFlagged ? 'Compliance Violation Detected' :
              isApproved ? 'Approved for Sending' :
                isSent ? 'Sequence Sent successfully!' : 'Pending Review'}
          </span>
        </div>

        {isFlagged && (
          <Button size="sm" variant="destructive" onClick={handleFixAI} disabled={fixing} className="h-8">
            {fixing ? <RefreshCw className="w-4 h-4 animate-spin mr-1.5" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
            Fix with AI
          </Button>
        )}
      </div>

      <div className="flex-1 p-0 overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
          <div className="px-4 pt-4 border-b">
            <TabsList className="w-full justify-start bg-transparent border-b rounded-none p-0 h-auto gap-4">
              <TabsTrigger value="email_1" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 h-auto text-sm">
                Email 1 (Hook)
              </TabsTrigger>
              <TabsTrigger value="email_2" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 h-auto text-sm">
                Email 2 (Social Proof)
              </TabsTrigger>
              <TabsTrigger value="email_3" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 h-auto text-sm">
                Email 3 (Soft CTA)
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Subject</p>
                <div className="text-lg font-medium text-foreground">
                  {localSequence[`${activeTab}_subject`]}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Body</p>
                <div className="glass-panel p-5 text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans bg-background/30">
                  {isEditing ? (
                    <textarea
                      className="w-full h-64 bg-transparent border-none outline-none resize-none"
                      value={emails[activeTab as keyof typeof emails]}
                      onChange={(e) => setEmails({ ...emails, [activeTab]: e.target.value })}
                    />
                  ) : (
                    activeTab === "email_1" ? highlightFlags(emails.email_1) : emails[activeTab as keyof typeof emails]
                  )}
                </div>
              </div>
            </div>
          </div>
        </Tabs>
      </div>

      <div className="p-4 border-t bg-muted/20 flex justify-between items-center">
        <Button variant="outline" onClick={() => setIsEditing(!isEditing)} disabled={isSent}>
          <Edit className="w-4 h-4 mr-2" />
          {isEditing ? 'Save Edits' : 'Edit Manually'}
        </Button>
        <div className="flex gap-3">
          <Button
            variant="outline"
            disabled={isApproved || isSent || (isFlagged && flags.length > 0)}
            onClick={handleApprove}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Approve
          </Button>
          <Button
            disabled={!isApproved || sending || isSent}
            onClick={handleSend}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {sending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            {sending ? 'Sending...' : isSent ? 'Sent' : 'Send Sequence'}
          </Button>
        </div>
      </div>
    </div>
  );
}
