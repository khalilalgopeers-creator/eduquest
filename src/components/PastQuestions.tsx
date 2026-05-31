import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, Calendar, GraduationCap, ChevronRight, Loader2, AlertCircle, Play, ArrowLeft } from 'lucide-react';
import { Subject, Question, ExaminationType } from '../types';
import { subjects } from '../data/subjects';
import { generatePastQuestions } from '../lib/gemini';
import { cn } from '../lib/utils';

interface PastQuestionsProps {
  onBack: () => void;
  onStartQuiz: (questions: Question[], subject: Subject, year: number, type: ExaminationType) => void;
}

export default function PastQuestions({ onBack, onStartQuiz }: PastQuestionsProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject>(subjects[0]);
  const [selectedType, setSelectedType] = useState<ExaminationType>('BECE');
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const years = Array.from({ length: 2025 - 1990 + 1 }, (_, i) => 2025 - i);

  const handleFetchQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const questions = await generatePastQuestions(selectedSubject.name, selectedYear, selectedType);
      onStartQuiz(questions, selectedSubject, selectedYear, selectedType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-slate-400">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-3xl font-black text-white tracking-tight">Past Questions Library</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Selection Panel */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Select Subject</label>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {subjects.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubject(s)}
                  className={cn(
                    "w-full p-3 rounded-xl text-left text-sm font-bold transition-all flex items-center gap-3",
                    selectedSubject.id === s.id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-white/5 text-slate-400 hover:bg-white/10"
                  )}
                >
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", s.color)}>
                    <History size={16} />
                  </div>
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Exam Type</label>
                <div className="flex gap-2">
                  {(['BECE', 'WASSCE'] as ExaminationType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={cn(
                        "flex-1 py-3 rounded-xl font-bold transition-all border",
                        selectedType === type ? "bg-blue-600 border-blue-500 text-white" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Exam Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  {years.map(y => (
                    <option key={y} value={y} className="bg-slate-900">{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-8">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Authentic Exam Experience</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    We'll generate 10 questions specifically from the {selectedYear} {selectedType} {selectedSubject.name} curriculum. 
                    This includes the specific style and difficulty of that era.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <button
              onClick={handleFetchQuestions}
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  Loading Questions...
                </>
              ) : (
                <>
                  <Play size={24} fill="currentColor" />
                  Start {selectedYear} {selectedType} Exam
                </>
              )}
            </button>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="text-blue-400 mb-2 font-bold">1990 - 2025</div>
              <p className="text-xs text-slate-500">Full coverage of 35 years of academic excellence and exam patterns.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="text-purple-400 mb-2 font-bold">AI Verified</div>
              <p className="text-xs text-slate-500">Questions are verified by our AI Tutor to match actual syllabus standards.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
