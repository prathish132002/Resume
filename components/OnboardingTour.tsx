import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X, Sparkles, Target, Layout, ShieldCheck } from 'lucide-react';
import { Button } from './ui/Button';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string; // CSS selector for highlighting (optional for this simple version)
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to ResumeForge",
    description: "The most powerful AI-driven resume builder. Let's take a 30-second tour to unlock your career potential.",
    icon: <Sparkles className="text-purple-500" size={32} />
  },
  {
    title: "AI Resume Generator",
    description: "Start from scratch or adapt an existing resume. Our AI roleplays as an expert recruiter to write high-impact content for you.",
    icon: <Target className="text-blue-500" size={32} />
  },
  {
    title: "ATS Bypass Engine",
    description: "Don't just write—optimize. Use our ATS Score Checker to see how machines read your resume and get instant AI improvements.",
    icon: <ShieldCheck className="text-emerald-500" size={32} />
  },
  {
    title: "Premium Templates",
    description: "Switch between modern, professional, and ATS-optimized templates with a single click. No formatting headaches ever.",
    icon: <Layout className="text-amber-500" size={32} />
  }
];

interface OnboardingTourProps {
  onComplete: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay for better entry feel
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onComplete, 500);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
          >
            {/* Header / Progress */}
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
              <motion.div 
                className="h-full bg-blue-500"
                initial={{ width: "0%" }}
                animate={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
              />
            </div>

            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-8 pt-10 text-center">
              <motion.div 
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                <div className="mb-6 p-4 bg-slate-50 rounded-2xl">
                  {TOUR_STEPS[currentStep].icon}
                </div>
                
                <h3 className="text-2xl font-bold text-slate-800 mb-3">
                  {TOUR_STEPS[currentStep].title}
                </h3>
                
                <p className="text-slate-600 leading-relaxed mb-8">
                  {TOUR_STEPS[currentStep].description}
                </p>
              </motion.div>

              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {TOUR_STEPS.map((_, i) => (
                    <div 
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-blue-500' : 'w-1.5 bg-slate-200'}`}
                    />
                  ))}
                </div>
                
                <Button 
                  onClick={handleNext}
                  className="px-6 group"
                  icon={<ChevronRight className="group-hover:translate-x-1 transition-transform" size={18} />}
                >
                  {currentStep === TOUR_STEPS.length - 1 ? "Get Started" : "Next"}
                </Button>
              </div>
            </div>

            {/* Bottom Accent */}
            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingTour;
