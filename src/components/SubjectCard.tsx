import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { Subject } from '../types';
import { cn } from '../lib/utils';

interface SubjectCardProps {
  subject: Subject;
  onClick: () => void;
  onGroupStudyClick?: (e: React.MouseEvent) => void;
}

export default function SubjectCard({ subject, onClick, onGroupStudyClick }: SubjectCardProps) {
  const Icon = (Icons as any)[subject.icon] || Icons.Book;

  return (
    <motion.div
      whileHover={{ 
        scale: 1.05, 
        y: -4,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)",
        borderColor: "rgba(255, 255, 255, 0.25)"
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 cursor-pointer border border-white/10 backdrop-blur-md transition-all group",
        "bg-white/5 hover:bg-white/10"
      )}
      onClick={onClick}
    >
      <div className={cn("mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl text-white transition-all group-hover:scale-110", subject.color)}>
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{subject.name}</h3>
      <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed mb-4">{subject.description}</p>
      
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
        <div className="flex items-center text-xs font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
          <span>Start Learning</span>
          <Icons.ChevronRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
        </div>

        {onGroupStudyClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGroupStudyClick(e);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-white border border-purple-500/20 hover:border-purple-500/40 text-xs font-semibold tracking-wide transition-all active:scale-95"
            title="Invite peers or join a collaborative study session"
          >
            <Icons.Users size={12} />
            <span>Group Study</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
