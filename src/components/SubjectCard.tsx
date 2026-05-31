import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { Subject } from '../types';
import { cn } from '../lib/utils';

interface SubjectCardProps {
  subject: Subject;
  onClick: () => void;
}

export default function SubjectCard({ subject, onClick }: SubjectCardProps) {
  const Icon = (Icons as any)[subject.icon] || Icons.Book;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 cursor-pointer border border-white/10 backdrop-blur-md transition-all",
        "bg-white/5 hover:bg-white/10"
      )}
      onClick={onClick}
    >
      <div className={cn("mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl text-white", subject.color)}>
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{subject.name}</h3>
      <p className="text-sm text-slate-400 line-clamp-2">{subject.description}</p>
      <div className="mt-4 flex items-center text-xs font-medium text-blue-400">
        <span>Start Learning</span>
        <Icons.ChevronRight size={14} className="ml-1" />
      </div>
    </motion.div>
  );
}
