import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Target, Users, Shield, Code2, Zap, ArrowRight } from 'lucide-react';

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay } },
});

const stagger = (s = 0.1) => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: s } },
});

const values = [
  { icon: Target, title: 'Our Mission', desc: 'To make high-quality interview preparation accessible to every BTech CSE student, regardless of their background or resources — completely free.' },
  { icon: Shield, title: 'Integrity First', desc: 'Real proctoring, real accountability. We built strict verification so your practice sessions actually reflect the pressure of a real interview.' },
  { icon: Zap, title: 'AI-Powered', desc: 'Ollama-driven question generation and feedback, YOLOv8n pose detection, and browser-native speech tools — all working together in real time.' },
  { icon: Users, title: 'Built for Students', desc: 'Every feature — from company-specific DSA sets to detailed analytics — is designed around what actually helps candidates land the offer.' },
];

const stack = [
  'React + Vite', 'Node.js / Express', 'MongoDB', 'Ollama (LLM)',
  'YOLOv8n Pose Detection', 'Web Speech API', 'Socket.IO', 'FastAPI',
];

const AboutPage = () => {
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="relative z-10">
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <motion.div initial="hidden" animate="visible" variants={stagger(0.1)}>
          <motion.div variants={fadeUp(0)} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neonBlue/25 bg-neonBlue/10 text-neonBlue text-[11px] font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            About InterviewAI
          </motion.div>
          <motion.h1 variants={fadeUp(0.1)} className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
            Helping students prepare like it's the real thing
          </motion.h1>
          <motion.p variants={fadeUp(0.2)} className="text-gray-400 text-base leading-relaxed max-w-2xl mx-auto">
            InterviewAI is a free, AI-powered mock interview platform built for BTech CSE students
            preparing for placements. Practice real questions, get honest AI feedback, and train
            under the same pressure you'll face in an actual interview room.
          </motion.p>
        </motion.div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger(0.08)} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {values.map(({ icon: Icon, title, desc }, i) => (
            <motion.div key={title} variants={fadeUp(i * 0.05)} className="glass-panel rounded-2xl border border-darkBorder p-6">
              <div className="w-11 h-11 rounded-xl bg-neon-gradient flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-20 text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp()}>
          <div className="inline-flex items-center gap-2 text-neonPurple text-xs font-bold uppercase tracking-widest mb-4">
            <Code2 className="w-3.5 h-3.5" />
            Built With
          </div>
          <div className="flex flex-wrap gap-2.5 justify-center">
            {stack.map((t) => (
              <span key={t} className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
                {t}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-20 text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp()}>
          <div className="inline-flex items-center gap-2 text-neonBlue text-xs font-bold uppercase tracking-widest mb-4">
            <Users className="w-3.5 h-3.5" />
            Made By
          </div>
          <div className="flex flex-wrap gap-4 justify-center mb-5">
            {['Krishna Kumar', 'Arth Rana', 'Janvi Sehrawat'].map((name) => (
              <div key={name} className="glass-panel rounded-xl border border-darkBorder px-6 py-4">
                <p className="text-sm font-bold text-white">{name}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mb-1">Second Year B.Tech Students</p>
          <a href="mailto:xeno10525@gmail.com" className="text-xs text-neonBlue hover:underline">
            xeno10525@gmail.com
          </a>
        </motion.div>
      </section>

      <section className="max-w-2xl mx-auto px-4 pb-24 text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp()} className="glass-panel rounded-2xl border border-darkBorder p-10">
          <h2 className="text-2xl font-extrabold text-white mb-3">Ready to start practicing?</h2>
          <p className="text-sm text-gray-400 mb-6">No signup fees, no hidden limits — just practice.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-neon-gradient text-white font-bold text-sm hover:scale-[1.03] transition">
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default AboutPage;
