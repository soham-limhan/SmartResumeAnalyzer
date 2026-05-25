import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Upload, BarChart3, Brain, Target, Zap, FileCheck, MessageSquare,
  ChevronRight, ArrowRight, Shield, Search, Star, CheckCircle2, X,
  TrendingUp, FileText, Layers, Eye, Award, ChevronDown, Menu,
} from 'lucide-react';
import Particles from '@/components/shared/Particles';
import AnimatedCounter from '@/components/shared/AnimatedCounter';
import FeatureCard from '@/components/shared/FeatureCard';
import TestimonialCard from '@/components/shared/TestimonialCard';
import PricingCard from '@/components/shared/PricingCard';

/* ─── DATA ───────────────────────────────────────────────────────── */
const features = [
  { icon: BarChart3, title: 'ATS Score Analysis', description: 'Instant ATS compatibility score with a detailed breakdown across 15+ dimensions recruiters actually check.', gradient: 'from-indigo-500 to-violet-500' },
  { icon: Brain, title: 'AI-Powered Insights', description: 'Leverage advanced AI to surface hidden strengths, critical gaps, and high-impact improvement opportunities.', gradient: 'from-violet-500 to-purple-600' },
  { icon: Target, title: 'Skill Gap Detection', description: 'Pinpoint missing skills and keywords that ATS systems are filtering for in your target role.', gradient: 'from-purple-500 to-pink-500' },
  { icon: Search, title: 'Keyword Optimization', description: 'Deep keyword frequency analysis with relevance scoring against real industry job descriptions.', gradient: 'from-blue-500 to-cyan-500' },
  { icon: FileText, title: 'Job Match Analysis', description: 'Paste any job description and get an instant compatibility percentage with targeted recommendations.', gradient: 'from-cyan-500 to-teal-500' },
  { icon: Eye, title: 'Recruiter Readability', description: 'Get honest, structured feedback from the perspective of a senior technical recruiter in your field.', gradient: 'from-teal-500 to-emerald-500' },
  { icon: MessageSquare, title: 'Interview Prep', description: 'AI-generated interview questions tailored specifically to your resume, experience, and target role.', gradient: 'from-emerald-500 to-green-500' },
  { icon: Layers, title: 'Formatting Insights', description: 'Identify formatting issues that silently hurt your resume in ATS parsing — before recruiters see it.', gradient: 'from-amber-500 to-orange-500' },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'Software Engineer', company: 'Google', quote: 'ResumePilot boosted my ATS score from 58 to 91. Got 4 interview calls within a week of updating my resume.', rating: 5, avatarColor: 'from-indigo-500 to-violet-600' },
  { name: 'Marcus Chen', role: 'Product Manager', company: 'Stripe', quote: 'The keyword optimization alone was a game-changer. Clear, actionable, and incredibly fast. Worth every penny.', rating: 5, avatarColor: 'from-cyan-500 to-blue-600' },
  { name: 'Aisha Patel', role: 'Data Scientist', company: 'Meta', quote: 'As a fresher, I had no idea what ATS even was. This tool walked me through everything. Landed my first big-tech role!', rating: 5, avatarColor: 'from-violet-500 to-purple-600' },
  { name: 'Ryan O\'Brien', role: 'UX Designer', company: 'Figma', quote: 'The recruiter feedback section is uncanny — it felt like a real human reviewed my resume. Highly recommend.', rating: 5, avatarColor: 'from-emerald-500 to-teal-600' },
  { name: 'Sofia Martínez', role: 'Backend Engineer', company: 'Shopify', quote: 'Used it before every application. My interview rate went from 5% to 35%. The job match analysis is brilliant.', rating: 5, avatarColor: 'from-pink-500 to-rose-600' },
  { name: 'James Park', role: 'ML Engineer', company: 'OpenAI', quote: 'Clean UI, fast analysis, and genuinely useful output. Other tools feel like toys after using ResumePilot.', rating: 5, avatarColor: 'from-orange-500 to-amber-600' },
];

const pricingPlans = [
  {
    plan: 'Free',
    price: 0,
    description: 'Perfect for students and first-time job seekers getting started.',
    features: [
      { text: '3 resume analyses/month', included: true },
      { text: 'ATS score & summary', included: true },
      { text: 'Top 5 keyword suggestions', included: true },
      { text: 'PDF export', included: false },
      { text: 'Job match analysis', included: false },
      { text: 'Interview questions', included: false },
      { text: 'Batch analysis (up to 25)', included: false },
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    plan: 'Pro',
    price: 9,
    description: 'For active job seekers who want every edge possible.',
    features: [
      { text: 'Unlimited resume analyses', included: true },
      { text: 'Full ATS score breakdown', included: true },
      { text: 'Complete keyword analysis', included: true },
      { text: 'PDF export', included: true },
      { text: 'Job match analysis', included: true },
      { text: 'Interview questions', included: true },
      { text: 'Batch analysis (up to 25)', included: false },
    ],
    cta: 'Start Pro →',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    plan: 'Career Plus',
    price: 19,
    description: 'For recruiters and power users managing multiple candidates.',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Batch analysis (up to 25)', included: true },
      { text: 'Recruiter dashboard', included: true },
      { text: 'Candidate comparison', included: true },
      { text: 'Priority AI queue', included: true },
      { text: 'CSV export & shortlisting', included: true },
      { text: 'Dedicated support', included: true },
    ],
    cta: 'Start Career Plus →',
    highlighted: false,
  },
];

const faqs = [
  { q: 'How does the ATS scoring work?', a: 'Our AI analyzes your resume against 15+ dimensions including keyword density, formatting structure, section completeness, and readability — the same signals most ATS systems use to filter candidates.' },
  { q: 'What file formats are supported?', a: 'We support PDF and DOCX formats up to 10MB each. For best results, we recommend uploading a clean, text-based PDF rather than a scanned document.' },
  { q: 'Is my resume data kept private?', a: 'Yes. Your resume is processed securely, never shared with third parties, and automatically deleted after analysis. We take privacy seriously.' },
  { q: 'How long does analysis take?', a: 'Most single resumes are analyzed in under 60 seconds. Batch uploads of up to 25 resumes are processed concurrently and typically complete within 5 minutes.' },
  { q: 'Can I use this without creating an account?', a: 'Yes! You can analyze up to 3 resumes as a guest without signing up. Creating a free account unlocks history tracking and saved results.' },
];

/* ─── ANIMATIONS ─────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.55, ease: [0.25, 0.1, 0.25, 1] } }),
};

/* ─── HERO DASHBOARD MOCKUP ──────────────────────────────────────── */
function HeroDashboardMockup() {
  const [score, setScore] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let s = 0;
      const iv = setInterval(() => { s += 2; setScore(s); if (s >= 87) clearInterval(iv); }, 25);
      return () => clearInterval(iv);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  const scoreColor = '#818cf8';
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <motion.div
      className="relative w-full max-w-md mx-auto"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Main dashboard card */}
      <div className="card-premium p-5 shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-semibold text-foreground">Resume Analysis</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>

        <div className="flex gap-4">
          {/* Score ring */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <svg width="120" height="120" className="score-ring" style={{ filter: `drop-shadow(0 0 10px ${scoreColor}55)` }}>
              <circle cx="60" cy="60" r={radius} stroke="oklch(1 0 0 / 8%)" strokeWidth="10" fill="none" />
              <circle
                cx="60" cy="60" r={radius}
                stroke="url(#hero-grad)" strokeWidth="10" fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.05s linear' }}
              />
              <defs>
                <linearGradient id="hero-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute" style={{ marginTop: '-76px', marginLeft: '0' }}>
              {/* Inline score number */}
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">ATS Score</p>
            <p className="text-2xl font-heading font-bold text-indigo-400 -mt-1">{score}<span className="text-sm text-muted-foreground">/100</span></p>
          </div>

          {/* Right panel */}
          <div className="flex-1 space-y-2.5">
            {/* Keywords */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5">Keyword Match</p>
              {[
                { label: 'React.js', pct: 92 },
                { label: 'TypeScript', pct: 78 },
                { label: 'Node.js', pct: 65 },
                { label: 'System Design', pct: 45 },
              ].map(({ label, pct }, i) => (
                <div key={label} className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] text-muted-foreground w-16 flex-shrink-0">{label}</span>
                  <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.8 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-[9px] text-indigo-400 font-medium w-6 text-right">{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom chips */}
        <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-white/8">
          {['✓ Strong Summary', '✓ Quantified Impact', '⚠ Missing Keywords', '✓ Clean Format'].map((chip) => (
            <span
              key={chip}
              className={`text-[9px] px-2 py-0.5 rounded-full font-medium
                ${chip.startsWith('⚠') ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      {/* Floating metric cards */}
      <motion.div
        className="absolute -top-4 -right-6 card-premium px-3 py-2 shadow-xl hidden sm:block"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <p className="text-[9px] text-muted-foreground">Job Match</p>
        <p className="text-base font-heading font-bold text-emerald-400">89%</p>
      </motion.div>

      <motion.div
        className="absolute -bottom-4 -left-6 card-premium px-3 py-2 shadow-xl hidden sm:block"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <p className="text-[9px] text-muted-foreground">Keywords Found</p>
        <p className="text-base font-heading font-bold text-indigo-400">47 / 52</p>
      </motion.div>
    </motion.div>
  );
}

/* ─── FAQ ITEM ───────────────────────────────────────────────────── */
function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border border-white/8 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/3 transition-colors"
      >
        <span className="text-sm font-semibold text-foreground pr-4">{question}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-white/6 pt-4">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [openFAQ, setOpenFAQ] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Particles */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Particles count={50} />
      </div>

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-strong shadow-lg shadow-black/20' : 'bg-transparent'}`}
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-10 py-4 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => scrollTo('hero')} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-base bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              ResumePilot
            </span>
          </button>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7">
            {[['features', 'Features'], ['how-it-works', 'How It Works'], ['pricing', 'Pricing'], ['testimonials', 'Reviews']].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="nav-link">
                {label}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="nav-link px-3">
              Sign In
            </button>
            <motion.button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold hover:from-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-500/25 transition-all"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-white/8 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden glass-strong border-t border-white/8 px-5 py-4 space-y-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              {[['features', 'Features'], ['how-it-works', 'How It Works'], ['pricing', 'Pricing'], ['testimonials', 'Reviews']].map(([id, label]) => (
                <button key={id} onClick={() => scrollTo(id)} className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {label}
                </button>
              ))}
              <div className="flex gap-3 pt-2 border-t border-white/8">
                <button onClick={() => navigate('/login')} className="flex-1 py-2 rounded-xl glass border border-white/10 text-sm font-medium">Sign In</button>
                <button onClick={() => navigate('/dashboard')} className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold">Get Started</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section id="hero" className="relative hero-bg pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-10">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Left — copy */}
            <div>
              <motion.div
                className="hero-badge mb-6"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Zap className="w-3 h-3" />
                AI-Powered Resume Intelligence · Trusted by 50K+ job seekers
              </motion.div>

              <motion.h1
                className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl leading-tight mb-5"
                style={{ letterSpacing: '-0.03em' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.08 }}
              >
                Your Resume Gets{' '}
                <span className="gradient-text">One Chance.</span>
                <br />
                Make It{' '}
                <span className="relative inline-block">
                  AI-Optimized.
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                  />
                </span>
              </motion.h1>

              <motion.p
                className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-lg"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.16 }}
              >
                Upload your resume and get an instant AI analysis — ATS score, keyword gaps,
                recruiter feedback, and personalized fixes. In under 60 seconds.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row items-start gap-3 mb-10"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.22 }}
              >
                <motion.button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-base shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:from-indigo-600 hover:to-violet-700 transition-all glow-indigo"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Upload className="w-4 h-4" />
                  Analyze My Resume
                </motion.button>
                <motion.button
                  onClick={() => scrollTo('features')}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl glass border border-white/12 text-sm font-semibold hover:bg-white/8 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  See Features <ChevronRight className="w-4 h-4" />
                </motion.button>
              </motion.div>

              {/* Trust signals */}
              <motion.div
                className="flex items-center gap-3 flex-wrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {['No credit card required', 'Free to start', 'Results in 60s'].map((badge) => (
                  <div key={badge} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    {badge}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — dashboard mockup */}
            <div className="flex justify-center lg:justify-end">
              <HeroDashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────── */}
      <section className="relative z-10 py-10 border-y border-white/6 glass-strong">
        <div className="max-w-5xl mx-auto px-5 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 50000, suffix: '+', label: 'Resumes Analyzed' },
              { value: 92, suffix: '%', label: 'ATS Pass Rate' },
              { value: 60, suffix: 's', label: 'Analysis Time' },
              { value: 4.9, suffix: '/5', label: 'Average Rating' },
            ].map(({ value, suffix, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-3xl font-heading font-bold gradient-text">
                  <AnimatedCounter target={value} suffix={suffix} />
                </span>
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPANY TICKER ─────────────────────────────────────── */}
      <section className="py-10 overflow-hidden border-b border-white/6">
        <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6">
          Users from top companies
        </p>
        <div className="relative">
          <div className="flex animate-ticker gap-16" style={{ width: 'max-content' }}>
            {['Google', 'Microsoft', 'Meta', 'Amazon', 'Apple', 'Stripe', 'Shopify', 'Figma', 'Notion', 'Vercel',
              'Google', 'Microsoft', 'Meta', 'Amazon', 'Apple', 'Stripe', 'Shopify', 'Figma', 'Notion', 'Vercel'].map((co, i) => (
              <span key={i} className="text-muted-foreground/40 font-heading font-bold text-xl whitespace-nowrap hover:text-muted-foreground/60 transition-colors">
                {co}
              </span>
            ))}
          </div>
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────── */}
      <section id="features" className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="section-eyebrow justify-center">
              <Award className="w-3.5 h-3.5" /> Platform Features
            </p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl mb-4" style={{ letterSpacing: '-0.03em' }}>
              Everything you need to{' '}
              <span className="gradient-text">stand out</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
              Our AI engine analyzes every dimension of your resume to give you an unfair competitive edge.
            </p>
          </motion.div>

          <div className="bento-grid">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ──────────────────────────────────── */}
      <section className="relative z-10 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/10 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="section-eyebrow justify-center">
              <BarChart3 className="w-3.5 h-3.5" /> Analytics Dashboard
            </p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4" style={{ letterSpacing: '-0.03em' }}>
              See your resume's{' '}
              <span className="gradient-text">full picture</span>
            </h2>
          </motion.div>

          <motion.div
            className="card-premium p-6 md:p-8 shadow-2xl shadow-black/50 relative overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {/* Scan line overlay */}
            <div className="scan-overlay" />

            <div className="grid md:grid-cols-3 gap-6">
              {/* Score */}
              <div className="glass rounded-2xl p-5 flex flex-col items-center gap-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ATS Score</div>
                <div className="relative w-28 h-28">
                  <svg width="112" height="112" className="score-ring">
                    <circle cx="56" cy="56" r="46" stroke="oklch(1 0 0 / 8%)" strokeWidth="8" fill="none" />
                    <circle cx="56" cy="56" r="46" stroke="url(#dash-grad)" strokeWidth="8" fill="none"
                      strokeLinecap="round" strokeDasharray={2 * Math.PI * 46} strokeDashoffset={2 * Math.PI * 46 * 0.13} />
                    <defs>
                      <linearGradient id="dash-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#a78bfa" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-heading font-bold text-indigo-400">87</span>
                    <span className="text-[10px] text-muted-foreground">/ 100</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">Excellent</span>
                </div>
              </div>

              {/* Keywords */}
              <div className="glass rounded-2xl p-5">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Keyword Analysis</div>
                <div className="space-y-3">
                  {[
                    { k: 'Machine Learning', v: 94, c: '#818cf8' },
                    { k: 'Python', v: 88, c: '#a78bfa' },
                    { k: 'TensorFlow', v: 72, c: '#34d399' },
                    { k: 'Data Pipeline', v: 61, c: '#f59e0b' },
                    { k: 'Kubernetes', v: 38, c: '#f87171' },
                  ].map(({ k, v, c }) => (
                    <div key={k} className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground w-24 flex-shrink-0">{k}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${v}%`, background: c }} />
                      </div>
                      <span className="text-[10px] font-medium w-7 text-right" style={{ color: c }}>{v}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Suggestions */}
              <div className="glass rounded-2xl p-5">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> AI Suggestions
                </div>
                <div className="space-y-2.5">
                  {[
                    { text: 'Add quantified metrics to your ML experience section', type: 'high' },
                    { text: 'Include "distributed systems" in skills list', type: 'medium' },
                    { text: 'Reorder sections — Projects before Education', type: 'medium' },
                    { text: 'Add a strong professional summary at the top', type: 'low' },
                  ].map(({ text, type }) => (
                    <div key={text} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/4">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${type === 'high' ? 'bg-red-400' : type === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/8">
              {[
                { label: 'Job Match', value: '89%', color: 'text-emerald-400' },
                { label: 'Keywords Found', value: '47/52', color: 'text-indigo-400' },
                { label: 'AI Confidence', value: '96%', color: 'text-violet-400' },
                { label: 'Experience', value: 'Mid-Level', color: 'text-cyan-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <p className={`text-lg font-heading font-bold ${color}`}>{value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 py-24">
        <div className="max-w-5xl mx-auto px-5 md:px-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="section-eyebrow justify-center">
              <Zap className="w-3.5 h-3.5" /> Simple Process
            </p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl" style={{ letterSpacing: '-0.03em' }}>
              From upload to insights in <span className="gradient-text">3 steps</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-px bg-gradient-to-r from-indigo-500/30 via-violet-500/50 to-indigo-500/30" />

            {[
              { step: '01', icon: Upload, title: 'Upload Resume', desc: 'Drag & drop your PDF or DOCX resume. Takes 5 seconds.', color: 'from-indigo-500 to-violet-600' },
              { step: '02', icon: Brain, title: 'AI Analyzes', desc: 'Our AI scans 15+ dimensions including ATS signals, keywords, and formatting.', color: 'from-violet-500 to-purple-600' },
              { step: '03', icon: TrendingUp, title: 'Improve & Apply', desc: 'Get actionable fixes, export a polished report, and apply with confidence.', color: 'from-purple-500 to-pink-500' },
            ].map(({ step, icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={step}
                className="flex flex-col items-center text-center gap-4"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.12 }}
              >
                <div className="relative">
                  <motion.div
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-xl animate-float`}
                    style={{ animationDelay: `${i * 0.5}s` }}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-background border-2 border-white/20 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-muted-foreground">{step}</span>
                  </div>
                </div>
                <h3 className="font-heading font-bold text-base text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{desc}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA below */}
          <motion.div
            className="text-center mt-14"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <motion.button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:from-indigo-600 hover:to-violet-700 transition-all"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <Upload className="w-4 h-4" /> Analyze My Resume Now
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────── */}
      <section id="testimonials" className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="section-eyebrow justify-center">
              <Star className="w-3.5 h-3.5" /> Loved by Job Seekers
            </p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl" style={{ letterSpacing: '-0.03em' }}>
              Real people. <span className="gradient-text">Real results.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <TestimonialCard key={t.name} {...t} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────── */}
      <section id="pricing" className="relative z-10 py-24">
        <div className="max-w-6xl mx-auto px-5 md:px-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="section-eyebrow justify-center">
              <Sparkles className="w-3.5 h-3.5" /> Transparent Pricing
            </p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl" style={{ letterSpacing: '-0.03em' }}>
              Start free. <span className="gradient-text">Upgrade when ready.</span>
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mt-3 text-sm">
              No hidden fees. Cancel anytime. Every plan includes core AI analysis.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 pt-4">
            {pricingPlans.map((plan, i) => (
              <PricingCard
                key={plan.plan}
                {...plan}
                index={i}
                onSelect={() => navigate('/dashboard')}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24">
        <div className="max-w-3xl mx-auto px-5 md:px-10">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="section-eyebrow justify-center">
              <MessageSquare className="w-3.5 h-3.5" /> FAQ
            </p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl" style={{ letterSpacing: '-0.03em' }}>
              Common <span className="gradient-text">questions</span>
            </h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
              >
                <FAQItem
                  question={faq.q}
                  answer={faq.a}
                  isOpen={openFAQ === i}
                  onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-5 md:px-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="relative card-premium ai-border rounded-3xl p-12 md:p-16 text-center overflow-hidden"
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/8 to-violet-500/8 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-gradient-to-b from-indigo-500/20 to-transparent pointer-events-none blur-2xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-xs font-bold text-indigo-400 mb-6">
                <FileCheck className="w-3 h-3" /> Free to Start — No Credit Card Needed
              </div>

              <h2 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl mb-4" style={{ letterSpacing: '-0.03em' }}>
                Your resume gets{' '}
                <span className="gradient-text">one first impression.</span>
                <br />Make it count.
              </h2>

              <p className="text-muted-foreground text-base max-w-lg mx-auto mb-10 leading-relaxed">
                Join 50,000+ job seekers who use ResumePilot to land interviews at top companies.
                Start for free in under 60 seconds.
              </p>

              <motion.button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-base shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:from-indigo-600 hover:to-violet-700 transition-all glow-indigo"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.97 }}
              >
                <Upload className="w-5 h-5" />
                Analyze My Resume — It's Free
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/6 glass-strong">
        <div className="max-w-7xl mx-auto px-5 md:px-10 py-10 grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-base bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                ResumePilot
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              AI-powered resume intelligence that helps job seekers optimize for ATS systems and impress recruiters.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Product</p>
            <div className="space-y-2.5">
              {['Features', 'Pricing', 'How It Works', 'Dashboard'].map((link) => (
                <button key={link} onClick={() => scrollTo(link.toLowerCase().replace(' ', '-'))} className="block text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {link}
                </button>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Legal</p>
            <div className="space-y-2.5">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((link) => (
                <p key={link} className="text-xs text-muted-foreground">{link}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/6 max-w-7xl mx-auto px-5 md:px-10 py-5 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">© 2026 ResumePilot. Built with AI ♥</p>
          <p className="text-xs text-muted-foreground">Powered by Llama 3 · FastAPI · React</p>
        </div>
      </footer>
    </div>
  );
}
