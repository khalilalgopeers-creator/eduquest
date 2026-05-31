import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Copy, Share2, Check, ExternalLink, MessageSquare, 
  Send, Sparkles, Plus, Award, X, FileText, Video, 
  Volume2, BookOpen, Crown, ChevronRight, CheckCircle2, UserCheck 
} from 'lucide-react';
import { Subject } from '../types';
import { cn } from '../lib/utils';

interface GroupStudyHubProps {
  subject: Subject;
  onClose: () => void;
}

interface MockBuddy {
  id: string;
  name: string;
  location: string;
  level: 'BECE' | 'WASSCE';
  avatar: string;
  color: string;
  status: 'online' | 'searching' | 'connected';
  typing?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'buddy' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
}

export default function GroupStudyHub({ subject, onClose }: GroupStudyHubProps) {
  const [activeTab, setActiveTab] = useState<'lobby' | 'invite' | 'activities'>('lobby');
  const [copied, setCopied] = useState(false);
  const [customMsg, setCustomMsg] = useState('');
  
  // Matching phase states
  const [matchingStatus, setMatchingStatus] = useState<'idle' | 'searching' | 'matched' | 'joined'>('idle');
  const [matchProgress, setMatchProgress] = useState(0);
  const [connectedBuddies, setConnectedBuddies] = useState<MockBuddy[]>([]);
  
  // Chat Room States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Set up custom share invite text
  useEffect(() => {
    const topicsStr = subject.syllabus.slice(0, 3).join(', ');
    setCustomMsg(
      `Hey! I'm using EduQuest to study "${subject.name}". Let's start a group study session covering: ${topicsStr}. Join my study room here: https://eduquest.app/room/${subject.id}-buddy`
    );
  }, [subject]);

  // Handle invite copy
  const handleCopyInvite = () => {
    navigator.clipboard.writeText(customMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Step-by-step match simulator
  const startMatching = () => {
    setMatchingStatus('searching');
    setMatchProgress(10);
    setConnectedBuddies([]);

    // Progress bar simulation
    const interval = setInterval(() => {
      setMatchProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 15;
      });
    }, 450);

    // Staged buddy online events
    setTimeout(() => {
      setConnectedBuddies([
        {
          id: '1',
          name: 'Ama Mensah',
          location: 'Accra',
          level: 'BECE',
          avatar: 'A',
          color: 'from-orange-500 to-red-500',
          status: 'connected'
        }
      ]);
    }, 1200);

    setTimeout(() => {
      setConnectedBuddies((prev) => [
        ...prev,
        {
          id: '2',
          name: 'Kwame Ofori',
          location: 'Kumasi',
          level: 'WASSCE',
          avatar: 'K',
          color: 'from-emerald-500 to-teal-500',
          status: 'connected'
        }
      ]);
    }, 2400);

    // Complete matching
    setTimeout(() => {
      setMatchingStatus('matched');
    }, 3800);
  };

  // Join simulated chat room
  const enterStudyRoom = () => {
    setMatchingStatus('joined');
    const initialMsgs: ChatMessage[] = [
      {
        id: 'sys-1',
        sender: 'system',
        senderName: 'System',
        text: `EduQuest Group Study Room for ${subject.name} initialized.`,
        timestamp: 'Just now'
      },
      {
        id: 'msg-1',
        sender: 'buddy',
        senderName: 'Ama Mensah',
        text: `Hey! Thanks for setting this up. I was hoping to review some ${subject.name} concepts today.`,
        timestamp: 'Just now'
      },
      {
        id: 'msg-2',
        sender: 'buddy',
        senderName: 'Kwame Ofori',
        text: `Awesome! Let's cover the syllabus together. Peer teaching makes it so much faster.`,
        timestamp: 'Just now'
      }
    ];
    setMessages(initialMsgs);
  };

  // Handle messages scroll
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Reply simulation based on what user typed
  const simulateReply = (userText: string) => {
    const textLower = userText.toLowerCase();
    let replyText = "That's a great observation! Let's test ourselves using the active recall technique on some syllabus topics.";
    let replier = "Ama Mensah";

    if (textLower.includes('hello') || textLower.includes('hi') || textLower.includes('hey')) {
      replyText = "Hello! Glad we joined. Which topic in the syllabus should we target first?";
      replier = "Kwame Ofori";
    } else if (textLower.includes('quiz') || textLower.includes('test') || textLower.includes('question')) {
      replyText = `Excellent idea! Let's pull up the exam-style questions for ${subject.name}. Ama, should we take turns answering them?`;
      replier = "Kwame Ofori";
    } else if (textLower.includes('hard') || textLower.includes('difficult') || textLower.includes('stuck')) {
      replyText = "No worries! Let's explain it to each other. Active teaching helps solidify our understanding of complex concepts.";
      replier = "Ama Mensah";
    } else {
      const answers = [
        "Let's look at that syllabus item together. It can definitely come up in the next exam!",
        "Active peer review is the secret. I read that comparing notes raises test scores by up to 25%!",
        "Yes, absolutely. Could you explain that part again? I want to make sure I've got it down.",
        "That lines up exactly with standard curriculum notes! Let's write down a summary."
      ];
      replyText = answers[Math.floor(Math.random() * answers.length)];
      replier = Math.random() > 0.5 ? "Ama Mensah" : "Kwame Ofori";
    }

    // typing delay simulation
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-reply-${Date.now()}`,
          sender: 'buddy',
          senderName: replier,
          text: replyText,
          timestamp: 'Just now'
        }
      ]);
    }, 1500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg = inputMessage;
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-user-${Date.now()}`,
        sender: 'user',
        senderName: 'You',
        text: userMsg,
        timestamp: 'Just now'
      }
    ]);
    setInputMessage('');
    simulateReply(userMsg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Background overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
      />

      {/* Main modal canvas */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="relative w-full max-w-4xl h-[85vh] bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl"
      >
        {/* Banner header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between gap-4 bg-gradient-to-r from-purple-500/10 via-blue-500/5 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
              <Users size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">{subject.name} Group Study Hub</h2>
                <span className="text-[10px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  COLLABORATIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">Invite, match, and practice syllabus challenges with classmates near you.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95 border border-transparent hover:border-white/5"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 py-2 border-b border-white/10 flex gap-1 bg-white/5 shrink-0 scrollbar-none overflow-x-auto">
          <TabBtn 
            active={activeTab === 'lobby'} 
            onClick={() => setActiveTab('lobby')}
            icon={<Sparkles size={14} />}
            label="Live Peer Lobby"
          />
          <TabBtn 
            active={activeTab === 'invite'} 
            onClick={() => setActiveTab('invite')}
            icon={<Share2 size={14} />}
            label="Study Room Invites"
          />
          <TabBtn 
            active={activeTab === 'activities'} 
            onClick={() => setActiveTab('activities')}
            icon={<BookOpen size={14} />}
            label="Group Study Worksheets"
          />
        </div>

        {/* Scrollable container for contents */}
        <div className="flex-grow overflow-y-auto p-6 md:p-8">
          <AnimatePresence mode="wait">
            
            {/* 1. PEER STUDY MATCH LOBBY */}
            {activeTab === 'lobby' && (
              <motion.div
                key="lobby"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="h-full flex flex-col"
              >
                {matchingStatus === 'idle' && (
                  <div className="flex-grow flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8">
                    <div className="h-20 w-20 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 border border-purple-500/20 animate-pulse">
                      <Users size={36} />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">Find Your Study Circle</h3>
                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                      Collaborative studies are proven to increase confidence and score outputs (up to +15% pass-rate on national tests like BECE/WASSCE). Connect in real-time with other active candidates to trace the syllabus together!
                    </p>
                    <button
                      onClick={startMatching}
                      className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 duration-100 transition-all flex items-center gap-2"
                    >
                      <Sparkles size={18} />
                      Scan For Study Buddies now
                    </button>
                  </div>
                )}

                {matchingStatus === 'searching' && (
                  <div className="flex-grow flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8">
                    <div className="relative mb-8">
                      <div className="h-24 w-24 rounded-full border-4 border-purple-500/20 flex items-center justify-center">
                        <Users size={32} className="text-purple-400 animate-bounce" />
                      </div>
                      <div className="absolute inset-0 border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">Scanning Academic Lobby...</h3>
                    <p className="text-xs text-slate-500 mb-6">Scanning for peers preparing for the same syllabus of {subject.name}...</p>

                    <div className="w-full bg-white/5 border border-white/10 rounded-full h-3 overflow-hidden mb-8">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                        initial={{ width: '0%' }}
                        animate={{ width: `${matchProgress}%` }}
                        transition={{ ease: "easeInOut" }}
                      />
                    </div>

                    {/* Staged Connecting cards */}
                    <div className="space-y-3 w-full text-left">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Searching Connections...</h4>
                      {connectedBuddies.length === 0 ? (
                        <p className="text-xs text-slate-600 italic">No partners resolved yet. Checking region...</p>
                      ) : (
                        connectedBuddies.map((buddy) => (
                          <motion.div 
                            key={buddy.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn("h-10 w-10 rounded-full bg-gradient-to-br flex items-center justify-center font-black text-white text-sm", buddy.color)}>
                                {buddy.avatar}
                              </div>
                              <div>
                                <h5 className="font-bold text-white text-sm">{buddy.name}</h5>
                                <p className="text-[11px] text-slate-500">{buddy.location} • {buddy.level} Candidate</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[10.5px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Ready</span>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {matchingStatus === 'matched' && (
                  <div className="flex-grow flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8">
                    <div className="h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 mb-6 scale-animation">
                      <CheckCircle2 size={36} />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">Circle Found!</h3>
                    <p className="text-sm text-slate-400 mb-6">
                      Successfully formed a 3-person study circle with <strong>Ama Mensah</strong> and <strong>Kwame Ofori</strong>. Start sharing exam notes and quizzes now!
                    </p>

                    <div className="flex gap-4 mb-8 w-full justify-center">
                      {connectedBuddies.map((buddy) => (
                        <div key={buddy.id} className="flex flex-col items-center p-4 bg-white/5 border border-white/10 rounded-2xl w-32">
                          <div className={cn("h-12 w-12 rounded-full bg-gradient-to-br flex items-center justify-center font-black text-white text-md mb-2", buddy.color)}>
                            {buddy.avatar}
                          </div>
                          <span className="text-xs font-bold text-white max-w-full truncate">{buddy.name.split(' ')[0]}</span>
                          <span className="text-[9px] text-purple-400 uppercase font-black tracking-widest mt-1">{buddy.level}</span>
                        </div>
                      ))}
                      <div className="flex flex-col items-center p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl w-32 relative">
                        <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center font-black text-white text-md mb-2">
                          You
                        </div>
                        <span className="text-xs font-bold text-purple-300">Active</span>
                        <Crown size={10} className="absolute top-2 right-2 text-yellow-400" />
                      </div>
                    </div>

                    <button
                      onClick={enterStudyRoom}
                      className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 duration-100 flex items-center justify-center gap-2"
                    >
                      <UserCheck size={18} />
                      Enter Interactive Study Room
                    </button>
                  </div>
                )}

                {matchingStatus === 'joined' && (
                  <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-6 h-full min-h-[350px]">
                    {/* Circle Info Side panel */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:col-span-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active Room Members</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center font-black text-white text-xs">
                              Y
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">You (Leader)</p>
                              <p className="text-[9px] text-purple-400 uppercase font-black tracking-widest">Active Partner</p>
                            </div>
                          </div>
                          {connectedBuddies.map(buddy => (
                            <div key={buddy.id} className="flex items-center gap-2">
                              <div className={cn("h-8 w-8 rounded-full bg-gradient-to-br flex items-center justify-center font-black text-white text-xs", buddy.color)}>
                                {buddy.avatar}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white">{buddy.name}</p>
                                <p className="text-[9px] text-slate-500">{buddy.location} • {buddy.level}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/10 space-y-2 mt-4">
                        <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-500">Subject Overview</h5>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[11px] text-slate-400">
                          Syllabus coverage in groups has proven to heighten memory markers by up to 2.5x.
                        </div>
                      </div>
                    </div>

                    {/* Chat engine */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col md:col-span-3 h-full">
                      {/* Chat Header */}
                      <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare size={16} className="text-purple-400" />
                          <span className="text-xs font-bold text-white">Group Study Chat Lounge</span>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-slate-400 font-bold border border-white/15 hover:text-white transition-all">
                            <Video size={10} className="inline mr-1" /> Call Room
                          </button>
                        </div>
                      </div>

                      {/* Chat Logs */}
                      <div className="flex-grow p-4 overflow-y-auto space-y-4 max-h-[220px] md:max-h-[260px] min-h-[160px] scrollbar-none">
                        {messages.map((msg) => {
                          if (msg.sender === 'system') {
                            return (
                              <div key={msg.id} className="text-center">
                                <span className="inline-block bg-white/5 border border-white/10 text-[10px] text-slate-400 font-semibold px-3 py-1 rounded-full">
                                  {msg.text}
                                </span>
                              </div>
                            );
                          }
                          const isUser = msg.sender === 'user';
                          return (
                            <div key={msg.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                              <div className={cn("max-w-[75%] rounded-2xl p-3.5 text-xs leading-relaxed border", 
                                isUser 
                                  ? "bg-purple-600 text-white rounded-tr-none border-purple-500/50 shadow-md shadow-purple-600/10" 
                                  : "bg-white/5 text-slate-300 rounded-tl-none border-white/10"
                              )}>
                                <p className="text-[10px] font-black uppercase tracking-wider mb-1 text-purple-300">
                                  {msg.senderName}
                                </p>
                                <p className="font-medium whitespace-pre-wrap">{msg.text}</p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Chat Input form */}
                      <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-slate-950/20 flex gap-2">
                        <input
                          type="text"
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          placeholder="Type 'quiz' to compare answers, ask a question, or share ideas..."
                          className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                        />
                        <button
                          type="submit"
                          className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all hover:scale-105 active:scale-95 shrink-0 shadow-lg shadow-purple-600/20"
                        >
                          <Send size={14} />
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* 2. CHOOSE ROOM SHARE INVITE */}
            {activeTab === 'invite' && (
              <motion.div
                key="invite"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-extrabold text-white mb-2">Prepare Group study Invites</h3>
                  <p className="text-xs text-slate-400">Share your curated target goals or active quiz lobbies directly to WhatsApp, email or Discord Study Rooms.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Curated Invite Message</h4>
                    <textarea
                      value={customMsg}
                      onChange={(e) => setCustomMsg(e.target.value)}
                      rows={5}
                      className="w-full bg-slate-950/40 border border-white/10 rounded-xl p-3.5 text-xs text-slate-300 leading-relaxed focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                    />

                    <button
                      onClick={handleCopyInvite}
                      className={cn(
                        "w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-purple-600/10",
                        copied ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-purple-600 hover:bg-purple-500 text-white"
                      )}
                    >
                      {copied ? (
                        <>
                          <Check size={14} />
                          Invite Copied to Clipboard!
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Copy Invite Code
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Why Group Sessions Succeed</h4>
                    <div className="space-y-3">
                      <BonusPoint 
                        title="Saying It Aloud (Active Recall)"
                        description="Explaining a syllabus concept to an Ama or Kwame forces your neural pathways to organize facts, yielding a 90% memory retention rate."
                      />
                      <BonusPoint 
                        title="Diverse Note Synergy"
                        description="Your peers notice different exam clues. Reviewing mock files together reveals hidden examiners' expectations."
                      />
                      <BonusPoint 
                        title="Positive Accountability"
                        description="Studying in pairs or triple circles guards against procrastination and establishes active discipline."
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. GROUP ACTIVITIES WORKSHEETS */}
            {activeTab === 'activities' && (
              <motion.div
                key="activities"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6 animate-fade-in"
              >
                <div>
                  <h3 className="text-xl font-extrabold text-white mb-2">{subject.name} Group study Exercises</h3>
                  <p className="text-xs text-slate-400">Specific drills you can print or project during group sessions to maximize comprehension.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ActivityCard 
                    step="01"
                    title="The 2-Minute Syllabus Teach-Back"
                    task={`Select a complex topic (e.g. "${subject.syllabus[Math.floor(Math.random() * subject.syllabus.length)]}"). Teach it to the group in 2 minutes. Peer partners score you on simplicity, accuracy, and core definition.`}
                    tip="The Feynman Technique: If you can't explain it simply, you don't understand it completely."
                  />
                  <ActivityCard 
                    step="02"
                    title="EduQuest Question Duel"
                    task="Start an EduQuest practice exam on your respective screens. Agree on the same 5 questions. Answer them individually, then compare your reasoning for incorrect solutions."
                    tip="Discuss the brief AI explanations together to trace common syllabus test patterns."
                  />
                  <ActivityCard 
                    step="03"
                    title="Active Recall Flashcard Relay"
                    task="Form pairs. Write down the core exam definition questions on pieces of paper. Take turns quizzing each other blindly, keeping score of consecutive correct prompts."
                    tip="Perfect for memorizing high-frequency terms, formulas, and structural processes."
                  />
                  <ActivityCard 
                    step="04"
                    title="Syllabus Mind-Map Outline"
                    task={`Collaboratively trace key links between topics. E.g., draft a continuous flow chart showing how "${subject.syllabus[0]}" relates directly to other modules.`}
                    tip="Build a spatial visual layout together in under 15 minutes."
                  />
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all relative shrink-0",
        active 
          ? "text-purple-300" 
          : "text-slate-400 hover:text-white"
      )}
    >
      {icon}
      <span>{label}</span>
      {active && (
        <motion.div 
          layoutId="active-group-tab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
        />
      )}
    </button>
  );
}

function BonusPoint({ title, description }: { title: string, description: string }) {
  return (
    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-start gap-3">
      <div className="h-6 w-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 text-xs shrink-0 mt-0.5">
        ★
      </div>
      <div>
        <h5 className="font-bold text-white text-xs mb-1">{title}</h5>
        <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function ActivityCard({ step, title, task, tip }: { step: string, title: string, task: string, tip: string }) {
  return (
    <motion.div 
      whileHover={{ y: -2, borderColor: "rgba(168, 85, 247, 0.25)" }}
      className="p-5 bg-white/5 border border-white/10 rounded-2xl flex gap-4 transition-all relative overflow-hidden"
    >
      <div className="text-xl font-black text-purple-500/20 select-none shrink-0">{step}</div>
      <div className="space-y-2">
        <h4 className="font-black text-white text-sm tracking-tight">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{task}</p>
        <div className="pt-2 border-t border-white/5 text-[10px] text-slate-500 flex items-start gap-1">
          <Sparkles size={10} className="text-purple-400 shrink-0 mt-0.5" />
          <span className="italic">💡 {tip}</span>
        </div>
      </div>
    </motion.div>
  );
}
