import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, User, Trophy, Timer, AlertCircle, CheckCircle2, XCircle, ArrowRight, Brain, Zap } from 'lucide-react';
import { Subject, Question } from '../types';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';

interface AIVsHumanQuizProps {
  subject: Subject;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export default function AIVsHumanQuiz({ subject, onComplete, onExit }: AIVsHumanQuizProps) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [humanScore, setHumanScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [humanAnswer, setHumanAnswer] = useState<number | null>(null);
  const [aiAnswer, setAiAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isGameOver, setIsGameOver] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  
  const questions = subject.questions.slice(0, 5); // Use first 5 questions for the duel
  const currentQuestion = questions[currentQuestionIdx];
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startQuestion();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [currentQuestionIdx]);

  const startQuestion = () => {
    setTimeLeft(15);
    setHumanAnswer(null);
    setAiAnswer(null);
    setShowExplanation(false);
    setAiThinking(true);

    // Human Timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // AI Opponent Logic
    // AI answers between 3 and 8 seconds
    const aiDelay = Math.random() * 5000 + 3000;
    aiTimerRef.current = setTimeout(() => {
      const isCorrect = Math.random() > 0.15; // 85% accuracy
      const answer = isCorrect ? currentQuestion.correctAnswer : (currentQuestion.correctAnswer + 1) % 4;
      setAiAnswer(answer);
      setAiThinking(false);
      if (answer === currentQuestion.correctAnswer) {
        setAiScore(prev => prev + 1);
      }
    }, aiDelay);
  };

  const handleTimeUp = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (humanAnswer === null) {
      setHumanAnswer(-1); // Mark as missed
    }
    setShowExplanation(true);
  };

  const handleHumanAnswer = (idx: number) => {
    if (humanAnswer !== null || showExplanation) return;
    
    setHumanAnswer(idx);
    if (idx === currentQuestion.correctAnswer) {
      setHumanScore(prev => prev + 1);
    }
    
    // If AI hasn't answered yet, it might answer soon or we wait for timer
    // For a better feel, let's just show results after both answered or time up
  };

  // Auto-advance when both answered
  useEffect(() => {
    if (humanAnswer !== null && aiAnswer !== null && !showExplanation) {
      if (timerRef.current) clearInterval(timerRef.current);
      setShowExplanation(true);
    }
  }, [humanAnswer, aiAnswer]);

  const nextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    setIsGameOver(true);
    if (humanScore > aiScore) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#8b5cf6', '#ffffff']
      });
    }
    onComplete(Math.round((humanScore / questions.length) * 100));
  };

  if (isGameOver) {
    const result = humanScore > aiScore ? 'victory' : humanScore < aiScore ? 'defeat' : 'draw';
    
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/5 border border-white/10 rounded-[40px] p-12 backdrop-blur-xl"
        >
          <div className="flex justify-center mb-8">
            <div className={cn(
              "h-24 w-24 rounded-3xl flex items-center justify-center text-white shadow-2xl",
              result === 'victory' ? "bg-yellow-500 shadow-yellow-500/20" : 
              result === 'defeat' ? "bg-red-500 shadow-red-500/20" : 
              "bg-blue-500 shadow-blue-500/20"
            )}>
              {result === 'victory' ? <Trophy size={48} /> : <Zap size={48} />}
            </div>
          </div>

          <h2 className="text-5xl font-black text-white mb-4 uppercase tracking-tighter">
            {result === 'victory' ? 'Victory!' : result === 'defeat' ? 'Defeated!' : 'It\'s a Draw!'}
          </h2>
          <p className="text-slate-400 text-lg mb-12">
            {result === 'victory' ? 'You outsmarted the AI! Incredible performance.' : 
             result === 'defeat' ? 'The AI was faster this time. Keep practicing!' : 
             'A perfect match! You are as sharp as the AI.'}
          </p>

          <div className="grid grid-cols-2 gap-8 mb-12">
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Your Score</div>
              <div className="text-4xl font-black text-white">{humanScore} / {questions.length}</div>
            </div>
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">AI Score</div>
              <div className="text-4xl font-black text-white">{aiScore} / {questions.length}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={onExit}
              className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/10 transition-all"
            >
              Back to Subjects
            </button>
            <button 
              onClick={() => {
                setCurrentQuestionIdx(0);
                setHumanScore(0);
                setAiScore(0);
                setIsGameOver(false);
              }}
              className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all"
            >
              Rematch
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header / Scoreboard */}
      <div className="grid grid-cols-3 items-center gap-4 mb-8">
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
          <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
            <User size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Human</div>
            <div className="text-xl font-black text-white">{humanScore}</div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className={cn(
            "h-16 w-16 rounded-full border-4 flex items-center justify-center text-xl font-black transition-all",
            timeLeft <= 5 ? "border-red-500 text-red-500 animate-pulse" : "border-blue-500 text-blue-400"
          )}>
            {timeLeft}
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Time Left</div>
        </div>

        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md justify-end text-right">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Tutor</div>
            <div className="text-xl font-black text-white">{aiScore}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
            <Brain size={20} />
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-2 gap-4 mb-12">
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(humanScore / questions.length) * 100}%` }}
            className="h-full bg-blue-500"
          />
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden rotate-180">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(aiScore / questions.length) * 100}%` }}
            className="h-full bg-purple-500"
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
          <motion.div 
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            key={currentQuestionIdx}
            transition={{ duration: 15, ease: "linear" }}
            className="h-full bg-blue-500"
          />
        </div>

        <div className="mb-8">
          <span className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
            Question {currentQuestionIdx + 1} of {questions.length}
          </span>
          <h3 className="text-2xl md:text-3xl font-bold text-white mt-6 leading-tight">
            {currentQuestion.text}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion.options.map((option, idx) => {
            const isHumanSelected = humanAnswer === idx;
            const isAiSelected = aiAnswer === idx;
            const isCorrect = currentQuestion.correctAnswer === idx;
            
            return (
              <button
                key={idx}
                onClick={() => handleHumanAnswer(idx)}
                disabled={showExplanation}
                className={cn(
                  "relative p-6 rounded-3xl text-left transition-all border-2 group",
                  !showExplanation && isHumanSelected ? "bg-blue-600/20 border-blue-500 text-white" :
                  !showExplanation ? "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20" :
                  isCorrect ? "bg-green-500/20 border-green-500 text-green-400" :
                  isHumanSelected && !isCorrect ? "bg-red-500/20 border-red-500 text-red-400" :
                  "bg-white/5 border-white/5 text-slate-500 opacity-50"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-8 w-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 border-2",
                    isHumanSelected ? "bg-current text-slate-900 border-transparent" : "border-current"
                  )}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>

                {/* AI Indicator */}
                <AnimatePresence>
                  {isAiSelected && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-purple-600 border-2 border-slate-900 flex items-center justify-center text-white shadow-lg"
                      title="AI chose this"
                    >
                      <Brain size={14} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>

        {/* AI Thinking Indicator */}
        <AnimatePresence>
          {aiThinking && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-8 flex items-center gap-3 text-purple-400 text-sm font-bold"
            >
              <div className="flex gap-1">
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="h-1.5 w-1.5 rounded-full bg-current" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-current" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-current" />
              </div>
              AI is thinking...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Explanation */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-12 pt-8 border-t border-white/10"
            >
              <div className="flex items-start gap-4 p-6 rounded-3xl bg-white/5 border border-white/10">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-2">Explanation</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{currentQuestion.explanation}</p>
                </div>
              </div>

              <button 
                onClick={nextQuestion}
                className="w-full mt-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/20"
              >
                {currentQuestionIdx < questions.length - 1 ? 'Next Round' : 'See Final Results'}
                <ArrowRight size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button 
        onClick={onExit}
        className="mt-8 text-slate-500 hover:text-white transition-colors text-sm font-bold flex items-center gap-2 mx-auto"
      >
        <XCircle size={16} />
        Forfeit Duel
      </button>
    </div>
  );
}
