import { useState, useEffect } from 'react';
import Logo from '@/components/shared/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Upload, BarChart3, Brain, Target, Zap, FileCheck, MessageSquare,
  ArrowRight, Search, Star, CheckCircle2, FileText, Eye, ChevronDown, Menu
} from 'lucide-react';
import AnimatedCounter from '@/components/shared/AnimatedCounter';
import { Button } from '@/components/ui/button';

const features = [
  { icon: BarChart3, title: 'ATS Compatibility Scan', description: 'Analyze your resume across 15+ parsing rules that modern applicant tracking systems use to filter candidates.' },
  { icon: Brain, title: 'Deep Content Audit', description: 'Advanced review of bullet impact, action verbs, and structure with direct replacement suggestions.' },
  { icon: Target, title: 'Role Targeting', description: 'Compare your CV directly against a target job description and map missing skills.' },
  { icon: Search, title: 'Keyword Extraction', description: 'Identify industry-specific keywords and term frequencies to boost matching algorithms.' },
  { icon: FileText, title: 'Resume Builder', description: 'Draft a clean, professional, and ATS-compliant resume directly using structured templates.' },
  { icon: MessageSquare, title: 'Interview Simulator', description: 'Generate realistic interview questions based directly on your parsed resume sections.' },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'Software Engineer', company: 'Google', quote: 'SmartResume raised my matching score. I received multiple responses within days of optimizing my application.' },
  { name: 'Marcus Chen', role: 'Product Manager', company: 'Stripe', quote: 'The builder layout is clean, and the keyword extraction is precise. It saved me hours of manual editing.' },
  { name: 'Aisha Patel', role: 'Data Analyst', company: 'Meta', quote: 'Having direct recruiter feedback helped me understand exactly where my projects fell short.' },
];

const faqs = [
  { q: 'How does the ATS scoring work?', a: 'Our parsing pipeline replicates standard ATS algorithms. We inspect formatting, headers, date alignments, contact placements, and term frequencies to generate a compatibility percentage.' },
  { q: 'What is the benefit of the Resume Builder?', a: 'Standard text editors insert floating blocks, boxes, or tables that confuse parser tools. Our builder outputs clean, linear structure that parses flawlessly every time.' },
  { q: 'Is my data secure?', a: 'Yes. All documents are processed over secure channels. Authenticated profiles store resumes in isolated cloud databases, and guest files exist only in memory.' },
];

function HeroDashboardMockup() {
  const [score, setScore] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let s = 0;
      const iv = setInterval(() => { s += 2; setScore(s); if (s >= 88) clearInterval(iv); }, 20);
      return () => clearInterval(iv);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <motion.div
      className="relative w-full max-w-sm mx-auto"
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="bg-card border border-border p-5 rounded-xl shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Logo size={16} showText={false} />
            <span className="text-xs font-bold text-foreground">ATS Optimization Radar</span>
          </div>
          <span className="text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">
            Scanner Active
          </span>
        </div>

        <div className="flex items-center gap-6">
          {/* Score ring */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0 relative">
            <svg width="104" height="104" className="score-ring">
              <circle cx="52" cy="52" r={radius} stroke="var(--border)" strokeWidth="6" fill="none" />
              <circle
                cx="52" cy="52" r={radius}
                stroke="var(--primary)" strokeWidth="7" fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.05s linear' }}
              />
            </svg>
            <div className="absolute top-[34px] text-center">
              <p className="text-lg font-extrabold text-foreground leading-none">{score}</p>
              <p className="text-[7.5px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Score</p>
            </div>
          </div>

          {/* Details list */}
          <div className="flex-1 space-y-2 text-[10px]">
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>Keyword Match</span>
                <span>94%</span>
              </div>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '94%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>Layout & Margins</span>
                <span>Passed</span>
              </div>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/40 transition-colors"
      >
        <span className="text-xs font-bold text-foreground">{question}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-350 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/80 pt-3">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFAQ, setOpenFAQ] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative">
      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-b ${scrolled ? 'bg-card/85 backdrop-blur-md border-border shadow-sm' : 'bg-transparent border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-5 md:px-10 py-3 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-1">
            <Logo size={28} />
          </button>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-xs font-semibold text-muted-foreground hover:text-foreground px-2 py-1 transition-colors">
              Sign In
            </button>
            <Button
              onClick={() => navigate('/dashboard')}
              className="text-xs font-bold rounded-lg px-4 h-8 bg-primary hover:bg-primary/95 text-white"
            >
              Get Started <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative hero-bg pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Copy */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="hero-badge">
                <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
                ATS-Optimized Resumes & Instants Scans
              </div>

              <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl leading-tight tracking-tight text-foreground">
                Build and Scan Resumes for{' '}
                <span className="text-primary">Recruiter Success.</span>
              </h1>

              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-xl">
                Create structured resume drafts using professional builder templates. Instantly analyze your compatibility score, pinpoint keyword deficits, and prep for interview questions.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-5 rounded-lg bg-primary hover:bg-primary/95 text-white font-bold text-xs sm:text-sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Analyze My Resume
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/resume-builder')}
                  className="px-6 py-5 rounded-lg border-border hover:bg-muted text-xs sm:text-sm font-bold"
                >
                  <FileText className="w-4 h-4 mr-2 text-primary" />
                  Use Resume Builder
                </Button>
              </div>

              <div className="flex flex-wrap gap-4 pt-3">
                {['No credit card required', 'Instant PDF exports', 'Fully ATS compatible'].map((badge) => (
                  <div key={badge} className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    {badge}
                  </div>
                ))}
              </div>
            </div>

            {/* Dashboard Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <HeroDashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────── */}
      <section className="relative z-10 py-8 border-y border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-5 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: 50000, suffix: '+', label: 'Resumes Audited' },
              { value: 92, suffix: '%', label: 'ATS Alignment' },
              { value: 45, suffix: 's', label: 'Processing Time' },
              { value: 5, suffix: '/5', label: 'User Rating' },
            ].map(({ value, suffix, label }) => (
              <div key={label} className="space-y-1">
                <span className="text-xl sm:text-2xl font-extrabold text-foreground">
                  <AnimatedCounter target={value} suffix={suffix} />
                </span>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────── */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-5 md:px-10">
        <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">Structured Resume Optimization</h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-normal">
            Equipping job seekers with the diagnostic and writing utilities needed to navigate recruiter algorithms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="bg-card border border-border rounded-xl p-5 hover:border-primary/45 hover:-translate-y-0.5 transition-all duration-200 text-left space-y-3 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-secondary text-primary flex items-center justify-center">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-foreground">{f.title}</h3>
                <p className="text-[11.5px] text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────── */}
      <section id="testimonials" className="py-16 border-t border-border bg-card/10">
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">Approved by Professionals</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Hear from candidates who secured offers at top tech firms.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-card border border-border p-6 rounded-xl space-y-4">
                <p className="text-xs text-muted-foreground italic leading-relaxed">"{t.quote}"</p>
                <div>
                  <h4 className="text-xs font-bold text-foreground">{t.name}</h4>
                  <p className="text-[10px] text-muted-foreground">{t.role} at <span className="text-primary font-semibold">{t.company}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 border-t border-border">
        <div className="max-w-3xl mx-auto px-5">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Everything you need to know about the scan process.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.q}
                answer={faq.a}
                isOpen={openFAQ === i}
                onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="py-10 border-t border-border text-center text-[10.5px] text-muted-foreground bg-card/60">
        <p>© 2026 SmartResume. Designed with high fidelity, ATS compliance, and data privacy.</p>
      </footer>
    </div>
  );
}
