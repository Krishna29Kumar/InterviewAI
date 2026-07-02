import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Github, Twitter, Cpu } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="glass-panel border-t border-darkBorder py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Slogan */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-neon-blue logo">
                IA
              </div>
              <span className="text-xl font-bold text-white">
                Interview <span className="text-neonBlue">AI</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-gray-400 max-w-sm">
              Empowering candidates to ace their job interviews with real-time generative artificial intelligence, Whisper voice transcription, and highly detailed scoring feedback.
            </p>

          </div>

          {/* Platforms */}
          <div>
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Platform</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/setup" className="text-sm text-gray-400 hover:text-white transition duration-200">
                  Interview Setup
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-gray-400 hover:text-white transition duration-200">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="text-sm text-gray-400 hover:text-white transition duration-200">
                  Performance Analytics
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-xs text-gray-500 flex items-center mt-2 sm:mt-0">
            <span>Powered by GPT-4o & Whisper</span>
            <Cpu className="w-3 h-3 ml-1 text-neonPurple" />
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
