import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, BookOpen, ListChecks, Play, Zap, Sparkles, Loader2, X, CheckCircle2, AlertCircle, Volume2, VolumeX, Info, Brain, History, Beaker, Award } from 'lucide-react';
import { Subject, AIExplanationResponse } from '../types';
import { cn } from '../lib/utils';
import { generateDetailedExplanation, generateSpeech } from '../lib/gemini';

interface SubjectDetailProps {
  subject: Subject;
  onBack: () => void;
  onStartQuiz: (isAdvanced: boolean, isAI: boolean) => void;
  onStartAIDuel: () => void;
  onStartPastQuestions: () => void;
  onStartMockExam: () => void;
}

export default function SubjectDetail({ subject, onBack, onStartQuiz, onStartAIDuel, onStartPastQuestions, onStartMockExam }: SubjectDetailProps) {
  const [explainingConcept, setExplainingConcept] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<AIExplanationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`completed_topics_${subject.id}`);
    if (saved) {
      try {
        setCompletedTopics(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load completed topics", e);
      }
    }
  }, [subject.id]);

  const toggleTopicCompletion = (topic: string) => {
    setCompletedTopics(prev => {
      const next = prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic];
      localStorage.setItem(`completed_topics_${subject.id}`, JSON.stringify(next));
      return next;
    });
  };

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

  const handleGetAIExplanation = async (conceptTitle: string, currentExplanation: string) => {
    setIsLoading(true);
    setExplainingConcept(conceptTitle);
    setAiResponse(null);
    setError(null);
    setUserAnswers({});
    setShowResults(false);
    
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
      setIsSpeaking(false);
    }

    try {
      const result = await generateDetailedExplanation(subject.name, conceptTitle, currentExplanation);
      setAiResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
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
      
      // I'll use the Web Audio API to play the raw PCM.
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const audioContext = audioContextRef.current;
      const arrayBuffer = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0)).buffer;
      
      // PCM 16-bit Little Endian
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-slate-400">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-3xl font-bold text-white">{subject.name}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Syllabus & Info */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-blue-400">
                <ListChecks size={24} />
                <h3 className="text-xl font-bold">Syllabus Overview</h3>
              </div>
              <div className="text-right">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Progress</p>
                <p className="text-lg font-bold text-white">
                  {Math.round((completedTopics.length / subject.syllabus.length) * 100)}%
                </p>
              </div>
            </div>

            <div className="w-full h-2 bg-white/5 rounded-full mb-8 overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(completedTopics.length / subject.syllabus.length) * 100}%` }}
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
              />
            </div>

            <ul className="space-y-4">
              {subject.syllabus.map((item, index) => {
                const isCompleted = completedTopics.includes(item);
                return (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "flex items-start gap-3 transition-all cursor-pointer group",
                      isCompleted ? "text-slate-500" : "text-slate-300"
                    )}
                    onClick={() => toggleTopicCompletion(item)}
                  >
                    <div className="flex items-center justify-between w-full gap-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "mt-1.5 h-4 w-4 rounded-md border flex items-center justify-center transition-all shrink-0",
                          isCompleted 
                            ? "bg-green-500 border-green-500 text-white" 
                            : "border-white/20 group-hover:border-blue-500/50"
                        )}>
                          {isCompleted && <CheckCircle2 size={12} />}
                        </div>
                        <span className={cn(
                          "transition-all",
                          isCompleted && "line-through decoration-slate-600"
                        )}>{item}</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGetAIExplanation(item, `Explain the topic: ${item} in the context of ${subject.name}`);
                        }}
                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20 shrink-0 opacity-0 group-hover:opacity-100"
                      >
                        <Sparkles size={10} />
                        AI Explain
                      </button>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-6 text-purple-400">
              <BookOpen size={24} />
              <h3 className="text-xl font-bold">Core Concepts</h3>
            </div>
            <div className="space-y-6">
              {subject.concepts.map((concept, index) => (
                <div key={index} className="border-l-2 border-purple-500/30 pl-4 group relative">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h4 className="font-bold text-white">{concept.title}</h4>
                    <button 
                      onClick={() => handleGetAIExplanation(concept.title, concept.explanation)}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/20"
                    >
                      <Sparkles size={12} />
                      AI Explain
                    </button>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{concept.explanation}</p>
                </div>
              ))}
            </div>
          </section>

          {subject.advancedConcepts && subject.advancedConcepts.length > 0 && (
            <section className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-8 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-6 text-indigo-400">
                <Zap size={24} />
                <h3 className="text-xl font-bold">Advanced Topics</h3>
              </div>
              <div className="space-y-6">
                {subject.advancedConcepts.map((concept, index) => (
                  <div key={index} className="border-l-2 border-indigo-500/50 pl-4">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <h4 className="font-bold text-indigo-200">{concept.title}</h4>
                      <button 
                        onClick={() => handleGetAIExplanation(concept.title, concept.explanation)}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20"
                      >
                        <Sparkles size={12} />
                        AI Explain
                      </button>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{concept.explanation}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {subject.examples && subject.examples.length > 0 && (
            <section className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-6 text-green-400">
                <Info size={24} />
                <h3 className="text-xl font-bold">Worked Examples</h3>
              </div>
              <div className="space-y-6">
                {subject.examples.map((example, index) => (
                  <div key={index} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h4 className="font-bold text-white mb-3">{example.title}</h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Problem</p>
                        <p className="text-slate-300 text-sm">{example.problem}</p>
                      </div>
                      <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                        <p className="text-xs font-black uppercase tracking-widest text-green-500 mb-2">Solution</p>
                        <p className="text-green-100 text-sm">{example.solution}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {subject.practicals && subject.practicals.length > 0 && (
            <section className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-6 text-orange-400">
                <Beaker size={24} />
                <h3 className="text-xl font-bold">Practical Lab</h3>
              </div>
              <div className="space-y-6">
                {subject.practicals.map((practical, index) => (
                  <div key={index} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h4 className="font-bold text-white mb-4">{practical.title}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest text-orange-500">Objective</p>
                        <p className="text-slate-300 text-sm">{practical.objective}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest text-orange-500">Apparatus</p>
                        <div className="flex flex-wrap gap-2">
                          {practical.apparatus.map((item, i) => (
                            <span key={i} className="px-2 py-1 bg-white/5 rounded-md text-[10px] text-slate-400 border border-white/10">{item}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest text-orange-500">Procedure</p>
                        <ol className="list-decimal list-inside space-y-1 text-slate-400 text-sm">
                          {practical.procedure.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                          <p className="text-xs font-black uppercase tracking-widest text-blue-500 mb-2">Observations</p>
                          <p className="text-blue-100 text-sm">{practical.observations}</p>
                        </div>
                        <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                          <p className="text-xs font-black uppercase tracking-widest text-purple-500 mb-2">Conclusion</p>
                          <p className="text-purple-100 text-sm">{practical.conclusion}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* End of Subject Completion Challenge */}
          <section className="bg-gradient-to-r from-blue-600/10 via-purple-600/15 to-indigo-600/10 border border-blue-500/20 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 p-6 text-blue-500/10 pointer-events-none">
              <Award size={120} />
            </div>
            <div className="relative z-10 max-w-xl">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest mb-4 inline-block">
                Syllabus Final Challenge
              </span>
              <h3 className="text-2xl font-black text-white mb-2">Ready for the Exam Hall?</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Now that you've reviewed the syllabus and concepts for {subject.name}, put your skills to the ultimate test in the National Mock Center. Get graded against real WAEC/BECE standards with instant results.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStartMockExam}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all text-sm"
              >
                <Award size={18} className="text-yellow-400" fill="currentColor" />
                Launch {subject.name} Mock Exam
              </motion.button>
            </div>
          </section>
        </div>

        {/* Right Column: Action Card */}
        <div className="space-y-6">
          <div className={cn("rounded-3xl p-8 text-white shadow-xl", subject.color)}>
            <h3 className="text-2xl font-black mb-4">Ready to Practice?</h3>
            <p className="text-white/80 mb-8 text-sm">
              Test your knowledge with practice questions designed for BECE and WASSCE standards.
            </p>
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onStartQuiz(false, false)}
                className="w-full py-4 bg-white text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <Play size={20} fill="currentColor" />
                Standard Quiz
              </motion.button>

              {subject.advancedQuestions && subject.advancedQuestions.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onStartQuiz(true, false)}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg border border-indigo-400/30"
                >
                  <Zap size={20} fill="currentColor" />
                  Advanced Quiz
                </motion.button>
              )}

              <div className="pt-4 border-t border-white/20 space-y-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onStartQuiz(false, true)}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg border border-white/20"
                >
                  <Sparkles size={20} />
                  AI Generated Quiz
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onStartMockExam}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg border border-blue-400/30"
                >
                  <Award size={20} className="text-yellow-400" />
                  National Mock Exam
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onStartPastQuestions}
                  className="w-full py-4 bg-white/5 border border-white/20 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                >
                  <History size={20} className="text-blue-400" />
                  Past Questions (1990-2025)
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onStartAIDuel}
                  className="w-full py-4 bg-white/5 border border-white/20 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                >
                  <Brain size={20} className="text-purple-400" />
                  AI vs Human Duel
                </motion.button>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
            <h4 className="font-bold text-white mb-4">Study Tips</h4>
            <ul className="text-xs text-slate-400 space-y-3">
              <li>• Read each question carefully before answering.</li>
              <li>• Use the explanations to learn from your mistakes.</li>
              <li>• Try to beat your high score in every attempt.</li>
              <li>• Master core concepts before attempting advanced topics.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* AI Explanation Modal */}
      <AnimatePresence>
        {explainingConcept && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isLoading && setExplainingConcept(null)}
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
                    <h3 className="text-xl font-bold text-white">{explainingConcept}</h3>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-black">AI Tutor Deep Dive</p>
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
                      setExplainingConcept(null);
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
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 size={48} className="text-purple-500 animate-spin" />
                    <p className="text-slate-400 font-medium animate-pulse">Consulting the AI Tutor...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <X size={32} />
                    </div>
                    <p className="text-red-400 font-medium">{error}</p>
                    <button 
                      onClick={() => handleGetAIExplanation(explainingConcept, subject.concepts.find(c => c.title === explainingConcept)?.explanation || "")}
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
                    setExplainingConcept(null);
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
