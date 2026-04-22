"use client";

import { Badge } from "@/components/ui/badge";
import { Briefcase, Link as LinkIcon, UserCircle } from "lucide-react";

export default function StakeholderCard({ stakeholder, isSelected, onClick }: { stakeholder: any, isSelected: boolean, onClick: () => void }) {
  
  const getRoleColor = (role: string) => {
    switch(role) {
      case "Champion": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Economic Buyer": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Technical Evaluator": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "Compliance Gatekeeper": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`glass-panel p-4 cursor-pointer transition-all border-2 ${isSelected ? 'border-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'border-transparent hover:border-border'}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
            <UserCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{stakeholder.name}</h4>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <Briefcase className="w-3 h-3" />
              <span>{stakeholder.title}</span>
            </div>
          </div>
        </div>
        {stakeholder.linkedin_url && (
          <a href={stakeholder.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}>
            <LinkIcon className="w-4 h-4" />
          </a>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <Badge variant="outline" className={getRoleColor(stakeholder.buyer_role)}>
          {stakeholder.buyer_role}
        </Badge>
        
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Priority</span>
          <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center text-xs font-bold font-mono">
            {stakeholder.outreach_priority}
          </div>
        </div>
      </div>
    </div>
  );
}
