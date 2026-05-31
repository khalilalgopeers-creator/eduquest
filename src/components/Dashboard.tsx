import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { UserProgress, Subject } from '../types';
import { subjects } from '../data/subjects';
import { cn } from '../lib/utils';

interface DashboardProps {
  progress: UserProgress[];
  onBack: () => void;
  onViewStudyPlanner: () => void;
  onViewPastQuestions: () => void;
}

export default function Dashboard({ progress, onBack, onViewStudyPlanner, onViewPastQuestions }: DashboardProps) {
  const totalScore = progress.reduce((acc, p) => acc + p.score, 0);
  const totalAttempts = progress.reduce((acc, p) => acc + p.totalAttempts, 0);
  const completedSubjects = progress.length;

  // Prepare data for the performance chart
  const performanceData = progress.map(p => {
    const subject = subjects.find(s => s.id === p.subjectId);
    return {
      name: subject?.name || 'Unknown',
      score: Math.round((p.score / (subject?.questions.length || 1)) * 100),
      color: subject?.color.replace('bg-', '') || 'blue-500'
    };
  });

  // Calculate strengths and weaknesses
  const strengths = progress
    .filter(p => {
      const subject = subjects.find(s => s.id === p.subjectId);
      return (p.score / (subject?.questions.length || 1)) >= 0.7;
    })
    .map(p => subjects.find(s => s.id === p.subjectId)?.name);

  const weaknesses = progress
    .filter(p => {
      const subject = subjects.find(s => s.id === p.subjectId);
      return (p.score / (subject?.questions.length || 1)) < 0.5;
    })
    .map(p => subjects.find(s => s.id === p.subjectId)?.name);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-slate-400">
          <Icons.ArrowLeft size={24} />
        </button>
        <h2 className="text-3xl font-black text-white tracking-tight">Your Learning Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard icon={Icons.Trophy} label="Total Score" value={totalScore} color="text-yellow-400" />
        <StatCard icon={Icons.Target} label="Subjects Mastered" value={completedSubjects} color="text-green-400" />
        <StatCard icon={Icons.Clock} label="Total Attempts" value={totalAttempts} color="text-blue-400" />
      </div>

      {/* AI Study Planner & Past Questions CTA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="p-8 rounded-[40px] bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 backdrop-blur-xl flex flex-col items-start justify-between gap-8"
        >
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-3xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Icons.Sparkles size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white mb-1">AI Study Planner</h3>
              <p className="text-slate-400 text-sm">Get a personalized schedule based on your performance.</p>
            </div>
          </div>
          <button 
            onClick={onViewStudyPlanner}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-600/20 transition-all"
          >
            Open AI Planner
          </button>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="p-8 rounded-[40px] bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 backdrop-blur-xl flex flex-col items-start justify-between gap-8"
        >
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-3xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Icons.History size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white mb-1">Past Questions</h3>
              <p className="text-slate-400 text-sm">Practice with BECE & WASSCE questions from 1990-2025.</p>
            </div>
          </div>
          <button 
            onClick={onViewPastQuestions}
            className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-purple-600/20 transition-all"
          >
            Browse Library
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Balance Radar Chart */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-8 text-purple-400">
            <Icons.Hexagon size={24} />
            <h3 className="text-xl font-bold">Knowledge Balance</h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceData}>
                <PolarGrid stroke="#ffffff10" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Mastery"
                  dataKey="score"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.5}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff20', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-8 text-blue-400">
            <Icons.TrendingUp size={24} />
            <h3 className="text-xl font-bold">Performance by Subject</h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#94a3b8' }}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#94a3b8' }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff20', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`var(--color-${entry.color})`} className={cn("fill-blue-500")} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* New Visualizations: Mastery Distribution & Learning Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-8 text-green-400">
            <Icons.BarChart3 size={24} />
            <h3 className="text-xl font-bold">Mastery Distribution</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { level: 'Novice (<50%)', count: progress.filter(p => (p.score / subjects.find(s => s.id === p.subjectId)!.questions.length) < 0.5).length },
                { level: 'Competent (50-80%)', count: progress.filter(p => {
                  const ratio = p.score / subjects.find(s => s.id === p.subjectId)!.questions.length;
                  return ratio >= 0.5 && ratio < 0.8;
                }).length },
                { level: 'Master (>80%)', count: progress.filter(p => (p.score / subjects.find(s => s.id === p.subjectId)!.questions.length) >= 0.8).length },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="level" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff20', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-8 text-yellow-400">
            <Icons.Activity size={24} />
            <h3 className="text-xl font-bold">Learning Activity (Last 7 Days)</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { day: 'Mon', activity: 4 },
                { day: 'Tue', activity: 7 },
                { day: 'Wed', activity: 5 },
                { day: 'Thu', activity: 12 },
                { day: 'Fri', activity: 8 },
                { day: 'Sat', activity: 15 },
                { day: 'Sun', activity: 10 },
              ]}>
                <defs>
                  <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff20', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="activity" stroke="#eab308" fillOpacity={1} fill="url(#colorActivity)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Insights */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-6 text-green-400">
              <Icons.CheckCircle2 size={24} />
              <h3 className="text-xl font-bold">Your Strengths</h3>
            </div>
            {strengths.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {strengths.map((s, i) => (
                  <span key={i} className="px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic">Keep practicing to find your strengths!</p>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-6 text-red-400">
              <Icons.AlertCircle size={24} />
              <h3 className="text-xl font-bold">Areas for Improvement</h3>
            </div>
            {weaknesses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {weaknesses.map((s, i) => (
                  <span key={i} className="px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic">No major weaknesses found. Great job!</p>
            )}
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-bold text-white mb-8">Detailed Breakdown</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjects.map(subject => {
          const subjectProgress = progress.find(p => p.subjectId === subject.id);
          const score = subjectProgress?.score || 0;
          const percentage = Math.round((score / subject.questions.length) * 100) || 0;
          const Icon = (Icons as any)[subject.icon] || Icons.Star;

          return (
            <div key={subject.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-6 group hover:bg-white/10 transition-all">
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-110", subject.color)}>
                <Icon size={24} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-end mb-2">
                  <h4 className="font-bold text-white">{subject.name}</h4>
                  <span className="text-sm font-medium text-slate-400">{percentage}% Mastered</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={cn("h-full", subject.color)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center backdrop-blur-md hover:bg-white/10 transition-all">
      <div className={cn("mx-auto mb-4 h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center", color)}>
        <Icon size={28} />
      </div>
      <div className="text-4xl font-black text-white mb-1">{value}</div>
      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</div>
    </div>
  );
}
