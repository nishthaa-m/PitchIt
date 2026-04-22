"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronRight, ChevronLeft, Sparkles,
  Search, Target, Users, ShieldCheck, Zap
} from "lucide-react";
import { Button } from "./ui/button";

const steps = [
  {
    title: "Welcome to PitchIt AI",
    description: "The autonomous multi-agent engine designed to revolutionize B2B prospecting for the banking ecosystem.",
    icon: Sparkles,
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  },
  {
    title: "Autonomous Scrapers",
    description: "Our agents monitor NewsAPI, RBI circulars, and job boards 24/7 to find signals like funding rounds or leadership hires.",
    icon: Search,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    title: "Intent Scoring",
    description: "Every signal is analyzed by our Intent Agent, assigning a score from 0-100 based on the likelihood of needing banking infra.",
    icon: Target,
    color: "text-green-500",
    bg: "bg-green-500/10"
  },
  {
    title: "Persona-Based Outreach",
    description: "We automatically find stakeholders (CFO, CTO, etc.) and generate personalized 3-email drip sequences tailored to their role.",
    icon: Users,
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  {
    title: "Compliance Guard",
    description: "A specialized agent reviews every email to ensure all claims are RBI-compliant and follow regulatory guardrails.",
    icon: ShieldCheck,
    color: "text-red-500",
    bg: "bg-red-500/10"
  },
  {
    title: "Live vs Demo Mode",
    description: "Use the toggle in the sidebar to switch between 'Live Mode' (connected to the AI agents) and 'Demo Mode' (mock data).",
    icon: Zap,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10"
  },
  {
    title: "Your Quick Workflow",
    description: "1. Click 'Run AI Pipeline Scan' \n 2. Click 'View' for desired company from the list \n 3. Select a Stakeholder \n 4. Generate Email sequence \n 5. Review, Approve and Send the email sequence!",
    icon: ChevronRight,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10"
  }
];

export default function TutorialModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("pitchit_tutorial_seen");
    if (!hasSeenTutorial) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("pitchit_tutorial_seen", "true");
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="glass-panel w-full max-w-lg overflow-hidden relative"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8 flex flex-col items-center text-center">
            {/* Icon Wrapper */}
            <motion.div
              key={currentStep}
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              className={`p-4 rounded-2xl ${step.bg} mb-6`}
            >
              <step.icon className={`w-12 h-12 ${step.color}`} />
            </motion.div>

            {/* Content */}
            <motion.div
              key={`text-${currentStep}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4 mb-8"
            >
              <h2 className="text-2xl font-bold tracking-tight">{step.title}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {step.description}
              </p>
            </motion.div>

            {/* Progress Dots */}
            <div className="flex gap-2 mb-8">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-primary' : 'w-2 bg-muted'
                    }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between w-full">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 0}
                className={currentStep === 0 ? "opacity-0" : ""}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <Button onClick={nextStep} className="px-8 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                {currentStep === steps.length - 1 ? "Get Started" : "Next Step"}
                {currentStep !== steps.length - 1 && <ChevronRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
