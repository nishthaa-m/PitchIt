"use client";

import { useState, useEffect } from "react";
import { Activity, Users, Target, Mail, ScanSearch, CheckCircle2 } from "lucide-react";
import PipelineTable from "@/components/PipelineTable";
import TutorialModal from "@/components/TutorialModal";
import { Button } from "@/components/ui/button";
import { runPipeline } from "@/lib/api";

export default function Dashboard() {
  const [demoMode, setDemoMode] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

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

  const handleScanNow = async () => {
    setIsScanning(true);
    setScanProgress(10);
    
    // Simulate progress
    const interval = setInterval(() => {
      setScanProgress(p => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + 15;
      });
    }, 1000);

    try {
      if (!demoMode) {
        await runPipeline();
      } else {
        // Just delay for demo
        await new Promise(r => setTimeout(r, 4000));
      }
      setScanProgress(100);
      setTimeout(() => {
        setIsScanning(false);
        setScanProgress(0);
        // In real app we would mutate data or reload
        window.location.reload();
      }, 1000);
    } catch (e) {
      console.error(e);
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const [metrics, setMetrics] = useState([
    { title: "Total Prospects", value: "-", icon: Users, color: "text-blue-500" },
    { title: "High Intent (>80)", value: "-", icon: Target, color: "text-green-500" },
    { title: "Emails Ready", value: "-", icon: Mail, color: "text-amber-500" },
    { title: "Avg Intent Score", value: "-", icon: Activity, color: "text-purple-500" },
  ]);

  useEffect(() => {
    async function fetchMetrics() {
      if (!mounted) return;
      if (!demoMode) {
        setMetrics([
          { title: "Total Prospects", value: "...", icon: Users, color: "text-blue-500" },
          { title: "High Intent (>80)", value: "...", icon: Target, color: "text-green-500" },
          { title: "Emails Ready", value: "...", icon: Mail, color: "text-amber-500" },
          { title: "Avg Intent Score", value: "...", icon: Activity, color: "text-purple-500" },
        ]);
        try {
          // You would ideally import getAnalytics here, using dynamic import to avoid dependency loop
          const { getAnalytics } = await import('@/lib/api');
          const data = await getAnalytics();
          setMetrics([
            { title: "Total Prospects", value: data.total_prospects?.toString() || "0", icon: Users, color: "text-blue-500" },
            { title: "High Intent (>80)", value: data.total_prospects?.toString() || "0", icon: Target, color: "text-green-500" },
            { title: "Emails Ready", value: data.total_emails?.toString() || "0", icon: Mail, color: "text-amber-500" },
            { title: "Avg Intent Score", value: Math.round(data.avg_score || 0).toString(), icon: Activity, color: "text-purple-500" },
          ]);
        } catch(e) {
          // Keep 0s on error
          setMetrics([
            { title: "Total Prospects", value: "0", icon: Users, color: "text-blue-500" },
            { title: "High Intent (>80)", value: "0", icon: Target, color: "text-green-500" },
            { title: "Emails Ready", value: "0", icon: Mail, color: "text-amber-500" },
            { title: "Avg Intent Score", value: "0", icon: Activity, color: "text-purple-500" },
          ]);
        }
      } else {
        setMetrics([
          { title: "Total Prospects", value: "124", icon: Users, color: "text-blue-500" },
          { title: "High Intent (>80)", value: "18", icon: Target, color: "text-green-500" },
          { title: "Emails Ready", value: "36", icon: Mail, color: "text-amber-500" },
          { title: "Avg Intent Score", value: "62", icon: Activity, color: "text-purple-500" },
        ]);
      }
    }
    fetchMetrics();
  }, [demoMode]);

  if (!mounted) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <TutorialModal />
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">Live Pipeline</h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-500/10 text-green-500 text-xs font-semibold uppercase tracking-wider border border-green-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live Sync
            </div>
          </div>
          <p className="text-muted-foreground">
            Monitoring RBI signals, funding news, and job posts in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground hidden sm:block">Last refresh: Just now</p>
          <Button 
            onClick={handleScanNow} 
            disabled={isScanning}
            className="shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all hover:shadow-[0_0_25px_rgba(var(--primary),0.5)]"
          >
            {isScanning ? (
              <>
                <Activity className="w-4 h-4 mr-2 animate-spin" />
                Scanning Market...
              </>
            ) : scanProgress === 100 ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Scan Complete
              </>
            ) : (
              <>
                <ScanSearch className="w-4 h-4 mr-2" />
                Run AI Pipeline Scan
              </>
            )}
          </Button>
        </div>
      </div>

      {isScanning && (
        <div className="glass-panel p-4 overflow-hidden relative">
          <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-primary">Running AI Pipeline</span>
              <span>{scanProgress}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out relative"
                style={{ width: `${scanProgress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite] w-full" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}></div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {scanProgress < 30 ? "Fetching signals from NewsAPI & RBI..." 
               : scanProgress < 60 ? "Scoring intent with Claude Sonnet..." 
               : scanProgress < 90 ? "Identifying stakeholders & generating sequences..." 
               : "Finalizing compliance checks..."}
            </p>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.title} className="glass-panel p-5 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
              <div className={`p-2 rounded-lg bg-background/50 border border-border/50 ${metric.color}`}>
                <metric.icon className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-3xl font-bold tracking-tight">{metric.value}</h3>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="mt-8">
        <PipelineTable demoMode={demoMode} />
      </div>
    </div>
  );
}
