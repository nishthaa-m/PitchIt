"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, Activity } from "lucide-react";
import { fetchProspects } from "@/lib/api";

export default function PipelineTable({ demoMode }: { demoMode: boolean }) {
  const router = useRouter();
  const [prospects, setProspects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (demoMode) {
          // Mock data for demo if API fails
          const mockData = [
            { id: "1", company_name: "Jupiter Money", intent_score: 87, urgency: "high", signals: [{count: 2}], stakeholders: [{count: 2}] },
            { id: "2", company_name: "Fi Money", intent_score: 75, urgency: "high", signals: [{count: 1}], stakeholders: [{count: 1}] },
            { id: "3", company_name: "Freo", intent_score: 64, urgency: "medium", signals: [{count: 1}], stakeholders: [{count: 0}] },
            { id: "4", company_name: "Razorpay", intent_score: 58, urgency: "medium", signals: [{count: 1}], stakeholders: [{count: 0}] },
          ];
          setProspects(mockData);
        } else {
          const data = await fetchProspects();
          setProspects(data);
        }
      } catch (e) {
        console.error(e);
        if (demoMode) {
          setProspects([
            { id: "1", company_name: "Jupiter Money", intent_score: 87, urgency: "high", signals: [{count: 2}], stakeholders: [{count: 2}] },
            { id: "2", company_name: "Fi Money", intent_score: 75, urgency: "high", signals: [{count: 1}], stakeholders: [{count: 1}] },
          ]);
        } else {
          setProspects([]);
        }
      }
      setLoading(false);
    }
    load();
  }, [demoMode]);

  const filtered = prospects.filter(p => p.company_name.toLowerCase().includes(filterQuery.toLowerCase()));

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-slate-400";
  };

  const getUrgencyBadge = (urgency: string) => {
    switch(urgency?.toLowerCase()) {
      case 'high': return <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">HIGH</Badge>;
      case 'medium': return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">MEDIUM</Badge>;
      case 'low': return <Badge variant="secondary" className="bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 border-slate-500/20">LOW</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search companies..." 
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-md border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="cursor-pointer hover:bg-accent px-3 py-1 text-sm">Score &gt; 70</Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent px-3 py-1 text-sm">High Urgency</Badge>
        </div>
      </div>

      <div className="glass-panel overflow-hidden border">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-foreground/80">Company</TableHead>
              <TableHead className="font-semibold text-foreground/80 w-48">Intent Score</TableHead>
              <TableHead className="font-semibold text-foreground/80">Urgency</TableHead>
              <TableHead className="font-semibold text-foreground/80 text-center">Signals</TableHead>
              <TableHead className="font-semibold text-foreground/80 text-center">Stakeholders</TableHead>
              <TableHead className="text-right font-semibold text-foreground/80">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <Activity className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
                  Loading pipeline data...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No prospects found in pipeline.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((prospect) => (
                <TableRow 
                  key={prospect.id} 
                  className="group hover:bg-accent/30 cursor-pointer transition-colors"
                  onClick={() => router.push(`/prospects/${prospect.id}?demo=${demoMode}`)}
                >
                  <TableCell className="font-medium text-base">
                    {prospect.company_name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg w-7">{prospect.intent_score}</span>
                      <Progress 
                        value={prospect.intent_score} 
                        className="h-2 w-full"
                        indicatorClassName={getScoreColor(prospect.intent_score)}
                      />
                    </div>
                  </TableCell>
                  <TableCell>{getUrgencyBadge(prospect.urgency)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="px-2 py-0.5 rounded-full font-mono text-xs">
                      {prospect.signals?.[0]?.count || prospect.signal_count || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="px-2 py-0.5 rounded-full font-mono text-xs">
                      {prospect.stakeholders?.[0]?.count || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      View <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
