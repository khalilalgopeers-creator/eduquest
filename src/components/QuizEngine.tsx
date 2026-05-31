import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, ArrowRight, RotateCcw, Home, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Subject, Question } from '../types';
import { cn } from '../lib/utils';
import { generateAIQuiz } from '../lib/gemini';

interface QuizEngineProps {
  subject: Subject;
  isAdvanced?: boolean;
  isAI?: boolean;
  initialQuestions?: Question[];
  year?: number;
  examType?: string;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export default function QuizEngine({ 
  subject, 
  isAdvanced = false, 
  isAI = false, 
  initialQuestions,
  year,
  examType,
  onComplete, 
  onExit 
}: QuizEngineProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions || []);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(isAI && !initialQuestions);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuestions) {
      setQuestions(initialQuestions);
      setIsLoading(false);
    } else if (isAI) {
      handleGenerateAIQuiz();
    } else {
      setQuestions(isAdvanced && subject.advancedQuestions ? subject.advancedQuestions : subject.questions);
    }
  }, [isAI, isAdvanced, subject, initialQuestions]);

  const handleGenerateAIQuiz = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const aiQuestions = await generateAIQuiz(subject.name, subject.syllabus, isAdvanced);
      setQuestions(aiQuestions);
      setCurrentQuestionIndex(0);
      setScore(0);
      setIsAnswered(false);
      setSelectedOption(null);
      setShowResult(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate AI quiz.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const handleConfirm = () => {
    if (selectedOption === null || isAnswered) return;
    
    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore(s => s + 1);
    }
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
      onComplete(score);
      if (score >= questions.length / 2) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-20 text-center">
        <div className="h-20 w-20 rounded-3xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6 animate-pulse">
          <Sparkles size={40} />
        </div>
        <h2 className="text-2xl font-black text-white mb-4">Generating AI Quiz...</h2>
        <p className="text-slate-400 max-w-md mb-8">
          Our AI tutor is crafting personalized questions based on the {subject.name} syllabus and your chosen difficulty.
        </p>
        <Loader2 size={32} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 text-center">
        <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Oops! Something went wrong</h2>
        <p className="text-slate-400 mb-8">{error}</p>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleGenerateAIQuiz}
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl transition-colors"
          >
            <RotateCcw size={18} /> Retry
          </button>
          <button 
            onClick={onExit}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl transition-colors"
          >
            <Home size={18} /> Home
          </button>
        </div>
      </div>
    );
  }

  if (showResult) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 text-center"
      >
        <h2 className="text-3xl font-bold text-white mb-4">Quiz Finished!</h2>
        <div className="text-sm font-bold text-indigo-400 mb-2 uppercase tracking-widest">
          {isAI ? 'AI Generated' : (isAdvanced ? 'Advanced Level' : 'Standard Level')}
        </div>
        <div className="text-6xl font-black text-blue-400 mb-6">
          {Math.round((score / questions.length) * 100)}%
        </div>
        <p className="text-slate-300 mb-8">
          You got {score} out of {questions.length} questions correct in {subject.name}.
        </p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => {
                setCurrentQuestionIndex(0);
                setScore(0);
                setShowResult(false);
                setSelectedOption(null);
                setIsAnswered(false);
              }}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl transition-colors"
            >
              <RotateCcw size={18} /> Retry
            </button>
            <button 
              onClick={onExit}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl transition-colors"
            >
              <Home size={18} /> Home
            </button>
          </div>
          <button 
            onClick={handleGenerateAIQuiz}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-4 rounded-xl transition-all font-bold shadow-lg shadow-purple-600/20"
          >
            <Sparkles size={18} /> Generate New AI Quiz
          </button>
        </div>
      </motion.div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="p-2 rounded-full hover:bg-white/10 text-slate-400">
            <X size={24} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">{subject.name} Quiz</h2>
            <div className="flex gap-2">
              {year && examType && <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">{year} {examType}</span>}
              {isAdvanced && <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">Advanced Mode</span>}
              {isAI && <span className="text-[10px] font-black text-purple-400 uppercase tracking-tighter flex items-center gap-1"><Sparkles size={8} /> AI Mode</span>}
            </div>
          </div>
        </div>
        <div className="text-sm font-medium text-slate-400">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </div>

      <div className="w-full bg-white/10 h-2 rounded-full mb-8 overflow-hidden">
        <motion.div 
          className={cn("h-full", isAdvanced ? "bg-indigo-500" : "bg-blue-500")}
          initial={{ width: 0 }}
          animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10"
        >
          <h3 className="text-2xl font-medium text-white mb-8 leading-relaxed">
            {currentQuestion.text}
          </h3>

          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrect = isAnswered && index === currentQuestion.correctAnswer;
              const isWrong = isAnswered && isSelected && index !== currentQuestion.correctAnswer;

              return (
                <button
                  key={index}
                  disabled={isAnswered}
                  onClick={() => handleOptionSelect(index)}
                  className={cn(
                    "w-full p-5 rounded-2xl text-left transition-all flex items-center justify-between border-2",
                    !isAnswered && isSelected ? (isAdvanced ? "border-indigo-500 bg-indigo-500/10" : "border-blue-500 bg-blue-500/10") : "border-transparent bg-white/5 hover:bg-white/10",
                    isCorrect && "border-green-500 bg-green-500/20",
                    isWrong && "border-red-500 bg-red-500/20"
                  )}
                >
                  <span className={cn("text-lg", isSelected || isCorrect ? "text-white" : "text-slate-300")}>
                    {option}
                  </span>
                  {isCorrect && <Check className="text-green-500" size={24} />}
                  {isWrong && <X className="text-red-500" size={24} />}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("mt-8 p-4 rounded-xl border", isAdvanced ? "bg-indigo-500/10 border-indigo-500/20" : "bg-blue-500/10 border-blue-500/20")}
            >
              <p className={cn("text-sm italic", isAdvanced ? "text-indigo-200" : "text-blue-200")}>
                <span className="font-bold">Explanation:</span> {currentQuestion.explanation}
              </p>
            </motion.div>
          )}

          <div className="mt-8 flex justify-end">
            {!isAnswered ? (
              <button
                disabled={selectedOption === null}
                onClick={handleConfirm}
                className={cn("px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all", isAdvanced ? "bg-indigo-600 hover:bg-indigo-500" : "bg-blue-600 hover:bg-blue-500")}
              >
                Confirm Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-white hover:bg-slate-100 text-slate-950 rounded-xl font-bold transition-all flex items-center gap-2"
              >
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
