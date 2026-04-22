"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch"; // Assuming we install switch

export default function Navigation() {
  const pathname = usePathname();
  const [demoMode, setDemoMode] = useState(true);

  // We persist demo mode state globally (e.g. in localStorage)
  useEffect(() => {
    const saved = localStorage.getItem("pitchit_demo_mode");
    if (saved !== null) {
      setDemoMode(saved === "true");
    }
  }, []);

  const toggleDemo = (val: boolean) => {
    setDemoMode(val);
    localStorage.setItem("pitchit_demo_mode", val.toString());
    // Optionally trigger a reload or context update here
    window.dispatchEvent(new Event("demo-mode-changed"));
  };

  const navLinks = [
    { name: "Pipeline", href: "/" },
    { name: "Analytics", href: "/analytics" },
  ];

  return (
    <nav className="glass-panel sticky top-0 z-50 rounded-none border-t-0 border-x-0 px-6 lg:px-12 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground text-lg shadow-[0_0_15px_rgba(var(--primary),0.5)]">
            P
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            PitchIt
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`transition-colors hover:text-primary ${
                pathname === link.href ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center flex-1 mx-4 max-w-sm">
        {/* Centered Demo Mode Toggle */}
        <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-muted/50 border border-border">
          <span className={`text-xs font-medium ${!demoMode ? 'text-primary' : 'text-muted-foreground'}`}>Live APIs</span>
          <button 
            onClick={() => toggleDemo(!demoMode)}
            className={`w-10 h-5 rounded-full relative transition-colors duration-200 ease-in-out ${demoMode ? 'bg-amber-500' : 'bg-primary'}`}
          >
            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ease-in-out ${demoMode ? 'translate-x-5.5 left-0.5' : 'translate-x-0.5 left-0'}`} />
          </button>
          <span className={`text-xs font-medium ${demoMode ? 'text-amber-500 font-bold' : 'text-muted-foreground'}`}>Demo Mode</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-xs text-muted-foreground text-right mr-2">
          <div>Logged in as</div>
          <div className="font-medium text-foreground">Blostem Sales</div>
        </div>
        <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center text-secondary-foreground font-bold text-sm">
          BS
        </div>
      </div>
    </nav>
  );
}
