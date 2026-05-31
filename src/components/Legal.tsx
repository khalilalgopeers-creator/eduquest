import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Shield, FileText, HelpCircle, ChevronRight, Mail, MessageCircle, ExternalLink, X, Send, User as UserIcon, Bot } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';

interface LegalProps {
  onBack: () => void;
  initialTab?: 'privacy' | 'terms' | 'help';
}

export default function Legal({ onBack, initialTab = 'help' }: LegalProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="max-w-4xl mx-auto">
      <AnimatePresence>
        {showChat && (
          <ChatOverlay onClose={() => setShowChat(false)} />
        )}
      </AnimatePresence>

      <div className="mb-8 flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-3xl font-black text-white tracking-tight">Legal & Help</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="space-y-2">
          <TabButton 
            active={activeTab === 'help'} 
            onClick={() => setActiveTab('help')}
            icon={<HelpCircle size={18} />}
            label="Help Center"
          />
          <TabButton 
            active={activeTab === 'privacy'} 
            onClick={() => setActiveTab('privacy')}
            icon={<Shield size={18} />}
            label="Privacy Policy"
          />
          <TabButton 
            active={activeTab === 'terms'} 
            onClick={() => setActiveTab('terms')}
            icon={<FileText size={18} />}
            label="Terms of Use"
          />
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl"
          >
            {activeTab === 'help' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">How can we help?</h3>
                  <p className="text-slate-400 mb-8">Search our help center or contact our support team.</p>
                  
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                      <HelpCard 
                        icon={<Mail className="text-blue-400" />}
                        title="Email Support"
                        description="Get help via email within 24 hours."
                        action="support@eduquest.com"
                        onClick={() => window.location.href = 'mailto:support@eduquest.com'}
                      />
                      <HelpCard 
                        icon={<MessageCircle className="text-purple-400" />}
                        title="Live Chat"
                        description="Chat with our AI tutor for instant help."
                        action="Start Chat"
                        onClick={() => setShowChat(true)}
                      />
                    </div>

                  <h4 className="text-lg font-bold text-white mb-4">Frequently Asked Questions</h4>
                  <div className="space-y-4">
                    <FAQItem 
                      question="How do I reset my progress?"
                      answer="You can reset your progress for a specific subject in the Settings > Account section."
                    />
                    <FAQItem 
                      question="Is EduQuest free to use?"
                      answer="Yes, EduQuest is free for all students preparing for BECE and WASSCE exams."
                    />
                    <FAQItem 
                      question="Can I use EduQuest offline?"
                      answer="Currently, EduQuest requires an internet connection to access AI features and sync your progress."
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-black text-white mb-6">Privacy Policy</h3>
                  <div className="prose prose-invert max-w-none text-slate-400 space-y-6">
                    <p>Last updated: April 2, 2026</p>
                    <section>
                      <h4 className="text-white font-bold mb-2">1. Information We Collect</h4>
                      <p>We collect information you provide directly to us, such as when you create an account, participate in a quiz, or communicate with us.</p>
                    </section>
                    <section>
                      <h4 className="text-white font-bold mb-2">2. How We Use Your Information</h4>
                      <p>We use the information we collect to provide, maintain, and improve our services, including to personalize your learning experience.</p>
                    </section>
                    <section>
                      <h4 className="text-white font-bold mb-2">3. AI Data Usage</h4>
                      <p>Your interactions with our AI tutor are used to improve the accuracy and relevance of the educational content provided.</p>
                    </section>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'terms' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-black text-white mb-6">Terms of Use</h3>
                  <div className="prose prose-invert max-w-none text-slate-400 space-y-6">
                    <p>Last updated: April 2, 2026</p>
                    <section>
                      <h4 className="text-white font-bold mb-2">1. Acceptance of Terms</h4>
                      <p>By accessing or using EduQuest, you agree to be bound by these Terms of Use and all applicable laws and regulations.</p>
                    </section>
                    <section>
                      <h4 className="text-white font-bold mb-2">2. Use License</h4>
                      <p>Permission is granted to temporarily use the materials on EduQuest for personal, non-commercial educational purposes only.</p>
                    </section>
                    <section>
                      <h4 className="text-white font-bold mb-2">3. Disclaimer</h4>
                      <p>The materials on EduQuest are provided on an 'as is' basis. EduQuest makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.</p>
                    </section>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
        active ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:bg-white/5 hover:text-white"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function HelpCard({ icon, title, description, action, onClick }: { icon: React.ReactNode, title: string, description: string, action: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group cursor-pointer"
    >
      <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h4 className="font-bold text-white mb-2">{title}</h4>
      <p className="text-xs text-slate-500 mb-4">{description}</p>
      <button className="text-sm font-bold text-blue-400 flex items-center gap-1 hover:gap-2 transition-all">
        {action} <ChevronRight size={14} />
      </button>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors text-left"
      >
        <span className="font-bold text-slate-200">{question}</span>
        <ChevronRight size={18} className={cn("text-slate-600 transition-transform", isOpen && "rotate-90")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 text-sm text-slate-400 bg-white/5 border-t border-white/10">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChatOverlay({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: 'Hello! I am your EduQuest AI tutor. How can I help you with your studies today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are EduQuest AI, a friendly and helpful academic tutor for West African students preparing for BECE and WASSCE exams. Keep your explanations simple, clear, and encouraging. Use simple English.",
        },
      });

      const response = await chat.sendMessage({ message: userMessage });
      setMessages(prev => [...prev, { role: 'model', text: response.text || "I'm sorry, I couldn't process that. Could you try again?" }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm having a bit of trouble connecting right now. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px]"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Bot size={24} />
            </div>
            <div>
              <h3 className="font-bold text-white">AI Tutor</h3>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Online</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
        >
          {messages.map((msg, i) => (
            <div 
              key={i}
              className={cn(
                "flex gap-3 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                msg.role === 'user' ? "bg-blue-600" : "bg-white/10"
              )}>
                {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
              </div>
              <div className={cn(
                "p-3 rounded-2xl text-sm",
                msg.role === 'user' 
                  ? "bg-blue-600 text-white rounded-tr-none" 
                  : "bg-white/5 text-slate-200 border border-white/10 rounded-tl-none"
              )}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Bot size={16} />
              </div>
              <div className="p-3 rounded-2xl text-sm bg-white/5 text-slate-400 border border-white/10 rounded-tl-none flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your studies..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
