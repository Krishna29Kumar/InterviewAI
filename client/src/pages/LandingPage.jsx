import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Mic, BarChart3, Bot, Zap, Shield, ArrowRight, Star, MessageSquare } from 'lucide-react';

const LandingPage = () => {
  const { user } = useSelector((state) => state.auth);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <div className="relative z-10 flex flex-col items-center">
      {/* HERO SECTION */}
      <section className="w-full py-12 md:py-24 lg:py-32 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-neonBlue/20 bg-neonBlue/10 text-xs font-semibold text-neonBlue tracking-wide uppercase">
            <Zap className="w-3 h-3 text-neonBlue animate-pulse" />
            <span>Next Gen AI Interview Prep</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Master Your Interviews with <br />
            <span className="text-neon-gradient">Real-Time AI Coaching</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto font-light">
            Practice mock interviews, respond via voice or text, and receive expert-grade metrics and grading within seconds using GPT-4o and Whisper transcription.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to={user ? "/setup" : "/register"}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-neon-gradient text-white font-semibold flex items-center justify-center space-x-2 shadow-neon-blue bg-neon-gradient-hover hover:scale-105 active:scale-95 transition duration-300"
            >
              <span>Practice for Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/10 bg-white/5 text-gray-200 hover:text-white hover:bg-white/10 font-semibold flex items-center justify-center transition duration-300"
            >
              Learn More
            </a>
          </div>
        </motion.div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="w-full py-16 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl font-bold text-white">Advanced Preparation Features</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Everything you need to build confidence and land your dream offer.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Feature 1 */}
            <motion.div variants={itemVariants} className="glass-panel p-8 rounded-2xl border border-darkBorder hover:border-neonBlue/30 hover:shadow-neon-blue transition duration-300 flex flex-col space-y-4">
              <div className="w-12 h-12 rounded-xl bg-neonBlue/10 border border-neonBlue/20 flex items-center justify-center text-neonBlue">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Dynamic AI Questioning</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Generates hyper-specific questions tailored to your target job title, experience level, and difficulty setting.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div variants={itemVariants} className="glass-panel p-8 rounded-2xl border border-darkBorder hover:border-neonPurple/30 hover:shadow-neon-purple transition duration-300 flex flex-col space-y-4">
              <div className="w-12 h-12 rounded-xl bg-neonPurple/10 border border-neonPurple/20 flex items-center justify-center text-neonPurple">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Whisper Speech-To-Text</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Respond using your voice. Our Whisper voice module transcribes spoken answers with industry-leading precision.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div variants={itemVariants} className="glass-panel p-8 rounded-2xl border border-darkBorder hover:border-accentPink/30 hover:shadow-lg hover:shadow-accentPink/5 transition duration-300 flex flex-col space-y-4">
              <div className="w-12 h-12 rounded-xl bg-accentPink/10 border border-accentPink/20 flex items-center justify-center text-accentPink">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Granular Score Feedback</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Get scored on technical correctness, grammar, confidence, and receive specific weakness recommendations.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="w-full py-16 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl font-bold text-white">Loved by Candidates</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Read how developers and managers are landing roles using Interview AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-panel p-8 rounded-2xl border border-darkBorder relative">
              <Star className="w-8 h-8 text-neonBlue opacity-20 absolute top-6 right-6" />
              <p className="text-gray-300 italic text-sm leading-relaxed">
                "The technical grading was incredibly accurate. It caught a major edge case error in my solution and suggested how to structure my speech using STAR. I got a Senior Front End offer at Stripe!"
              </p>
              <div className="mt-6 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-neonBlue/10 flex items-center justify-center text-neonBlue font-bold">
                  S
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Sarah Jenkins</h4>
                  <p className="text-xs text-gray-500">Senior Frontend Engineer</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-2xl border border-darkBorder relative">
              <Star className="w-8 h-8 text-neonPurple opacity-20 absolute top-6 right-6" />
              <p className="text-gray-300 italic text-sm leading-relaxed">
                "Practicing with the active voice timer helped me get over my interview jitters. The Whisper voice transcribing is super quick and let me answer naturally instead of typing."
              </p>
              <div className="mt-6 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-neonPurple/10 flex items-center justify-center text-neonPurple font-bold">
                  M
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Michael Chang</h4>
                  <p className="text-xs text-gray-500">Full Stack Developer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="w-full py-16 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl font-bold text-white">Simple, transparent pricing</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Start practicing today. Upgrade anytime as you need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free plan */}
            <div className="glass-panel p-8 rounded-2xl border border-darkBorder flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Free Practice</h3>
                <p className="text-gray-400 text-xs mt-1">Get started with foundational preparation</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-white">$0</span>
                  <span className="text-gray-500 text-sm"> / month</span>
                </div>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-neonBlue" />
                    <span>3 Mock Interviews / Month</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-neonBlue" />
                    <span>Browser Text responses</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-neonBlue" />
                    <span>Standard AI Grading Feedback</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/register"
                className="mt-8 block text-center py-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-200 transition duration-300 font-semibold"
              >
                Sign Up Free
              </Link>
            </div>

            {/* Premium plan */}
            <div className="glass-panel p-8 rounded-2xl border border-neonPurple/40 shadow-neon-purple flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-neonPurple text-white text-xs px-3 py-1 rounded-bl-lg font-semibold uppercase tracking-wider">
                Popular
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Unlimited Pro</h3>
                <p className="text-gray-400 text-xs mt-1">For serious candidates landing competitive offers</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-white">$19</span>
                  <span className="text-gray-500 text-sm"> / month</span>
                </div>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-neonPurple" />
                    <span>Unlimited AI Interviews</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-neonPurple" />
                    <span>Whisper Voice Transcription</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-neonPurple" />
                    <span>Advanced Analytics Dashboard</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-neonPurple" />
                    <span>Custom Roles & Experience Levels</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/register"
                className="mt-8 block text-center py-3 rounded-xl bg-neon-gradient text-white shadow-neon-blue font-semibold hover:scale-105 active:scale-95 transition duration-300"
              >
                Get Premium Access
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="w-full py-16 border-t border-white/5 flex flex-col items-center">
        <div className="max-w-4xl mx-auto text-center space-y-6 px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to Ace Your Next Interview?</h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
            Create your account today and experience the premium way to build interview fluency, technical depth, and overall speaking confidence.
          </p>
          <div className="pt-2">
            <Link
              to={user ? "/setup" : "/register"}
              className="inline-flex px-8 py-4 rounded-xl bg-neon-gradient text-white font-semibold items-center space-x-2 shadow-neon-blue bg-neon-gradient-hover hover:scale-105 active:scale-95 transition duration-300"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
