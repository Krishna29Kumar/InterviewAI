import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, MessageSquare, AlertTriangle, Send, Loader2 } from 'lucide-react';

const ContactPage = () => {
  const [type, setType] = useState('general');
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      await new Promise((res) => setTimeout(res, 900));
      toast.success(type === 'complaint' ? 'Complaint submitted. We will review it shortly.' : 'Message sent! We will get back to you soon.');
      setForm({ name: '', email: '', subject: '', message: '' });
      setType('general');
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="relative z-10 max-w-2xl mx-auto px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neonBlue/25 bg-neonBlue/10 text-neonBlue text-[11px] font-bold uppercase tracking-widest mb-5">
          <Mail className="w-3.5 h-3.5" />
          Get In Touch
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">Contact Us</h1>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Questions, feedback, or something not working right? Let us know below.
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        onSubmit={handleSubmit}
        className="glass-panel rounded-2xl border border-darkBorder p-6 md:p-8 space-y-5"
      >
        <div>
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 block">
            What is this about?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('general')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                type === 'general'
                  ? 'bg-neonBlue/10 border-neonBlue/40 text-neonBlue'
                  : 'bg-white/3 border-darkBorder text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              General Inquiry
            </button>
            <button
              type="button"
              onClick={() => setType('complaint')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                type === 'complaint'
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                  : 'bg-white/3 border-darkBorder text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              File a Complaint
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 block">Name *</label>
            <input
              type="text" name="name" value={form.name} onChange={handleChange}
              placeholder="Your full name"
              className="w-full px-4 py-3 rounded-xl text-sm text-gray-200 glass-input focus:ring-1 focus:ring-neonBlue/30"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 block">Email *</label>
            <input
              type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl text-sm text-gray-200 glass-input focus:ring-1 focus:ring-neonBlue/30"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 block">
            {type === 'complaint' ? 'Issue Summary' : 'Subject'}
          </label>
          <input
            type="text" name="subject" value={form.subject} onChange={handleChange}
            placeholder={type === 'complaint' ? 'Briefly describe the issue' : 'What is this regarding?'}
            className="w-full px-4 py-3 rounded-xl text-sm text-gray-200 glass-input focus:ring-1 focus:ring-neonBlue/30"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 block">
            {type === 'complaint' ? 'Complaint Details *' : 'Message *'}
          </label>
          <textarea
            name="message" value={form.message} onChange={handleChange} rows={5}
            placeholder={type === 'complaint' ? 'Please describe what happened, including any relevant details (page, session, time, etc.)' : 'Write your message here...'}
            className="w-full px-4 py-3 rounded-xl text-sm text-gray-200 glass-input resize-none focus:ring-1 focus:ring-neonBlue/30"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.01] disabled:opacity-60 disabled:pointer-events-none ${
            type === 'complaint' ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white' : 'bg-neon-gradient text-white'
          }`}
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
          ) : (
            <><Send className="w-4 h-4" /> {type === 'complaint' ? 'Submit Complaint' : 'Send Message'}</>
          )}
        </button>
      </motion.form>
    </div>
  );
};

export default ContactPage;
