"use client";

import { useState, useEffect } from "react";
import { getAnalytics } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Activity, Mail, Target, ShieldAlert } from "lucide-react";

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [demoMode, setDemoMode] = useState(true);

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

  useEffect(() => {
    async function load() {
      if (!mounted) return;
      setData(null);
      try {
        if (demoMode) {
          setData({
            total_prospects: 124,
            avg_score: 68,
            total_signals: 342,
            total_emails: 186,
            flagged_sequences: 12,
            chartData: [
              { name: 'Funding', count: 120 },
              { name: 'Jobs', count: 150 },
              { name: 'Regulatory', count: 45 },
              { name: 'News', count: 27 },
            ],
            velocityData: [
              { day: 'Mon', signals: 12 },
              { day: 'Tue', signals: 19 },
              { day: 'Wed', signals: 15 },
              { day: 'Thu', signals: 28 },
              { day: 'Fri', signals: 22 },
              { day: 'Sat', signals: 5 },
              { day: 'Sun', signals: 8 },
            ]
          });
        } else {
          const res = await getAnalytics();
          setData(res);
        }
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, [demoMode, mounted]);

  if (!mounted) return null;
  if (!data) return <div className="flex h-[60vh] items-center justify-center"><Activity className="w-8 h-8 animate-spin text-primary" /></div>;

  const kpis = [
    { title: "Signals Ingested", value: data.total_signals, icon: Activity, color: "text-blue-500" },
    { title: "Prospects Scored", value: data.total_prospects, icon: Target, color: "text-primary" },
    { title: "Emails Generated", value: data.total_emails, icon: Mail, color: "text-amber-500" },
    { title: "Compliance Flags", value: data.flagged_sequences, icon: ShieldAlert, color: "text-red-500" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Key performance indicators for PitchIt pipeline.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="glass-panel p-5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-muted-foreground">{kpi.title}</span>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div className="text-3xl font-bold">{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold mb-6">Signals by Type</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#1a1b26', borderColor: '#333'}} />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold mb-6">Pipeline Velocity (Last 7 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.velocityData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="day" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{backgroundColor: '#1a1b26', borderColor: '#333'}} />
                <Line type="monotone" dataKey="signals" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
