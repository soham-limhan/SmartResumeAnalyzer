import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowRight, ArrowLeft, Upload, Target, Brain, Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Particles from '@/components/shared/Particles';

const steps = [
  {
    icon: Upload,
    title: 'Upload Your Resume',
    description: 'Simply drag and drop your PDF or DOCX resume. We accept all standard resume formats.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Brain,
    title: 'AI Analyzes Everything',
    description: 'Our AI engine scores your resume against ATS systems, detects missing skills, and generates actionable insights.',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: Target,
    title: 'Get Targeted Feedback',
    description: 'Receive recruiter-perspective feedback, interview questions, and specific improvement recommendations.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Rocket,
    title: 'Land Your Dream Job',
    description: 'Use our insights to optimize your resume and stand out from the competition. You\'re ready!',
    color: 'from-pink-500 to-rose-500',
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else navigate('/dashboard');
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  const current = steps[step];
  const Icon = current.icon;

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative">
      <div className="fixed inset-0 z-0">
        <Particles count={25} />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="glass-strong rounded-3xl p-8 text-center">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((_, i) => (
              <motion.div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-8 bg-primary' : i < step ? 'w-4 bg-primary/50' : 'w-4 bg-muted'
                }`}
                layout
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${current.color} flex items-center justify-center mb-6`}>
                <Icon className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-2xl font-heading font-bold mb-3">{current.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                {current.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center justify-between mt-10">
            <Button
              variant="ghost"
              onClick={prev}
              disabled={step === 0}
              className="rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>

            <Button
              onClick={next}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 rounded-xl px-6"
            >
              {step === steps.length - 1 ? (
                <>Get Started <Sparkles className="w-4 h-4 ml-1" /></>
              ) : (
                <>Next <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>

          {/* Skip */}
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip onboarding
          </button>
        </div>
      </div>
    </div>
  );
}
