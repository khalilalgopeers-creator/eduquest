import { useState } from 'react';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { Subject } from '../types';
import { subjects } from '../data/subjects';
import { cn } from '../lib/utils';
import { getSubjectLevel, isJHSSubject, isSHSSubject } from '../utils/subjectHelpers';

interface StudyGuideProps {
  onBack: () => void;
  onSelectSubject: (subject: Subject) => void;
}

export default function StudyGuide({ onBack, onSelectSubject }: StudyGuideProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [subLevelFilter, setSubLevelFilter] = useState<'all' | 'jhs' | 'shs'>('all');

  const filteredSubjects = subjects.filter(subject => {
    if (subLevelFilter === 'jhs' && !isJHSSubject(subject.id)) return false;
    if (subLevelFilter === 'shs' && !isSHSSubject(subject.id)) return false;
    
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = subject.name.toLowerCase().includes(query);
    const topicMatch = subject.syllabus.some(topic => topic.toLowerCase().includes(query));
    return nameMatch || topicMatch;
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-slate-400">
            <Icons.ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-4xl font-black text-white mb-1">Study Guide</h2>
            <p className="text-slate-400">Browse all topics across all subjects.</p>
          </div>
        </div>

        <div className="relative w-full md:w-96 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
            <Icons.Search size={18} />
          </div>
          <input 
            type="text"
            placeholder="Search topics or subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 transition-all backdrop-blur-md"
          />
        </div>
      </div>

      {/* Level filter tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8 justify-between">
        <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl overflow-x-auto gap-1">
          <button
            onClick={() => setSubLevelFilter('all')}
            className={cn(
              "flex-1 sm:flex-none px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap",
              subLevelFilter === 'all'
                ? "bg-slate-800 text-white border border-white/10 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            🎒 All ({subjects.length})
          </button>
          <button
            onClick={() => setSubLevelFilter('jhs')}
            className={cn(
              "flex-1 sm:flex-none px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap",
              subLevelFilter === 'jhs'
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            📝 JHS BECE ({subjects.filter(s => isJHSSubject(s.id)).length})
          </button>
          <button
            onClick={() => setSubLevelFilter('shs')}
            className={cn(
              "flex-1 sm:flex-none px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap",
              subLevelFilter === 'shs'
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            🎓 SHS WASSCE ({subjects.filter(s => isSHSSubject(s.id)).length})
          </button>
        </div>

        <div className="text-xs font-medium text-slate-400 flex items-center gap-1">
          <span>Showing</span>
          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold">{filteredSubjects.length}</span>
          <span>subjects</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredSubjects.map((subject, sIndex) => {
          const Icon = (Icons as any)[subject.icon] || Icons.Book;
          
          return (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sIndex * 0.05 }}
              className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md hover:border-white/20 transition-all group"
            >
              <div className={cn("p-6 flex items-center justify-between border-b border-white/10", subject.color)}>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center text-white">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{subject.name}</h3>
                    <p className="text-white/70 text-xs uppercase tracking-widest font-black">
                      {subject.syllabus.length} Topics
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => onSelectSubject(subject)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all group-hover:translate-x-1"
                >
                  <Icons.ChevronRight size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {subject.syllabus.map((topic, tIndex) => (
                    <div 
                      key={tIndex}
                      className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-default"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500/50 shrink-0" />
                      <span className="truncate">{topic}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                  <div className="flex -space-x-2">
                    {subject.concepts.slice(0, 3).map((_, i) => (
                      <div key={i} className="h-6 w-6 rounded-full bg-white/10 border border-slate-900 flex items-center justify-center">
                        <Icons.GraduationCap size={12} className="text-slate-400" />
                      </div>
                    ))}
                    {subject.concepts.length > 3 && (
                      <div className="h-6 w-6 rounded-full bg-white/5 border border-slate-900 flex items-center justify-center text-[8px] text-slate-500 font-bold">
                        +{subject.concepts.length - 3}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => onSelectSubject(subject)}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredSubjects.length === 0 && (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-slate-400 mb-4">
            <Icons.Search size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No topics found</h3>
          <p className="text-slate-400">Try searching for a different subject or keyword.</p>
        </div>
      )}
    </div>
  );
}
