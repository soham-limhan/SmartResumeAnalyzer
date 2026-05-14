import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Upload, BarChart3, Brain, Target, Zap, FileCheck, MessageSquare,
  ChevronRight, ArrowRight, Shield, Search, Star
} from 'lucide-react';
import Particles from '@/components/shared/Particles';
import { Button } from '@/components/ui/button';

const features = [
  { icon: BarChart3, title: 'ATS Score Analysis', desc: 'Get an instant ATS compatibility score with detailed breakdown of how your resume performs.' },
  { icon: Brain, title: 'AI-Powered Insights', desc: 'Leverage advanced AI to uncover hidden strengths and critical improvements in your resume.' },
  { icon: Target, title: 'Skill Gap Detection', desc: 'Identify missing skills and keywords that recruiters and ATS systems are looking for.' },
  { icon: Search, title: 'Keyword Analysis', desc: 'Deep keyword frequency analysis with relevance scoring against industry standards.' },
  { icon: MessageSquare, title: 'Interview Prep', desc: 'AI-generated interview questions tailored to your specific resume and experience.' },
  { icon: Shield, title: 'Recruiter Feedback', desc: 'Get honest, professional feedback from the perspective of a senior technical recruiter.' },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-bg overflow-hidden">
      {/* Particles */}
      <div className="fixed inset-0 z-0">
        <Particles count={60} />
      </div>

      {/* Nav */}
      <motion.nav
        className="relative z-10 flex items-center justify-between px-6 md:px-12 py-4 glass-strong"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-heading font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            SmartResume
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button size="sm" onClick={() => navigate('/dashboard')} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0">
            Get Started <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-32 text-center">
        <motion.div variants={stagger} initial="hidden" animate="visible">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium text-primary mb-8">
            <Zap className="w-3 h-3" />
            AI-Powered Resume Intelligence
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-heading font-bold leading-tight mb-6">
            <span className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
              Transform Your Resume
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Into Opportunities
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your resume and get instant AI analysis with ATS scoring, skill gap detection,
            recruiter feedback, and personalized improvement recommendations.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 px-8 py-6 text-base rounded-xl glow-purple"
            >
              <Upload className="w-5 h-5 mr-2" />
              Analyze My Resume
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-6 text-base rounded-xl glass border-border/50"
            >
              See Features <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-8 md:gap-16 mt-16">
            {[
              { value: '10+', label: 'Analysis Points' },
              { value: 'AI', label: 'Powered Engine' },
              { value: '< 60s', label: 'Analysis Time' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-heading font-bold text-foreground">{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 pb-32">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Stand Out
            </span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Our AI engine analyzes every aspect of your resume to give you a competitive edge.
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              className="glass rounded-2xl p-6 hover:glow-purple transition-shadow duration-500 group"
              whileHover={{ y: -4 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:from-indigo-500/30 group-hover:to-purple-500/30 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-heading font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-32">
        <motion.div
          className="glass-strong rounded-3xl p-12 text-center glow-purple"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
            <Star className="w-3 h-3" /> Free to Use
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Ready to Optimize Your Resume?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Join thousands of professionals who use SmartResume to land their dream jobs.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 px-8 py-6 text-base rounded-xl"
          >
            <FileCheck className="w-5 h-5 mr-2" />
            Start Free Analysis
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 glass-strong">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">SmartResume © 2026</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Powered by AI • Built with ♥
          </div>
        </div>
      </footer>
    </div>
  );
}
