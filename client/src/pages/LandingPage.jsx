import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import {
  Mic, BarChart3, Bot, Zap, ArrowRight,
  BrainCircuit, Trophy, Target, Users,
  Sparkles, TrendingUp, Shield
} from "lucide-react";

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut", delay } },
});

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function StatCard({ value, label, icon: Icon, colorClass }) {
  return (
    <motion.div
      variants={cardVariant}
      className="glass-panel rounded-2xl p-6 flex flex-col items-center text-center border border-white/5 hover:border-white/10 transition-all duration-300"
    >
      <div className={"w-12 h-12 rounded-xl flex items-center justify-center mb-3 " + colorClass}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-3xl font-extrabold text-white mb-1">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
    </motion.div>
  );
}

function FeatureCard({ icon: Icon, title, desc, iconClass, borderClass }) {
  return (
    <motion.div
      variants={cardVariant}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className={"glass-panel rounded-2xl p-7 border border-white/5 " + borderClass + " transition-all duration-300 flex flex-col gap-4 group cursor-default"}
    >
      <div className={"w-12 h-12 rounded-xl flex items-center justify-center " + iconClass + " group-hover:scale-110 transition-transform duration-300"}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

const LandingPage = () => {
  const { user } = useSelector((state) => state.auth);

  const features = [
    {
      icon: Bot, title: "Dynamic AI Questioning",
      iconClass: "bg-neonBlue/10 border border-neonBlue/20 text-neonBlue",
      borderClass: "hover:border-neonBlue/30",
      desc: "Generates hyper-specific questions tailored to your target role, experience level, company, and difficulty preference.",
    },
    {
      icon: Mic, title: "Voice-Powered Answers",
      iconClass: "bg-neonPurple/10 border border-neonPurple/20 text-neonPurple",
      borderClass: "hover:border-neonPurple/30",
      desc: "Respond naturally using your voice. Whisper transcribes spoken answers with industry-leading accuracy in real time.",
    },
    {
      icon: BarChart3, title: "Granular Score Feedback",
      iconClass: "bg-accentPink/10 border border-accentPink/20 text-accentPink",
      borderClass: "hover:border-accentPink/30",
      desc: "Scored across technical correctness, communication, grammar, and confidence with actionable improvement tips.",
    },
    {
      icon: BrainCircuit, title: "Company-Specific Prep",
      iconClass: "bg-neonBlue/10 border border-neonBlue/20 text-neonBlue",
      borderClass: "hover:border-neonBlue/30",
      desc: "Choose from top companies like Google, Amazon, and Meta to get questions modeled on their real interview culture.",
    },
    {
      icon: TrendingUp, title: "Performance Analytics",
      iconClass: "bg-neonPurple/10 border border-neonPurple/20 text-neonPurple",
      borderClass: "hover:border-neonPurple/30",
      desc: "Track every session across time with a rich analytics dashboard. See where you improve and where to focus next.",
    },
    {
      icon: Shield, title: "Private & Secure",
      iconClass: "bg-accentPink/10 border border-accentPink/20 text-accentPink",
      borderClass: "hover:border-accentPink/30",
      desc: "Your responses and session data are encrypted and private, never shared or used for any other purpose.",
    },
  ];

  return (
    <div className="relative z-10 flex flex-col items-center w-full overflow-x-hidden">

      {/* HERO */}
      <section className="w-full min-h-[90vh] flex flex-col items-center justify-center text-center px-4 py-20 relative">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-3xl bg-neonBlue/5" />
        <div className="pointer-events-none absolute bottom-10 left-10 w-72 h-72 rounded-full blur-3xl bg-neonPurple/5" />

        <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-4xl mx-auto space-y-7">
          <motion.div variants={fadeUp()} className="flex justify-center">
            <div className="hero-badge inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-neonBlue/25 bg-neonBlue/10 text-xs font-semibold tracking-wider uppercase">
              <Zap className="w-3 h-3 text-neonBlue animate-pulse" />
              <span>Next-Gen AI Interview Prep</span>
            </div>
          </motion.div>

          <motion.h1 variants={fadeUp(0.1)} className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
            Ace Every Interview<br />
            <span className="text-neon-gradient">Powered by AI</span>
          </motion.h1>

          <motion.p variants={fadeUp(0.2)} className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
            Practice realistic mock interviews using GPT-4o questions, answer by voice or text,
            and get expert-grade scoring feedback in seconds, tailored to your dream company.
          </motion.p>

          <motion.div variants={fadeUp(0.3)} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to={user ? "/setup" : "/register"}
              className="group w-full sm:w-auto px-8 py-4 rounded-xl bg-neon-gradient text-white font-semibold flex items-center justify-center space-x-2 shadow-neon-blue hover:scale-105 active:scale-95 transition duration-300"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Practicing Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section id="features" className="w-full py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp()} className="text-center space-y-3 mb-14">
            <span className="text-xs font-semibold text-neonBlue uppercase tracking-widest">What You Get</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Everything You Need to Land the Offer</h2>
            <p className="text-gray-400 max-w-xl mx-auto">A complete interview preparation system. No fluff, just the tools that actually move the needle.</p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => <FeatureCard key={f.title} {...f} />)}
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
