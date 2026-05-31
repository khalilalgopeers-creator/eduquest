import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Brain, Clock, AlertCircle, ChevronRight, Sparkles, Save, Trash2, Plus, Loader2, X, ListChecks, CheckCircle2, GraduationCap, Zap, Volume2, VolumeX, Info, Bell, BellOff } from 'lucide-react';
import { Subject, UserProgress, ExamDate, AIExplanationResponse, ExaminationType } from '../types';
import { subjects } from '../data/subjects';
import { GoogleGenAI, Type } from "@google/genai";
import { cn } from '../lib/utils';
import { generateDetailedExplanation, generateSpeech } from '../lib/gemini';

interface StudyPlannerProps {
  progress: UserProgress[];
  onBack: () => void;
}

interface PlanItem {
  day: string;
  subject: string;
  topics: string[];
  duration: string;
  priority: 'High' | 'Medium' | 'Low';
  goalMet: string;
}

export default function StudyPlanner({ progress, onBack }: StudyPlannerProps) {
  const [examDates, setExamDates] = useState<ExamDate[]>([]);
  const [examination, setExamination] = useState<ExaminationType>('BECE');
  const [dailyGoal, setDailyGoal] = useState<string>('Study for 2 hours');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<PlanItem[] | null>(null);
  const [completedIndices, setCompletedIndices] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [error, setError] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Record<number, string>>({});
  const [settingReminderIdx, setSettingReminderIdx] = useState<number | null>(null);

  // AI Explanation State
  const [explainingTopic, setExplainingTopic] = useState<{ topic: string; subject: string } | null>(null);
  const [aiResponse, setAiResponse] = useState<AIExplanationResponse | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Load exam dates and examination type from localStorage
  useEffect(() => {
    const savedDates = localStorage.getItem('eduquest_exam_dates');
    const savedExam = localStorage.getItem('eduquest_examination_type') as ExaminationType;
    const savedGoal = localStorage.getItem('eduquest_daily_goal');
    const savedReminders = localStorage.getItem('eduquest_study_reminders');
    
    if (savedDates) {
      setExamDates(JSON.parse(savedDates));
    }
    if (savedExam) {
      setExamination(savedExam);
    }
    if (savedGoal) {
      setDailyGoal(savedGoal);
    }
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders));
    }
  }, []);

  // Save exam dates and examination type to localStorage
  useEffect(() => {
    localStorage.setItem('eduquest_exam_dates', JSON.stringify(examDates));
    localStorage.setItem('eduquest_examination_type', examination);
    localStorage.setItem('eduquest_daily_goal', dailyGoal);
    localStorage.setItem('eduquest_study_reminders', JSON.stringify(reminders));
  }, [examDates, examination, dailyGoal, reminders]);

  // Load/Save completed indices
  useEffect(() => {
    const saved = localStorage.getItem('eduquest_completed_plan_items');
    if (saved) setCompletedIndices(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('eduquest_completed_plan_items', JSON.stringify(completedIndices));
  }, [completedIndices]);

  const toggleComplete = (idx: number) => {
    setCompletedIndices(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleAddExamDate = (subjectId: string, date: string) => {
    setExamDates(prev => {
      const existing = prev.find(d => d.subjectId === subjectId);
      if (existing) {
        return prev.map(d => d.subjectId === subjectId ? { ...d, date } : d);
      }
      return [...prev, { subjectId, date }];
    });
  };

  const handleRemoveExamDate = (subjectId: string) => {
    setExamDates(prev => prev.filter(d => d.subjectId !== subjectId));
  };

  const handleGetAIExplanation = async (topic: string, subjectName: string) => {
    setIsExplaining(true);
    setExplainingTopic({ topic, subject: subjectName });
    setAiResponse(null);
    setExplanationError(null);
    setUserAnswers({});
    setShowResults(false);
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
      setIsSpeaking(false);
    }

    try {
      // Find the subject in our data to get a base explanation if possible
      const subjectData = subjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase());
      const conceptData = subjectData?.concepts.find(c => c.title.toLowerCase().includes(topic.toLowerCase()));
      const baseExplanation = conceptData?.explanation || `Explain the concept of ${topic} in the context of ${subjectName}.`;

      const result = await generateDetailedExplanation(subjectName, topic, baseExplanation);
      setAiResponse(result);
    } catch (err) {
      setExplanationError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsExplaining(false);
    }
  };

  const handleSpeak = async () => {
    if (isSpeaking) {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
      }
      setIsSpeaking(false);
      return;
    }

    if (!aiResponse?.explanation) return;

    try {
      setIsSpeaking(true);
      const base64Audio = await generateSpeech(aiResponse.explanation);
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const audioContext = audioContextRef.current;
      const arrayBuffer = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0)).buffer;
      
      const dataView = new DataView(arrayBuffer);
      const float32Array = new Float32Array(arrayBuffer.byteLength / 2);
      for (let i = 0; i < float32Array.length; i++) {
        float32Array[i] = dataView.getInt16(i * 2, true) / 32768;
      }
      
      const audioBuffer = audioContext.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => {
        setIsSpeaking(false);
        sourceNodeRef.current = null;
      };
      
      sourceNodeRef.current = source;
      source.start();
    } catch (err) {
      console.error("Speech error:", err);
      setIsSpeaking(false);
    }
  };

  const handleAnswerSelect = (questionIdx: number, optionIdx: number) => {
    if (showResults) return;
    setUserAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification");
      return false;
    }
    
    if (Notification.permission === "granted") return true;
    
    const permission = await Notification.requestPermission();
    return permission === "granted";
  };

  const handleSetReminder = async (idx: number, time: string) => {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      setError("Notification permission is required to set reminders.");
      return;
    }

    const date = new Date();
    date.setDate(date.getDate() + idx); // Assume index 0 is today, 1 is tomorrow, etc.
    const [hours, minutes] = time.split(':');
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    setReminders(prev => ({
      ...prev,
      [idx]: date.toISOString()
    }));
    setSettingReminderIdx(null);
  };

  const removeReminder = (idx: number) => {
    setReminders(prev => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      Object.entries(reminders).forEach(([idx, timeStr]) => {
        const reminderTime = new Date(timeStr);
        // Check if it's the current minute
        if (
          reminderTime.getFullYear() === now.getFullYear() &&
          reminderTime.getMonth() === now.getMonth() &&
          reminderTime.getDate() === now.getDate() &&
          reminderTime.getHours() === now.getHours() &&
          reminderTime.getMinutes() === now.getMinutes()
        ) {
          const item = generatedPlan?.[parseInt(idx)];
          if (item) {
            if (Notification.permission === 'granted') {
              new Notification(`Study Session: ${item.subject}`, {
                body: `Time to study: ${item.topics.join(', ')}`,
                icon: '/favicon.ico'
              });
              // Remove reminder after triggering to avoid multiple notifications in the same minute
              removeReminder(parseInt(idx));
            }
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [reminders, generatedPlan]);

  const generateAIPlan = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API key is missing. Please check your environment variables.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Prepare context for the AI
      const userContext = {
        progress: progress.map(p => ({
          subject: subjects.find(s => s.id === p.subjectId)?.name,
          score: p.score,
          attempts: p.totalAttempts,
          weaknesses: p.score < 70 ? "Needs improvement" : "Doing well"
        })),
        exams: examDates.map(e => ({
          subject: subjects.find(s => s.id === e.subjectId)?.name,
          date: e.date
        })),
        availableSubjects: subjects.map(s => s.name)
      };

      const prompt = `
        As an expert study coach, create a personalized 7-day study schedule for a student preparing for the ${examination} examination.
        
        Daily Study Goal: ${dailyGoal}
        
        User Progress: ${JSON.stringify(userContext.progress)}
        Upcoming Exams: ${JSON.stringify(userContext.exams)}
        Available Subjects: ${JSON.stringify(userContext.availableSubjects)}
        
        Rules:
        1. Prioritize subjects with upcoming exams.
        2. Prioritize subjects where the student has low scores (below 70).
        3. Suggest specific topics from the syllabus if possible.
        4. Each day should have 1-2 study sessions.
        5. Incorporate the student's daily goal (${dailyGoal}) into the plan for each day.
        6. Return the plan as a JSON array of objects with fields: day, subject, topics (array), duration, priority, goalMet (string describing how the daily goal is met).
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.STRING },
                subject: { type: Type.STRING },
                topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                duration: { type: Type.STRING },
                priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                goalMet: { type: Type.STRING }
              },
              required: ["day", "subject", "topics", "duration", "priority", "goalMet"]
            }
          }
        }
      });

      const plan = JSON.parse(response.text || "[]");
      setGeneratedPlan(plan);
      setCompletedIndices([]); // Reset completion when new plan is generated
      setReminders({}); // Reset reminders when new plan is generated
    } catch (err) {
      console.error("AI Generation Error:", err);
      setError("Failed to generate your study plan. Please try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-white mb-2">AI Study Planner</h2>
          <p className="text-slate-400">Set your exam dates and let AI create your perfect schedule.</p>
        </div>
        <button 
          onClick={onBack}
          className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors font-bold"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Exam Settings Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <GraduationCap className="text-purple-400" size={24} />
              <h3 className="text-xl font-bold text-white">Target Examination</h3>
            </div>
            
            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
              {(['BECE', 'WASSCE'] as ExaminationType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setExamination(type)}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold transition-all",
                    examination === type 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500 leading-relaxed">
              Your study plan will be tailored specifically for the {examination} syllabus and difficulty level.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="text-amber-400" size={24} />
              <h3 className="text-xl font-bold text-white">Daily Study Goal</h3>
            </div>
            
            <div className="space-y-3">
              {[
                'Study for 1 hour',
                'Study for 2 hours',
                'Complete 20 questions',
                'Complete 50 questions'
              ].map((goal) => (
                <button
                  key={goal}
                  onClick={() => setDailyGoal(goal)}
                  className={cn(
                    "w-full p-4 rounded-2xl text-left text-sm transition-all border",
                    dailyGoal === goal 
                      ? "bg-amber-500/20 border-amber-500 text-white" 
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                  )}
                >
                  {goal}
                </button>
              ))}
              
              <div className="pt-2">
                <input 
                  type="text"
                  placeholder="Or set a custom goal..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  value={['Study for 1 hour', 'Study for 2 hours', 'Complete 20 questions', 'Complete 50 questions'].includes(dailyGoal) ? '' : dailyGoal}
                  onChange={(e) => setDailyGoal(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="text-blue-400" size={24} />
              <h3 className="text-xl font-bold text-white">Exam Dates</h3>
            </div>

            <div className="space-y-4">
              {examDates.map((exam) => {
                const subject = subjects.find(s => s.id === exam.subjectId);
                return (
                  <div key={exam.subjectId} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div>
                      <p className="font-bold text-white">{subject?.name}</p>
                      <p className="text-sm text-slate-400">{new Date(exam.date).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => handleRemoveExamDate(exam.subjectId)}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}

              <div className="pt-4 border-t border-white/10">
                <p className="text-sm font-bold text-slate-400 mb-3">Add New Exam</p>
                <div className="space-y-3">
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    onChange={(e) => {
                      const subjectId = e.target.value;
                      if (subjectId) {
                        const date = (document.getElementById('exam-date-input') as HTMLInputElement).value;
                        if (date) handleAddExamDate(subjectId, date);
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Select Subject</option>
                    {subjects.filter(s => !examDates.find(e => e.subjectId === s.id)).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <input 
                    id="exam-date-input"
                    type="date" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={generateAIPlan}
            disabled={isGenerating}
            className={cn(
              "w-full py-4 rounded-3xl font-black text-lg flex items-center justify-center gap-3 transition-all",
              isGenerating 
                ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                : "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95"
            )}
          >
            {isGenerating ? (
              <>
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Plan...
              </>
            ) : (
              <>
                <Sparkles size={24} />
                Generate AI Study Plan
              </>
            )}
          </button>
          
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Generated Plan Section */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {generatedPlan ? (
              <motion.div 
                key="plan"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-black text-white">Your Weekly Schedule</h3>
                    <div className="flex items-center gap-2 text-blue-400 text-sm font-bold mt-1">
                      <Brain size={18} />
                      AI-Powered
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                    <button 
                      onClick={() => setViewMode('list')}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                        viewMode === 'list' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      List
                    </button>
                    <button 
                      onClick={() => setViewMode('calendar')}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                        viewMode === 'calendar' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      Calendar
                    </button>
                  </div>
                </div>

                {/* Overall Progress Bar */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-slate-400">Weekly Progress</span>
                    <span className="text-sm font-black text-blue-400">
                      {Math.round((completedIndices.length / generatedPlan.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(completedIndices.length / generatedPlan.length) * 100}%` }}
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                    />
                  </div>
                  <p className="mt-3 text-[10px] text-slate-500 font-medium">
                    {completedIndices.length} of {generatedPlan.length} study sessions completed
                  </p>
                </div>

                {viewMode === 'list' ? (
                  <div className="grid gap-4">
                    {generatedPlan.map((item, idx) => {
                      const isCompleted = completedIndices.includes(idx);
                      return (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={cn(
                            "group bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all backdrop-blur-md relative overflow-hidden",
                            isCompleted && "opacity-60 grayscale-[0.5]"
                          )}
                        >
                          {isCompleted && (
                            <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                          )}
                          
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <button 
                                onClick={() => toggleComplete(idx)}
                                className={cn(
                                  "h-12 w-12 rounded-2xl flex items-center justify-center transition-all shrink-0 border-2",
                                  isCompleted 
                                    ? "bg-green-500 border-green-400 text-white" 
                                    : "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                                )}
                              >
                                {isCompleted ? <CheckCircle2 size={24} /> : <span className="font-black text-xl">{item.day.substring(0, 1)}</span>}
                              </button>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <span className={cn("text-lg font-black text-white", isCompleted && "line-through text-slate-500")}>{item.day}</span>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider",
                                    item.priority === 'High' ? "bg-red-500/20 text-red-400" :
                                    item.priority === 'Medium' ? "bg-amber-500/20 text-amber-400" :
                                    "bg-emerald-500/20 text-emerald-400"
                                  )}>
                                    {item.priority} Priority
                                  </span>
                                </div>
                                <h4 className={cn("text-blue-400 font-bold mb-2", isCompleted && "text-slate-500")}>{item.subject}</h4>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {item.topics.map((topic, tIdx) => (
                                    <button 
                                      key={tIdx} 
                                      onClick={() => handleGetAIExplanation(topic, item.subject)}
                                      className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-slate-300 hover:bg-blue-500/20 hover:border-blue-500/30 hover:text-blue-400 transition-all flex items-center gap-1.5 group/topic"
                                    >
                                      {topic}
                                      <Sparkles size={10} className="opacity-0 group-hover/topic:opacity-100 transition-opacity" />
                                    </button>
                                  ))}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-amber-400/80 font-medium">
                                  <Zap size={12} />
                                  <span>Goal: {item.goalMet}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6 md:border-l md:border-white/10 md:pl-8">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => reminders[idx] ? removeReminder(idx) : setSettingReminderIdx(idx)}
                                  className={cn(
                                    "p-2 rounded-xl transition-all",
                                    reminders[idx] 
                                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                                      : "bg-white/5 text-slate-500 hover:text-white border border-white/10"
                                  )}
                                  title={reminders[idx] ? "Remove Reminder" : "Set Reminder"}
                                >
                                  {reminders[idx] ? <Bell size={18} /> : <BellOff size={18} />}
                                </button>
                                <div className="flex items-center gap-2 text-slate-400">
                                  <Clock size={16} />
                                  <span className="text-sm font-bold">{item.duration}</span>
                                </div>
                              </div>
                              <ChevronRight className="text-slate-600 group-hover:text-white transition-colors" />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {generatedPlan.map((item, idx) => {
                      const isCompleted = completedIndices.includes(idx);
                      return (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className={cn(
                            "bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col h-full transition-all relative overflow-hidden",
                            isCompleted ? "opacity-60 grayscale-[0.5]" : "hover:bg-white/10"
                          )}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-black text-white">{item.day}</span>
                            <button 
                              onClick={() => toggleComplete(idx)}
                              className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                                isCompleted ? "bg-green-500 text-white" : "bg-white/5 text-slate-500 hover:text-white"
                              )}
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          </div>
                          
                          <div className={cn(
                            "mb-3 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider w-fit",
                            item.priority === 'High' ? "bg-red-500/20 text-red-400" :
                            item.priority === 'Medium' ? "bg-amber-500/20 text-amber-400" :
                            "bg-emerald-500/20 text-emerald-400"
                          )}>
                            {item.priority}
                          </div>
                          
                          <h4 className="text-blue-400 font-bold text-sm mb-2 line-clamp-1">{item.subject}</h4>
                          
                          <div className="flex-grow space-y-1 mb-4">
                            {item.topics.slice(0, 3).map((topic, tIdx) => (
                              <div key={tIdx} className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                <div className="h-1 w-1 rounded-full bg-blue-500/50" />
                                <span className="line-clamp-1">{topic}</span>
                              </div>
                            ))}
                            {item.topics.length > 3 && (
                              <div className="text-[9px] text-slate-500 pl-2.5">
                                + {item.topics.length - 3} more topics
                              </div>
                            )}
                          </div>
                          
                          <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => reminders[idx] ? removeReminder(idx) : setSettingReminderIdx(idx)}
                                className={cn(
                                  "p-1.5 rounded-lg transition-all",
                                  reminders[idx] 
                                    ? "bg-blue-500/20 text-blue-400" 
                                    : "text-slate-500 hover:text-white"
                                )}
                              >
                                {reminders[idx] ? <Bell size={14} /> : <BellOff size={14} />}
                              </button>
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <Clock size={12} />
                                <span className="text-[10px] font-bold">{item.duration}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleGetAIExplanation(item.topics[0], item.subject)}
                              className="text-[10px] font-black text-blue-400 hover:text-blue-300"
                            >
                              Details
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-white/5 border border-white/10 rounded-[40px] border-dashed"
              >
                <div className="h-20 w-20 rounded-3xl bg-white/5 flex items-center justify-center text-slate-500 mb-6">
                  <Brain size={40} />
                </div>
                <h3 className="text-2xl font-black text-white mb-3">No Plan Generated Yet</h3>
                <p className="text-slate-400 max-w-md">
                  Add your exam dates and click the button to generate a personalized study schedule tailored to your progress and weaknesses.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Reminder Modal */}
      <AnimatePresence>
        {settingReminderIdx !== null && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettingReminderIdx(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Bell size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Set Reminder</h3>
                  <p className="text-sm text-slate-400">{generatedPlan?.[settingReminderIdx].day} • {generatedPlan?.[settingReminderIdx].subject}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">Select Time</label>
                  <input 
                    type="time" 
                    id="reminder-time"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    defaultValue="09:00"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setSettingReminderIdx(null)}
                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-bold hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      const time = (document.getElementById('reminder-time') as HTMLInputElement).value;
                      if (time) handleSetReminder(settingReminderIdx, time);
                    }}
                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-colors"
                  >
                    Set Reminder
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Explanation Modal */}
      <AnimatePresence>
        {explainingTopic && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isExplaining && setExplainingTopic(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{explainingTopic.topic}</h3>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-black">AI Tutor Deep Dive • {explainingTopic.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {aiResponse && (
                    <button 
                      onClick={handleSpeak}
                      className={cn(
                        "p-2 rounded-full transition-colors",
                        isSpeaking ? "bg-purple-500 text-white" : "hover:bg-white/10 text-slate-400"
                      )}
                      title={isSpeaking ? "Stop Reading" : "Read Aloud"}
                    >
                      {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setExplainingTopic(null);
                      if (sourceNodeRef.current) {
                        sourceNodeRef.current.stop();
                        sourceNodeRef.current = null;
                      }
                      setIsSpeaking(false);
                    }}
                    className="p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {isExplaining ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 size={48} className="text-purple-500 animate-spin" />
                    <p className="text-slate-400 font-medium animate-pulse">Consulting the AI Tutor...</p>
                  </div>
                ) : explanationError ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <X size={32} />
                    </div>
                    <p className="text-red-400 font-medium">{explanationError}</p>
                    <button 
                      onClick={() => handleGetAIExplanation(explainingTopic.topic, explainingTopic.subject)}
                      className="mt-6 px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div className="space-y-12">
                    {aiResponse && (
                      <div className="flex justify-end -mb-8 relative z-10">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleSpeak}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-lg",
                            isSpeaking 
                              ? "bg-purple-600 text-white shadow-purple-600/20" 
                              : "bg-white/10 text-purple-400 hover:bg-white/20 border border-white/10"
                          )}
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX size={18} />
                              Stop Listening
                            </>
                          ) : (
                            <>
                              <Volume2 size={18} />
                              Listen to Explanation
                            </>
                          )}
                        </motion.button>
                      </div>
                    )}
                    <div className="prose prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-slate-300 leading-relaxed text-lg">
                        {aiResponse?.explanation}
                      </div>
                    </div>

                    {aiResponse?.didYouKnow && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 p-4 text-blue-500/20 group-hover:text-blue-500/40 transition-colors">
                          <Info size={48} />
                        </div>
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                          <Sparkles size={18} />
                          <span className="text-xs font-black uppercase tracking-widest">Did You Know?</span>
                        </div>
                        <p className="text-blue-100 text-sm leading-relaxed relative z-10">
                          {aiResponse.didYouKnow}
                        </p>
                      </motion.div>
                    )}

                    {aiResponse?.questions && aiResponse.questions.length > 0 && (
                      <div className="space-y-8 pt-8 border-t border-white/10">
                        <div className="flex items-center gap-3 text-blue-400">
                          <ListChecks size={24} />
                          <h4 className="text-xl font-bold">Quick Practice</h4>
                        </div>

                        <div className="space-y-10">
                          {aiResponse.questions.map((q, qIdx) => (
                            <div key={qIdx} className="space-y-4">
                              <p className="text-white font-bold leading-tight">{qIdx + 1}. {q.text}</p>
                              <div className="grid gap-3">
                                {q.options.map((option, oIdx) => {
                                  const isSelected = userAnswers[qIdx] === oIdx;
                                  const isCorrect = q.correctAnswer === oIdx;
                                  
                                  return (
                                    <button
                                      key={oIdx}
                                      onClick={() => handleAnswerSelect(qIdx, oIdx)}
                                      disabled={showResults}
                                      className={cn(
                                        "w-full p-4 rounded-2xl text-left text-sm transition-all border",
                                        !showResults && isSelected ? "bg-blue-500/20 border-blue-500 text-white" :
                                        !showResults ? "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10" :
                                        isSelected && isCorrect ? "bg-green-500/20 border-green-500 text-green-400" :
                                        isSelected && !isCorrect ? "bg-red-500/20 border-red-500 text-red-400" :
                                        isCorrect ? "bg-green-500/10 border-green-500/30 text-green-400" :
                                        "bg-white/5 border-white/5 text-slate-500 opacity-50"
                                      )}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={cn(
                                          "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border",
                                          isSelected ? "bg-current text-slate-900 border-transparent" : "border-current"
                                        )}>
                                          {String.fromCharCode(65 + oIdx)}
                                        </div>
                                        {option}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                              
                              {showResults && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={cn(
                                    "p-4 rounded-2xl text-sm flex items-start gap-3",
                                    userAnswers[qIdx] === q.correctAnswer ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                                  )}
                                >
                                  {userAnswers[qIdx] === q.correctAnswer ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                                  <p><span className="font-bold">Explanation:</span> {q.explanation}</p>
                                </motion.div>
                              )}
                            </div>
                          ))}
                        </div>

                        {!showResults && Object.keys(userAnswers).length > 0 && (
                          <button 
                            onClick={() => setShowResults(true)}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20"
                          >
                            Check My Answers
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 bg-white/5 border-t border-white/10 flex justify-end">
                <button 
                  onClick={() => {
                    setExplainingTopic(null);
                    if (sourceNodeRef.current) {
                      sourceNodeRef.current.stop();
                      sourceNodeRef.current = null;
                    }
                    setIsSpeaking(false);
                  }}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all"
                >
                  Got it, thanks!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
