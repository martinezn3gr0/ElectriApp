import { motion } from 'motion/react';
import { Navigation, Timer, MessageSquareText, BadgeCheck, Star } from 'lucide-react';
import { format } from 'date-fns';
import { Project } from '../types';
import { cn } from '../lib/utils';

interface ProjectCardProps {
  project: Project;
  onAccept?: (id: string) => void;
  onComplete?: (id: string) => void;
  onReview?: (project: Project) => void;
  onChat?: (project: Project) => void;
  isClient?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onAccept,
  onComplete,
  onReview,
  onChat,
  isClient,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:border-blue-600/50 transition-all group"
    >
      <div className="flex justify-between items-start mb-4">
        <span
          className={cn(
            'px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full',
            project.category === 'commercial'
              ? 'bg-blue-500/20 text-blue-400'
              : project.category === 'industrial'
                ? 'bg-purple-500/20 text-purple-400'
                : project.category === 'emergency'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-green-500/20 text-green-400'
          )}
        >
          {project.category === 'residential'
            ? 'Residencial'
            : project.category === 'commercial'
              ? 'Comercial'
              : project.category === 'industrial'
                ? 'Industrial'
                : 'Emergencia'}
        </span>
        <div className="flex flex-col items-end">
          <span className="text-xl font-black text-blue-600">${project.budget.toLocaleString()}</span>
          <span
            className={cn(
              'text-[10px] font-bold uppercase mt-1',
              project.status === 'open'
                ? 'text-green-400'
                : project.status === 'in-progress'
                  ? 'text-blue-400'
                  : project.status === 'completed'
                    ? 'text-white/40'
                    : 'text-red-400'
            )}
          >
            {project.status === 'open'
              ? 'Abierto'
              : project.status === 'in-progress'
                ? 'En progreso'
                : project.status === 'completed'
                  ? 'Completado'
                  : 'Cancelado'}
          </span>
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-600 transition-colors">{project.title}</h3>
      <p className="text-white/50 text-sm mb-6 line-clamp-2">{project.description}</p>

      <div className="flex items-center gap-4 text-xs text-white/40 mb-6">
        <div className="flex items-center gap-1">
          <Navigation className="w-3 h-3" /> {project.location}
        </div>
        <div className="flex items-center gap-1">
          <Timer className="w-3 h-3" /> {format(new Date(project.createdAt), 'MMM d')}
        </div>
      </div>

      <div className="space-y-2">
        {onAccept && project.status === 'open' && (
          <button
            onClick={() => onAccept(project.id)}
            className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-blue-600 transition-all"
          >
            Aceptar proyecto
          </button>
        )}

        {project.status === 'in-progress' && onChat && (
          <button
            onClick={() => onChat(project)}
            className="w-full py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
            <MessageSquareText className="w-4 h-4" /> Chat del proyecto
          </button>
        )}

        {project.status === 'in-progress' && onComplete && (
          <button
            onClick={() => onComplete(project.id)}
            className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-400 transition-all flex items-center justify-center gap-2"
          >
            <BadgeCheck className="w-4 h-4" /> Marcar como completado
          </button>
        )}

        {isClient && project.status === 'completed' && onReview && (
          <button
            onClick={() => onReview(project)}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
          >
            <Star className="w-4 h-4" /> Dejar reseña
          </button>
        )}
      </div>
    </motion.div>
  );
};
