import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, FileText, Plus, Search, Users, Check, X, ArrowLeft, 
  Clock, Sparkles, History, User, Fingerprint, CheckCircle2, 
  AlertCircle, RotateCcw, Printer, Share2, Play, Volume2, 
  VolumeX, Bookmark, ChevronRight, BookOpen, GraduationCap,
  Loader2
} from 'lucide-react';
import { Subject, Question, ExaminationType, MockExamResult } from '../types';
import { subjects } from '../data/subjects';
import { generatePastQuestions } from '../lib/gemini';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';

interface NationalMockCenterProps {
  onBack: () => void;
  onEnterGeneralHall?: () => void;
  initialSubjectId?: string;
}

export default function NationalMockCenter({ onBack, initialSubjectId }: NationalMockCenterProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject>(() => {
    if (initialSubjectId) {
      const found = subjects.find(s => s.id === initialSubjectId);
      if (found) return found;
    }
    return subjects[0];
  });
  const [selectedLevel, setSelectedLevel] = useState<ExaminationType>('BECE');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  
  // Phase handling: 'lobby' | 'registration' | 'testing' | 'results'
  const [examPhase, setExamPhase] = useState<'lobby' | 'registration' | 'testing' | 'results'>('lobby');
  
  // Registration state
  const [candidateName, setCandidateName] = useState(() => {
    const saved = localStorage.getItem('eduquest_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      return `${parsed.firstName || 'Khalil'} ${parsed.lastName || 'Al-Gopeers'}`;
    }
    return 'Khalil Al-Gopeers';
  });
  
  const [indexNumber, setIndexNumber] = useState('');
  
  // Generate random index number upon subject selection
  useEffect(() => {
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000);
    setIndexNumber(`00${randomDigits}`);
  }, [selectedSubject, selectedLevel]);

  // Exam engine state
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [candidateAnswers, setCandidateAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default
  const [isActiveTimer, setIsActiveTimer] = useState(false);
  const [isExamAudioHum, setIsExamAudioHum] = useState(false);
  const [isLoadingPaper, setIsLoadingPaper] = useState(false);
  const [paperError, setPaperError] = useState<string | null>(null);

  // Results & History
  const [latestReport, setLatestReport] = useState<MockExamResult | null>(null);
  const [reportHistory, setReportHistory] = useState<MockExamResult[]>(() => {
    const saved = localStorage.getItem('eduquest_mock_results');
    return saved ? JSON.parse(saved) : [];
  });

  // Sound hum effect for active study focus simulation
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let oscillator: OscillatorNode | null = null;
    let gainNode: GainNode | null = null;

    if (isExamAudioHum && examPhase === 'testing') {
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioCtxClass();
        oscillator = audioCtx.createOscillator();
        gainNode = audioCtx.createGain();
        
        // Brown noise simulation with slow oscillator waves for "focus hum"
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(95, audioCtx.currentTime); // Deep resonant study hum
        gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime); // Whisper quiet
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
      } catch (e) {
        console.warn('Web Audio API not fully available in this container environment.');
      }
    }

    return () => {
      if (oscillator) oscillator.stop();
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
    };
  }, [isExamAudioHum, examPhase]);

  // Timer scheduler
  useEffect(() => {
    let interval: any = null;
    if (isActiveTimer && timeLeft > 0 && examPhase === 'testing') {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && examPhase === 'testing') {
      clearInterval(interval);
      setIsActiveTimer(false);
      handleAutoSubmit();
    }
    return () => clearInterval(interval);
  }, [isActiveTimer, timeLeft, examPhase]);

  // Load history from localStorage
  const forceReloadHistory = () => {
    const saved = localStorage.getItem('eduquest_mock_results');
    setReportHistory(saved ? JSON.parse(saved) : []);
  };

  // Setup/Start Paper loading
  const handleStartExamFlow = async () => {
    setIsLoadingPaper(true);
    setPaperError(null);
    try {
      // High fidelity dynamic AI Paper fetching, with immediate local topic-questions fallback
      let questions: Question[] = [];
      try {
        questions = await generatePastQuestions(selectedSubject.name, selectedYear, selectedLevel);
      } catch (err) {
        console.warn('Dynamic AI fetch busy, falling back to rich local syllabus questions database.');
        // Select matching questions from local subjects content
        const localSource = selectedLevel === 'WASSCE' && selectedSubject.advancedQuestions 
          ? selectedSubject.advancedQuestions 
          : selectedSubject.questions;
        
        // Pick up to 10 random questions
        if (localSource && localSource.length > 0) {
          questions = [...localSource].sort(() => 0.5 - Math.random()).slice(0, 10);
        } else {
          // Absolute failsafe fallback standard questions
          questions = subjects[0].questions.slice(0, 10);
        }
      }

      if (questions.length === 0) {
        throw new Error("No syllabus questions could be resolved for this exam configuration.");
      }

      setExamQuestions(questions);
      setCandidateAnswers({});
      setFlaggedQuestions({});
      setTimeLeft(600); // 10 minutes
      setCurrentQuestionIndex(0);
      setExamPhase('registration');
    } catch (err) {
      setPaperError(err instanceof Error ? err.message : "Failed to load examination mock paper. Please try again.");
    } finally {
      setIsLoadingPaper(false);
    }
  };

  const handleEnterExamHall = () => {
    setExamPhase('testing');
    setIsActiveTimer(true);
  };

  // Convert Score target to WAEC Exam Grading Letters
  const calculateWAECGrade = (score: number, total: number) => {
    const pct = Math.round((score / total) * 100);
    if (pct >= 90) return { grade: 'A1', label: 'Excellent', style: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (pct >= 80) return { grade: 'B2', label: 'Very Good', style: 'text-teal-400 bg-teal-500/10 border-teal-500/30' };
    if (pct >= 70) return { grade: 'B3', label: 'Good', style: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
    if (pct >= 65) return { grade: 'C4', label: 'Credit (Upper)', style: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
    if (pct >= 60) return { grade: 'C5', label: 'Credit (Middle)', style: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
    if (pct >= 50) return { grade: 'C6', label: 'Credit (Pass)', style: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
    if (pct >= 45) return { grade: 'D7', label: 'Pass (Fair)', style: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    if (pct >= 40) return { grade: 'E8', label: 'Pass (Lower)', style: 'text-orange-400 bg-orange-500/10 border-orange-500/30' };
    return { grade: 'F9', label: 'Fail (Re-examine)', style: 'text-red-400 bg-red-400/10 border-red-500/30' };
  };

  const submitExamSheetToWAEC = () => {
    setIsActiveTimer(false);
    
    // Compute results values
    let finalScore = 0;
    examQuestions.forEach((q, idx) => {
      if (candidateAnswers[idx] === q.correctAnswer) {
        finalScore += 1;
      }
    });

    const percent = Math.round((finalScore / examQuestions.length) * 100);
    const wGrade = calculateWAECGrade(finalScore, examQuestions.length);

    const resultObject: MockExamResult = {
      id: `waec-mock-${Date.now()}`,
      candidateName: candidateName || 'EduQuest Candidate',
      indexNumber: indexNumber,
      subjectName: selectedSubject.name,
      subjectId: selectedSubject.id,
      level: selectedLevel,
      score: finalScore,
      totalQuestions: examQuestions.length,
      percentage: percent,
      grade: wGrade.grade,
      gradeRemark: wGrade.label,
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      year: selectedYear
    };

    // Save report to State & Storage
    setLatestReport(resultObject);
    const updatedHistory = [resultObject, ...reportHistory];
    setReportHistory(updatedHistory);
    localStorage.setItem('eduquest_mock_results', JSON.stringify(updatedHistory));

    // Display trigger effects
    setExamPhase('results');
    if (percent >= 50) {
      confetti({
        particleCount: 180,
        spread: 80,
        origin: { y: 0.65 }
      });
    }
  };

  const handleAutoSubmit = () => {
    submitExamSheetToWAEC();
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = reportHistory.filter(r => r.id !== id);
    setReportHistory(updated);
    localStorage.setItem('eduquest_mock_results', JSON.stringify(updated));
  };

  return (
    <div className="max-w-6xl mx-auto">
      
      {/* HEADER BAR (Hides during active exam mode to preserve pure examination attention limit) */}
      {examPhase !== 'testing' && (
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack} 
              className="p-2.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-transparent hover:border-white/5 active:scale-95"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">National Mock Examinations</h2>
              <p className="text-xs text-slate-400">West African WAEC standard syllabus mock sessions with certified results slips.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-full">
              WAEC ALIGNED
            </span>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        
        {/* ========================================================
            1. MOCK EXAM LOBBY & PREVIOUS RESULTS HISTORY
           ======================================================== */}
        {examPhase === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Exam Configuration Side Panel */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-400">
                  <GraduationCap size={72} />
                </div>
                
                <h4 className="text-lg font-black text-white tracking-tight mb-4 flex items-center gap-2">
                  <Award size={18} className="text-blue-400" />
                  Examination setup
                </h4>

                {/* Exam Level toggle */}
                <div className="mb-5">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Examination Class</label>
                  <div className="flex gap-2">
                    {(['BECE', 'WASSCE'] as ExaminationType[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => setSelectedLevel(level)}
                        className={cn(
                          "flex-1 py-2.5 rounded-xl text-xs font-black tracking-wide border transition-all",
                          selectedLevel === level 
                            ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20" 
                            : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {level === 'BECE' ? 'BECE (JHS)' : 'WASSCE (SHS)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject picker dropdown/grid */}
                <div className="mb-5">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Subject</label>
                  <select
                    value={selectedSubject?.id}
                    onChange={(e) => {
                      const found = subjects.find(s => s.id === e.target.value);
                      if (found) setSelectedSubject(found);
                    }}
                    className="w-full bg-slate-900 border border-white/10 hover:border-white/20 rounded-xl py-3 px-3.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id} className="bg-slate-900 text-xs text-white">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Select picker */}
                <div className="mb-6">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Target Syllabus Cycle</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-white/10 hover:border-white/20 rounded-xl py-3 px-3.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {[2026, 2025, 2024, 2023, 2022, 2020, 2018].map(yr => (
                      <option key={yr} value={yr} className="bg-slate-900 text-xs">
                        {yr} Curriculum Standards
                      </option>
                    ))}
                  </select>
                </div>

                {/* Load error report */}
                {paperError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start gap-2 leading-relaxed">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{paperError}</span>
                  </div>
                )}

                {/* Register and Initialize paper */}
                <button
                  onClick={handleStartExamFlow}
                  disabled={isLoadingPaper}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 duration-100 flex items-center justify-center gap-2"
                >
                  {isLoadingPaper ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Exam Hall preparing...
                    </>
                  ) : (
                    <>
                      <Play size={14} fill="currentColor" />
                      Lock in Admit Slip
                    </>
                  )}
                </button>
              </div>

              {/* Informative advice cards */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 text-[11px] text-slate-400 leading-relaxed space-y-3">
                <p className="font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <Sparkles size={11} className="text-blue-400" />
                  WAEC Grading Benchmarks
                </p>
                <p>EduQuest examinations conform with standard West African WAEC continuous assessment protocols.</p>
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950/20 p-2.5 rounded-lg border border-white/5 font-semibold">
                  <div>90%+ : A1 (Excellent)</div>
                  <div>80%+ : B2 (V. Good)</div>
                  <div>70%+ : B3 (Good)</div>
                  <div>60%+ : C5 (Credit)</div>
                  <div>50%+ : C6 (Pass)</div>
                  <div>Below 50%: F9 (Fail)</div>
                </div>
              </div>
            </div>

            {/* Previous Exam Results & Records panel */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Feature Intro */}
              <div className="p-6 bg-gradient-to-r from-blue-500/10 to-transparent border border-white/10 rounded-2xl">
                <h3 className="text-xl font-bold text-white mb-2">Simulate real board reviews</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Train under exact timing constraints and visual answering mechanisms. Unlike normal quizzes, you only find out your correct syllabus responses at the end of the test! A printable official Results Slip is produced instantly upon submission.
                </p>
              </div>

              {/* Results history board */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                <h4 className="text-sm font-black text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>Candidate Result slips ({reportHistory.length})</span>
                  {reportHistory.length > 0 && <History size={16} className="text-slate-500" />}
                </h4>

                {reportHistory.length === 0 ? (
                  <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/5">
                    <History size={40} className="text-slate-600 mx-auto mb-4" />
                    <h5 className="font-bold text-white mb-1">Your Results Board is Empty</h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      You haven't sat for any mock papers yet. Configure your level, select a subject and lock in your Admit Card to get listed.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                    {reportHistory.map((report) => {
                      const gradeStyle = calculateWAECGrade(report.score, report.totalQuestions);
                      return (
                        <div 
                          key={report.id}
                          onClick={() => {
                            setLatestReport(report);
                            setExamPhase('results');
                          }}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn("h-11 w-11 rounded-xl flex flex-col items-center justify-center text-xs font-black border", gradeStyle.style)}>
                              <span>{report.grade}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                                  {report.subjectName} Mock Exam
                                </h5>
                                <span className="text-[9px] uppercase font-black tracking-widest text-slate-500">
                                  {report.level} • {report.year}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1">
                                Candidate: {report.candidateName} • Index: {report.indexNumber} • {report.date}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mt-3 sm:mt-0 w-full sm:w-auto justify-between sm:justify-start pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                            <div className="text-right">
                              <div className="text-xs font-bold text-slate-300">
                                {report.score}/{report.totalQuestions} ({report.percentage}%)
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                Grade Remark: {report.gradeRemark}
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <button 
                                onClick={(e) => handleDeleteHistory(report.id, e)}
                                title="Remove Exam Record"
                                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 border border-transparent hover:border-red-500/10 transition-all active:scale-95"
                              >
                                <X size={14} />
                              </button>
                              <div className="p-2 rounded-lg bg-white/5 text-slate-400 group-hover:text-white transition-all">
                                <ChevronRight size={14} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================
            2. candidate ADMIT SLIP / CARD SIGN-IN
           ======================================================== */}
        {examPhase === 'registration' && (
          <motion.div
            key="registration"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="max-w-2xl mx-auto py-4"
          >
            <div className="bg-slate-900 border border-white/15 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
              
              <div className="absolute top-0 right-0 p-8 text-white/5">
                <History size={110} />
              </div>

              {/* Card headers */}
              <div className="text-center pb-6 border-b border-white/10 mb-8">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
                  <Fingerprint size={24} />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">Candidates Identification Slip</h3>
                <p className="text-xs text-slate-400 mt-1">Please confirm your registration profile before entering the exam room.</p>
              </div>

              {/* Student Identification form */}
              <div className="space-y-6">
                
                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Candidate Full Name</label>
                      <input
                        type="text"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        placeholder="Enter candidate name..."
                        className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Automated Index Number</label>
                      <div className="w-full bg-slate-950/40 border border-white/5 select-all rounded-xl px-4 py-2.5 text-xs text-slate-400 font-mono flex items-center justify-between">
                        <span>{indexNumber}</span>
                        <span className="text-[8px] bg-slate-500/20 text-slate-400 font-black px-1.5 py-0.5 rounded">UNALTERABLE</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Center Name</label>
                      <p className="text-xs text-slate-300 font-medium">EDUQUEST CAMPUS HALL 1 (W.A.)</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Selected Section Sheet</label>
                      <p className="text-xs text-purple-300 font-bold uppercase">{selectedLevel} • {selectedSubject.name}</p>
                    </div>
                  </div>
                </div>

                {/* Candidate obligations */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-300/90 leading-relaxed">
                  <h5 className="font-extrabold text-amber-300 mb-1 flex items-center gap-1.5 tracking-wider text-[10px] uppercase">
                    <AlertCircle size={12} />
                    West Africa Examination Council instructions
                  </h5>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>This test is highly timed. You have exactly <strong>10 minutes</strong> to complete the paper.</li>
                    <li>No external answers or browser tools are permitted. Our AI supervisor logs focus.</li>
                    <li>The paper cannot be paused. Refreshing the browser registers an automatic submission.</li>
                    <li>Answers will be graded and reviewed only upon final submission.</li>
                  </ul>
                </div>

                {/* Submit / actions */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setExamPhase('lobby')}
                    className="py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
                  >
                    Change Paper
                  </button>
                  <button
                    onClick={handleEnterExamHall}
                    className="py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95"
                  >
                    Enter Examination Room
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* ========================================================
            3. IMMERSIVE EXPERIMENTAL TEST SHEET MODE
           ======================================================== */}
        {examPhase === 'testing' && (
          <motion.div
            key="testing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[500px]"
          >
            {/* OMR bubble answering sheet sidebar / Exam Status */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-slate-900 border border-white/15 rounded-3xl p-5 backdrop-blur-xl flex flex-col justify-between">
                <div>
                  
                  {/* Supervisor Widget */}
                  <div className="pb-4 border-b border-white/10 mb-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">EXAM SUPERVISOR</h4>
                      <p className="text-[11px] text-slate-300 font-bold flex items-center gap-1">
                        <Users size={12} className="text-purple-400" />
                        AI WAEC Invigilator
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setIsExamAudioHum(!isExamAudioHum)}
                        className={cn(
                          "p-2 rounded-lg text-xs transition-all border",
                          isExamAudioHum 
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/30" 
                            : "bg-white/5 text-slate-500 border-white/5 hover:text-slate-300"
                        )}
                        title={isExamAudioHum ? "Focus study frequency humming active" : "Enable ambient focus hum frequency"}
                      >
                        {isExamAudioHum ? <Volume2 size={13} /> : <VolumeX size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Timer widget display */}
                  <div className="text-center py-4 bg-slate-950/40 rounded-xl border border-white/5 mb-6">
                    <span className="block text-[8px] font-black tracking-widest text-slate-500 uppercase mb-1">REMAINING PAPER TIME</span>
                    <span className={cn(
                      "text-3xl font-mono font-black tabular-nums tracking-wide block animate-pulse",
                      timeLeft < 120 ? "text-red-500" : "text-white"
                    )}>
                      {formatTimer(timeLeft)}
                    </span>
                    {timeLeft < 120 && (
                      <span className="text-[9px] font-extrabold text-red-500 animate-bounce block mt-1">WARNING: LESS THAN 2 MINUTES!</span>
                    )}
                  </div>

                  {/* Candidate metadata */}
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[10px] text-slate-400 space-y-1 mb-6">
                    <p className="font-extrabold text-slate-300 truncate">Candidate: {candidateName}</p>
                    <p className="font-mono">Index No: {indexNumber}</p>
                    <p className="uppercase font-bold text-blue-400">{selectedLevel} • {selectedSubject.name}</p>
                  </div>

                  {/* Visual OMR sheet bubble map */}
                  <div className="space-y-2 mb-4">
                    <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-500">WAEC Answering Sheet (OMR)</h5>
                    <div className="grid grid-cols-5 gap-2">
                      {examQuestions.map((_, idx) => {
                        const isCurrent = currentQuestionIndex === idx;
                        const isAnswered = candidateAnswers[idx] !== undefined;
                        const isFlagged = flaggedQuestions[idx] === true;
                        
                        return (
                          <button
                            key={idx}
                            onClick={() => setCurrentQuestionIndex(idx)}
                            className={cn(
                              "h-9 w-9 rounded-xl font-bold font-mono text-xs border flex items-center justify-center transition-all",
                              isCurrent 
                                ? "bg-purple-600 border-purple-500 text-white ring-2 ring-purple-600/30 scale-105 font-black" 
                                : isFlagged
                                ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                                : isAnswered
                                ? "bg-blue-600 border-blue-500 text-white"
                                : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10 hover:text-white"
                            )}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                <div className="pt-4 border-t border-white/10 mt-6">
                  <button
                    onClick={() => {
                      if (confirm("Are you absolutely sure you want to end your examination and submit your answer sheet to the West African Examination Council supervisor? This cannot be undone.")) {
                        submitExamSheetToWAEC();
                      }
                    }}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 active:scale-95"
                  >
                    Finish & Submit Paper
                  </button>
                </div>

              </div>

            </div>

            {/* Practical Examination Sheet & Questions card */}
            <div className="lg:col-span-3 space-y-6">
              
              <div className="bg-slate-900 border border-white/15 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden min-h-[460px] flex flex-col justify-between">
                
                {/* Question Page Header bar */}
                <div className="flex items-center justify-between pb-4 border-b border-white/15 mb-6">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    SECTION A: OBJECTIVE EXAM
                  </span>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setFlaggedQuestions(prev => ({ ...prev, [currentQuestionIndex]: !prev[currentQuestionIndex] }))}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10.5px] font-bold transition-all",
                        flaggedQuestions[currentQuestionIndex]
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                      )}
                    >
                      <Bookmark size={11} fill={flaggedQuestions[currentQuestionIndex] ? "currentColor" : "none"} />
                      <span>{flaggedQuestions[currentQuestionIndex] ? 'Flagged for Review' : 'Flag Question'}</span>
                    </button>

                    <span className="text-xs text-slate-500">
                      Question {currentQuestionIndex + 1} of {examQuestions.length}
                    </span>
                  </div>
                </div>

                {/* Primary Question text layout */}
                <div className="flex-grow flex flex-col justify-center py-4">
                  <h3 className="text-xl sm:text-2xl font-medium tracking-tight text-white leading-relaxed mb-8">
                    {examQuestions[currentQuestionIndex]?.text}
                  </h3>

                  {/* Multiple options grid */}
                  <div className="space-y-4">
                    {examQuestions[currentQuestionIndex]?.options.map((option, optIdx) => {
                      const isSelected = candidateAnswers[currentQuestionIndex] === optIdx;
                      const letter = String.fromCharCode(65 + optIdx); // A, B, C, D
                      
                      return (
                        <button
                          key={optIdx}
                          onClick={() => setCandidateAnswers(prev => ({ ...prev, [currentQuestionIndex]: optIdx }))}
                          className={cn(
                            "w-full p-4.5 px-5 rounded-2xl text-left transition-all flex items-center gap-4 border-2 group duration-100",
                            isSelected 
                              ? "bg-purple-600/10 border-purple-500 text-white" 
                              : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10"
                          )}
                        >
                          <div className={cn(
                            "h-7 w-7 rounded-lg text-xs font-black flex items-center justify-center border",
                            isSelected 
                              ? "bg-purple-600 border-purple-500 text-white" 
                              : "bg-white/10 border-white/10 text-slate-400 group-hover:text-white"
                          )}>
                            {letter}
                          </div>
                          <span className="text-sm font-medium">{option}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Question Bottom pagination controls */}
                <div className="flex items-center justify-between pt-6 border-t border-white/15 mt-8">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/5 disabled:pointer-events-none rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all active:scale-95"
                  >
                    Previous Question
                  </button>

                  <div className="flex gap-2">
                    {currentQuestionIndex < examQuestions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-purple-600/10 flex items-center gap-1"
                      >
                        <span>Next Question</span>
                        <ChevronRight size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (confirm("Are you ready to finalize your examination papers and request grading from the WAEC continuous evaluation system?")) {
                            submitExamSheetToWAEC();
                          }
                        }}
                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-emerald-500/20"
                      >
                        Finish & Grade Exam
                      </button>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* ========================================================
            4. COMPREHENSIVE GRADING RESULTS SLIP (WAEC OFFICIAL)
           ======================================================== */}
        {examPhase === 'results' && latestReport && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="max-w-4xl mx-auto py-2"
          >
            {/* Action headers (Print / close / retry) */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <button
                onClick={() => setExamPhase('lobby')}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all border border-white/5 active:scale-95"
              >
                <ArrowLeft size={14} />
                <span>Return to Lobby</span>
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 rounded-xl text-xs font-bold text-blue-300 border border-blue-500/20 hover:text-white transition-all active:scale-95"
                >
                  <Printer size={14} />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => {
                    const foundObj = subjects.find(s => s.id === latestReport.subjectId);
                    if (foundObj) {
                      setSelectedSubject(foundObj);
                      setSelectedLevel(latestReport.level);
                      setSelectedYear(latestReport.year);
                      handleStartExamFlow();
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-bold text-white transition-all active:scale-95 shadow-md shadow-purple-600/10"
                >
                  <RotateCcw size={14} />
                  <span>Resit New Paper</span>
                </button>
              </div>
            </div>

            {/* WAEC Official Statement layout style */}
            <div className="print-section bg-white text-slate-900 border-4 border-double border-slate-300 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
              
              <div className="absolute inset-0 bg-[radial-gradient(#00000005_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

              {/* Council identity header */}
              <div className="text-center pb-6 border-b-2 border-slate-200 mb-8 relative z-10">
                <h2 className="text-xs font-black tracking-widest text-slate-500 uppercase mb-1">
                  West African Examinations Council Continuous Evaluation
                </h2>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-slate-900">
                  EDUQUEST NATIONAL PRE-MOCK CENTER
                </h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                  OFFICIAL STATEMENT OF MOCK EXAMINATION PERFORMANCE
                </p>
              </div>

              {/* Candidate Info parameters list */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-slate-50 border border-slate-200 p-5 rounded-2xl mb-8 font-mono text-[11px] text-slate-700 relative z-10 shadow-inner">
                <div>
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">CANDIDATE NAME</span>
                  <span className="font-extrabold text-slate-900 text-xs truncate block">{latestReport.candidateName}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">INDEX NUMBER</span>
                  <span className="font-bold text-slate-900 text-xs block">{latestReport.indexNumber}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">EXAM LEVEL</span>
                  <span className="font-bold text-slate-900 text-xs block truncate uppercase">{latestReport.level} EXAM</span>
                </div>
                <div>
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">DATE ISSUED</span>
                  <span className="font-bold text-slate-900 text-xs block">{latestReport.date}</span>
                </div>
              </div>

              {/* Main Score & Grade presentation box */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center mb-10 pb-8 border-b border-slate-200 relative z-10 animate-fade-in">
                
                <div className="md:col-span-2 space-y-4">
                  <h4 className="text-[10px] font-black tracking-wider text-slate-400 uppercase mb-2">GRADED RESULTS ANALYSIS</h4>
                  <div className="font-sans">
                    <p className="text-md font-medium text-slate-800 leading-relaxed">
                      This candidate sat for the <strong className="text-slate-900">{latestReport.subjectName}</strong> examination paper corresponding with syllabus standards for the <strong>{latestReport.year} Cycle</strong>. The paper consisted of standard high-frequency multi-choice challenges.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <span className="block text-[8px] font-black text-slate-400">RAW SCORE</span>
                      <strong className="text-slate-900 text-lg tabular-nums">{latestReport.score} / {latestReport.totalQuestions}</strong>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <span className="block text-[8px] font-black text-slate-400">PERCENTAGE</span>
                      <strong className="text-slate-900 text-lg tabular-nums">{latestReport.percentage}%</strong>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <span className="block text-[8px] font-black text-slate-400">CERTIFICATESTATUS</span>
                      <strong className={cn("text-xs uppercase font-extrabold block mt-0.5", latestReport.percentage >= 50 ? "text-emerald-600" : "text-red-500")}>
                        {latestReport.percentage >= 50 ? 'PASS' : 'FAIL'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* WAEC Big Badge Grade cylinder */}
                <div className="md:col-span-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-slate-200 rounded-3xl shadow-sm">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-2">OFFICIAL WAEC GRADE</span>
                  <div className={cn(
                    "h-24 w-24 rounded-full flex flex-col items-center justify-center text-4xl font-extrabold border-4 mb-2 shadow-inner font-mono animate-pulse",
                    latestReport.percentage >= 80 
                      ? "text-emerald-600 border-emerald-500 bg-emerald-500/5" 
                      : latestReport.percentage >= 50 
                      ? "text-blue-600 border-blue-500 bg-blue-500/5" 
                      : "text-red-500 border-red-500 bg-red-500/5"
                  )}>
                    {latestReport.grade}
                  </div>
                  <strong className="text-xs text-slate-700 tracking-tight block font-bold mt-1">
                    {latestReport.gradeRemark}
                  </strong>
                </div>

              </div>

              {/* Detailed Exam Response Review desk (Only shown on web device view) */}
              <div className="mt-8 relative z-10 print:hidden space-y-4">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen size={16} className="text-purple-600" />
                  Examination review & Solutions Desk
                </h4>
                <p className="text-xs text-slate-500">
                  Review below which questions were answered incorrectly. Use this feedback for active recall revision planning.
                </p>

                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                  {examQuestions.map((q, idx) => {
                    const selected = candidateAnswers[idx];
                    const isCorrect = selected === q.correctAnswer;
                    
                    return (
                      <div 
                        key={idx}
                        className={cn(
                          "p-5 rounded-2xl border text-xs leading-relaxed space-y-2.5",
                          isCorrect 
                            ? "bg-emerald-50/50 border-emerald-100" 
                            : selected === undefined 
                            ? "bg-slate-50 border-slate-100" 
                            : "bg-red-50/50 border-red-100"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <h5 className="font-extrabold text-slate-900 text-[13px]">
                            Question {idx + 1}: {q.text}
                          </h5>
                          
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wide border shrink-0",
                            isCorrect 
                              ? "bg-emerald-100 border-emerald-200 text-emerald-800"
                              : selected === undefined
                              ? "bg-slate-100 border-slate-200 text-slate-600"
                              : "bg-red-100 border-red-200 text-red-800"
                          )}>
                            {isCorrect ? '✓ Correct' : selected === undefined ? '⚠ Unanswered' : '✗ Incorrect'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-medium text-slate-600 pb-2 border-b border-slate-200/50">
                          <div>
                            <span className="text-slate-400 mr-1.5 font-bold">Your Response:</span>
                            <span className={cn("font-bold", isCorrect ? "text-emerald-700" : "text-red-700")}>
                              {selected !== undefined ? q.options[selected] : '[None Selected]'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 mr-1.5 font-bold">WAEC Key:</span>
                            <span className="text-emerald-700 font-bold">{q.options[q.correctAnswer]}</span>
                          </div>
                        </div>

                        <p className="text-[11.5px] italic text-slate-500 leading-relaxed pt-1">
                          <span className="font-bold text-slate-700">Tutor explanation:</span> {q.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Certificate Authority footer line */}
              <div className="pt-8 border-t border-slate-200 mt-10 flex flex-col sm:flex-row justify-between items-center gap-6 relative z-10 text-[10px] text-slate-400 font-mono">
                <div>
                  <span className="block font-bold">DIGITAL AUTHENTICATION KEY</span>
                  <span>EQ-MOCK-HASH-{latestReport.id}-WAEC</span>
                </div>
                <div className="text-center sm:text-right">
                  <span className="block font-bold">EDUQUEST EVALUATION CENTER</span>
                  <span className="italic block font-sans font-semibold text-slate-600 pt-1">Verified Digital Signature Slip</span>
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
