import { motion } from 'motion/react';
import { Sparkles, GraduationCap, ChevronRight, Brain, History, Zap } from 'lucide-react';

interface HeroProps {
  onStart: () => void;
  onViewProgress: () => void;
  onViewStudyGuide: () => void;
  onViewStudyPlanner: () => void;
  onStartAIDuel: () => void;
  onViewPastQuestions: () => void;
  onStartBECEQuickPractice: () => void;
}

export default function Hero({ onStart, onViewProgress, onViewStudyGuide, onViewStudyPlanner, onStartAIDuel, onViewPastQuestions, onStartBECEQuickPractice }: HeroProps) {
  return (
    <div className="relative pt-20 pb-16 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
          <Sparkles size={16} />
          <span>The Ultimate Exam Prep Experience</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tight">
          Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">BECE & WASSCE</span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-xl text-slate-400 mb-12 leading-relaxed">
          Prepare for your future with interactive 3D learning, expert-curated questions, 
          and real-time progress tracking. Simple English, advanced results.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/20 flex items-center gap-2 transition-all"
          >
            <GraduationCap size={24} />
            Start Learning
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStartBECEQuickPractice}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-green-600/20 flex items-center gap-2 transition-all"
          >
            <Zap size={24} />
            BEC QUESTION
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onViewStudyGuide}
            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold text-lg backdrop-blur-md flex items-center gap-2 transition-all"
          >
            Study Guide
            <ChevronRight size={20} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onViewProgress}
            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold text-lg backdrop-blur-md flex items-center gap-2 transition-all"
          >
            My Progress
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStartAIDuel}
            className="px-8 py-4 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-2xl font-bold text-lg backdrop-blur-md flex items-center gap-2 transition-all"
          >
            <Brain size={24} />
            Duel AI
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onViewPastQuestions}
            className="px-8 py-4 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-2xl font-bold text-lg backdrop-blur-md flex items-center gap-2 transition-all"
          >
            <History size={24} />
            Past Questions
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onViewStudyPlanner}
            className="px-8 py-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 text-white border border-blue-500/30 rounded-2xl font-bold text-lg backdrop-blur-md flex items-center gap-2 transition-all"
          >
            AI Study Planner
            <Sparkles size={20} className="text-blue-400" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
