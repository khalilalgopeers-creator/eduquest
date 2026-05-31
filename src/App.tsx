import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, LayoutDashboard, Settings as SettingsIcon, User, Bell, Search, X as CloseIcon } from 'lucide-react';
import ThreeScene from './components/ThreeScene';
import Hero from './components/Hero';
import SubjectCard from './components/SubjectCard';
import SubjectDetail from './components/SubjectDetail';
import QuizEngine from './components/QuizEngine';
import Dashboard from './components/Dashboard';
import StudyGuide from './components/StudyGuide';
import StudyPlanner from './components/StudyPlanner';
import Settings from './components/Settings';
import Legal from './components/Legal';
import AIVsHumanQuiz from './components/AIVsHumanQuiz';
import PastQuestions from './components/PastQuestions';
import { subjects } from './data/subjects';
import { AppState, Subject, UserProgress, Question, ExaminationType } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [state, setState] = useState<AppState>('home');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isAdvancedQuiz, setIsAdvancedQuiz] = useState(false);
  const [isAIQuiz, setIsAIQuiz] = useState(false);
  const [pastQuestions, setPastQuestions] = useState<Question[] | null>(null);
  const [pastYear, setPastYear] = useState<number | undefined>(undefined);
  const [pastExamType, setPastExamType] = useState<ExaminationType | undefined>(undefined);
  const [initialTab, setInitialTab] = useState<string | undefined>(undefined);
  const [progress, setProgress] = useState<UserProgress[]>(() => {
    const savedProgress = localStorage.getItem('eduquest_progress');
    return savedProgress ? JSON.parse(savedProgress) : [];
  });
  const [searchQuery, setSearchQuery] = useState('');

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('eduquest_profile');
    return saved ? JSON.parse(saved) : {
      firstName: 'Khalil',
      lastName: 'Al-Gopeers',
      email: 'khalil.algopeers@gmail.com',
      avatarColor: 'from-blue-500 to-purple-600',
      avatarChar: 'K'
    };
  });

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('eduquest_progress', JSON.stringify(progress));
  }, [progress]);

  // Sync profile & progress reactive updates from localStorage (for resets or direct edits)
  useEffect(() => {
    const handleStorageChange = () => {
      const savedProfile = localStorage.getItem('eduquest_profile');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      } else {
        setProfile({
          firstName: 'Khalil',
          lastName: 'Al-Gopeers',
          email: 'khalil.algopeers@gmail.com',
          avatarColor: 'from-blue-500 to-purple-600',
          avatarChar: 'K'
        });
      }

      const savedProgress = localStorage.getItem('eduquest_progress');
      setProgress(savedProgress ? JSON.parse(savedProgress) : []);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Filter subjects based on search query
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    
    const query = searchQuery.toLowerCase().trim();
    return subjects.filter(subject => {
      const nameMatch = subject.name.toLowerCase().includes(query);
      const conceptMatch = subject.concepts.some(concept => 
        concept.title.toLowerCase().includes(query) || 
        concept.explanation.toLowerCase().includes(query)
      );
      const syllabusMatch = subject.syllabus.some(item => 
        item.toLowerCase().includes(query)
      );
      return nameMatch || conceptMatch || syllabusMatch;
    });
  }, [searchQuery]);

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    setState('subject-detail');
  };

  const handleQuizComplete = (score: number) => {
    if (!selectedSubject) return;

    setProgress(prev => {
      const existing = prev.find(p => p.subjectId === selectedSubject.id);
      const now = new Date().toISOString();
      
      if (existing) {
        return prev.map(p => 
          p.subjectId === selectedSubject.id 
            ? { 
                ...p, 
                score: Math.max(p.score, score), 
                totalAttempts: p.totalAttempts + 1,
                lastAttemptDate: now,
                history: [...p.history, { date: now, score }]
              }
            : p
        );
      }
      return [...prev, { 
        subjectId: selectedSubject.id, 
        completedQuestions: [], 
        score, 
        totalAttempts: 1,
        lastAttemptDate: now,
        history: [{ date: now, score }]
      }];
    });
  };

  return (
    <div className="min-h-screen text-slate-50 font-sans selection:bg-blue-500/30">
      <ThreeScene />
      
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setState('home')}
          >
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
              <GraduationCap size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter">EDUQUEST</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <NavLink active={state === 'home'} onClick={() => setState('home')}>Home</NavLink>
            <NavLink active={state === 'past-questions'} onClick={() => setState('past-questions')}>Past Questions</NavLink>
            <NavLink active={state === 'study-guide'} onClick={() => setState('study-guide')}>Study Guide</NavLink>
            <NavLink active={state === 'study-planner'} onClick={() => setState('study-planner')}>Study Planner</NavLink>
            <NavLink active={state === 'progress'} onClick={() => setState('progress')}>Progress</NavLink>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setInitialTab('notifications');
                setState('settings');
              }}
              className="p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors"
            >
              <Bell size={20} />
            </button>
            <button 
              onClick={() => {
                setInitialTab('general');
                setState('settings');
              }}
              className="p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors"
            >
              <SettingsIcon size={20} />
            </button>
            <div 
              onClick={() => {
                setInitialTab('account');
                setState('settings');
              }}
              className={cn(
                "h-10 w-10 rounded-full bg-gradient-to-br border-2 border-white/20 flex items-center justify-center cursor-pointer hover:scale-105 transition-all text-white font-black text-sm uppercase shadow-md",
                profile.avatarColor || "from-blue-500 to-purple-600"
              )}
            >
              {profile.avatarChar || "K"}
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {state === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Hero 
                onStart={() => {
                  const element = document.getElementById('subjects');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }} 
                onViewProgress={() => setState('progress')}
                onViewStudyGuide={() => setState('study-guide')}
                onViewStudyPlanner={() => setState('study-planner')}
                onStartAIDuel={() => {
                  if (!selectedSubject) setSelectedSubject(subjects[0]);
                  setState('ai-vs-human');
                }}
                onViewPastQuestions={() => setState('past-questions')}
                onStartBECEQuickPractice={() => {
                  const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
                  setSelectedSubject(randomSubject);
                  setState('past-questions');
                }}
              />
              
              <div id="subjects" className="mt-24">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-6">
                  <div>
                    <h2 className="text-4xl font-black text-white mb-2">Choose Your Subject</h2>
                    <p className="text-slate-400">Select a subject to start your practice quiz.</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-80 group">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                        <Search size={18} />
                      </div>
                      <input 
                        type="text"
                        placeholder="Search subjects or topics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 transition-all backdrop-blur-md"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-white transition-colors"
                        >
                          <CloseIcon size={16} />
                        </button>
                      )}
                    </div>

                    <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-slate-300 whitespace-nowrap">
                      {subjects.length} Subjects Available
                    </div>
                  </div>
                </div>
                
                {filteredSubjects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredSubjects.map((subject) => (
                      <SubjectCard 
                        key={subject.id} 
                        subject={subject} 
                        onClick={() => handleSubjectSelect(subject)}
                      />
                    ))}
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md"
                  >
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-slate-400 mb-4">
                      <Search size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No subjects found</h3>
                    <p className="text-slate-400">Try searching for something else, like "Math" or "Photosynthesis".</p>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="mt-6 text-blue-400 font-bold hover:text-blue-300 transition-colors"
                    >
                      Clear Search
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {state === 'subject-detail' && selectedSubject && (
            <motion.div
              key="subject-detail"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
            >
              <SubjectDetail 
                subject={selectedSubject}
                onBack={() => setState('home')}
                onStartQuiz={(advanced, ai) => {
                  setIsAdvancedQuiz(advanced);
                  setIsAIQuiz(ai);
                  setState('quiz');
                }}
                onStartAIDuel={() => setState('ai-vs-human')}
                onStartPastQuestions={() => setState('past-questions')}
              />
            </motion.div>
          )}

          {state === 'quiz' && selectedSubject && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <QuizEngine 
                subject={selectedSubject} 
                isAdvanced={isAdvancedQuiz}
                isAI={isAIQuiz}
                initialQuestions={pastQuestions || undefined}
                year={pastYear}
                examType={pastExamType}
                onComplete={handleQuizComplete}
                onExit={() => {
                  setPastQuestions(null);
                  setPastYear(undefined);
                  setPastExamType(undefined);
                  setState('home');
                }}
              />
            </motion.div>
          )}

          {state === 'past-questions' && (
            <motion.div
              key="past-questions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <PastQuestions 
                onBack={() => setState('home')}
                onStartQuiz={(questions, subject, year, type) => {
                  setPastQuestions(questions);
                  setPastYear(year);
                  setPastExamType(type);
                  setSelectedSubject(subject);
                  setState('quiz');
                }}
              />
            </motion.div>
          )}

          {state === 'ai-vs-human' && selectedSubject && (
            <motion.div
              key="ai-vs-human"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
            >
              <AIVsHumanQuiz 
                subject={selectedSubject}
                onComplete={handleQuizComplete}
                onExit={() => setState('home')}
              />
            </motion.div>
          )}

          {state === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Dashboard 
                progress={progress} 
                onBack={() => setState('home')}
                onViewStudyPlanner={() => setState('study-planner')}
                onViewPastQuestions={() => setState('past-questions')}
              />
            </motion.div>
          )}

          {state === 'study-guide' && (
            <motion.div
              key="study-guide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <StudyGuide 
                onBack={() => setState('home')}
                onSelectSubject={handleSubjectSelect}
              />
            </motion.div>
          )}

          {state === 'study-planner' && (
            <motion.div
              key="study-planner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
            >
              <StudyPlanner 
                progress={progress} 
                onBack={() => setState('home')}
              />
            </motion.div>
          )}

          {state === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Settings 
                onBack={() => setState('home')}
                onNavigate={(target) => setState(target as any)}
                initialTab={initialTab as any}
              />
            </motion.div>
          )}

          {(state === 'privacy' || state === 'terms' || state === 'help') && (
            <motion.div
              key="legal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Legal 
                onBack={() => setState('home')}
                initialTab={state as any}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950/50 backdrop-blur-xl py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <GraduationCap size={18} />
            </div>
            <span className="text-xl font-black tracking-tighter">EDUQUEST</span>
          </div>
          <p className="text-slate-500 text-sm">
            © 2026 EduQuest. Built for future leaders. Simple English, Advanced Learning.
          </p>
          <div className="flex gap-6 text-slate-400">
            <button onClick={() => setState('privacy')} className="hover:text-white transition-colors">Privacy</button>
            <button onClick={() => setState('terms')} className="hover:text-white transition-colors">Terms</button>
            <button onClick={() => setState('help')} className="hover:text-white transition-colors">Help</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "text-sm font-bold tracking-wide uppercase transition-all relative py-2",
        active ? "text-white" : "text-slate-400 hover:text-slate-200"
      )}
    >
      {children}
      {active && (
        <motion.div 
          layoutId="nav-active"
          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full"
        />
      )}
    </button>
  );
}
