import React from 'react';
import { TodoistTask, QuadrantType, QUADRANTS } from '../types';
import { TaskCard } from './TaskCard';
import { InlineAddTask } from './InlineAddTask';
import { AlertTriangle, Calendar, Users, Trash2, CheckCircle, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDroppable } from '@dnd-kit/core';

interface QuadrantBoxProps {
  quadrant: QuadrantType;
  tasks: TodoistTask[];
  onUpdateQuadrant: (taskId: string, targetQuadrant: QuadrantType) => void;
  onCompleteTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (content: string, description: string, quadrant: QuadrantType) => Promise<boolean>;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onDragStartTask: () => void;
  isHidden?: boolean;
}

export function QuadrantBox({
  quadrant,
  tasks,
  onUpdateQuadrant,
  onCompleteTask,
  onDeleteTask,
  onAddTask,
  isMaximized,
  onToggleMaximize,
  onDragStartTask,
  isHidden = false
}: QuadrantBoxProps) {
  const definition = QUADRANTS[quadrant];
  const { setNodeRef, isOver } = useDroppable({
    id: quadrant,
  });

  const isDragOver = isOver;

  // Dynamic Lucide selection based on definition string
  const renderIcon = () => {
    const iconClass = `w-5 h-5`;
    switch (quadrant) {
      case 'Q1':
        return <AlertTriangle className={`${iconClass} text-rose-400`} />;
      case 'Q2':
        return <Calendar className={`${iconClass} text-amber-400`} />;
      case 'Q3':
        return <Users className={`${iconClass} text-sky-400`} />;
      case 'Q4':
        return <Trash2 className={`${iconClass} text-slate-400`} />;
    }
  };

  // Border/Border tint styles based on quadrant
  const getThemeClasses = () => {
    switch (quadrant) {
      case 'Q1':
        return {
          wrapper: 'border-l-rose-400 hover:border-l-rose-500 border-gray-200 dark:border-l-rose-500/90 dark:hover:border-l-rose-400 dark:border-slate-800 bg-white dark:bg-[#0f1320] shadow-sm dark:shadow-none',
          wrapperDrag: 'border-rose-300 dark:border-rose-400 bg-rose-50 dark:bg-rose-950/20 shadow-[0_0_20px_rgba(244,63,94,0.15)] ring-2 ring-rose-300/30 dark:ring-rose-500/30 scale-[1.01]',
          badge: 'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
          descColor: 'text-rose-500/60 dark:text-rose-400/30'
        };
      case 'Q2':
        return {
          wrapper: 'border-l-amber-400 hover:border-l-amber-500 border-gray-200 dark:border-l-amber-500/90 dark:hover:border-l-amber-400 dark:border-slate-800 bg-white dark:bg-[#0f1320] shadow-sm dark:shadow-none',
          wrapperDrag: 'border-amber-300 dark:border-amber-400 bg-amber-50 dark:bg-amber-950/20 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-2 ring-amber-300/30 dark:ring-amber-500/30 scale-[1.01]',
          badge: 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
          descColor: 'text-amber-500/60 dark:text-amber-400/30'
        };
      case 'Q3':
        return {
          wrapper: 'border-l-sky-400 hover:border-l-sky-500 border-gray-200 dark:border-l-sky-500/90 dark:hover:border-l-sky-400 dark:border-slate-800 bg-white dark:bg-[#0f1320] shadow-sm dark:shadow-none',
          wrapperDrag: 'border-sky-300 dark:border-sky-400 bg-sky-50 dark:bg-sky-950/20 shadow-[0_0_20px_rgba(14,165,233,0.15)] ring-2 ring-sky-300/30 dark:ring-sky-500/30 scale-[1.01]',
          badge: 'bg-sky-100 text-sky-600 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
          descColor: 'text-sky-500/60 dark:text-sky-400/30'
        };
      case 'Q4':
        return {
          wrapper: 'border-l-slate-300 hover:border-l-slate-400 border-gray-200 dark:border-l-slate-400/90 dark:hover:border-l-slate-300 dark:border-slate-800 bg-white dark:bg-[#0f1320] shadow-sm dark:shadow-none',
          wrapperDrag: 'border-slate-200 dark:border-slate-300 bg-slate-50 dark:bg-slate-900 shadow-[0_0_20px_rgba(148,163,184,0.15)] ring-2 ring-slate-300/30 dark:ring-slate-400/30 scale-[1.01]',
          badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
          descColor: 'text-slate-500/60 dark:text-slate-400/30'
        };
    }
  };

  const theme = getThemeClasses();

  return (
    <div
      ref={setNodeRef}
      id={`quadrant-box-${quadrant}`}
      style={{ touchAction: 'none' }}
      className={`flex flex-col border-l-4 border-t border-b border-r rounded-lg transition-all duration-200 ${
        isHidden ? 'hidden' : ''
      } ${
        isMaximized 
          ? 'px-2 py-2.5 sm:px-3 sm:py-3.5 min-h-[460px] xs:min-h-[520px] sm:min-h-[620px]' 
          : 'px-1 py-1.5 sm:px-1.5 sm:py-2 min-h-[280px] xs:min-h-[330px] sm:min-h-[390px]'
      } ${
        isDragOver ? `${theme.wrapperDrag} active-drop` : theme.wrapper
      }`}
    >
      {/* Quadrant Header */}
      <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-gray-100 dark:border-slate-800/80 gap-1 select-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="p-0.5 sm:p-1 rounded bg-gray-50 dark:bg-slate-950/80 border border-gray-200 dark:border-slate-800/80 shadow-inner shrink-0">
            {renderIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h3 className="text-[11px] sm:text-xs font-bold tracking-tight text-gray-900 dark:text-gray-100 uppercase font-display truncate">
                {definition.id} · {definition.name}
              </h3>
            </div>
            <p className={`text-[9px] sm:text-[10px] leading-tight ${theme.descColor} font-mono mt-0.5 truncate hidden xs:block`}>
              {definition.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Maximize/Minimize Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMaximize();
            }}
            className="p-1 rounded bg-gray-50 dark:bg-slate-900/50 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700/80 text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-all duration-150 cursor-pointer"
            title={isMaximized ? 'Minimize Quadrant' : 'Maximize Quadrant'}
          >
            {isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Badge showing task totals */}
          <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-bold border font-mono shadow-inner shrink-0 ${theme.badge}`}>
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Task List container */}
      <div className={`flex-1 overflow-y-auto space-y-1.5 pr-0.5 mb-1.5 ${
        isMaximized ? 'max-h-[600px] sm:max-h-[750px]' : 'max-h-[360px] sm:max-h-[460px]'
      }`}>
        <AnimatePresence mode="popLayout">
          {tasks.length === 0 ? (
            <motion.div
              key={`empty-${quadrant}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="h-14 sm:h-20 border border-dashed border-gray-300 dark:border-slate-800/50 rounded flex flex-col items-center justify-center p-1.5 text-center select-none bg-gray-50 dark:bg-slate-900/20"
            >
              <CheckCircle className="w-3.5 h-3.5 text-gray-400 dark:text-slate-700 mb-0.5 stroke-[1.5]" />
              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">ALL CLEAR</span>
            </motion.div>
          ) : (
            tasks.map((task) => (
              <motion.div key={task.id} style={{ touchAction: 'none' }}>
                <TaskCard
                  task={task}
                  onUpdateQuadrant={onUpdateQuadrant}
                  onCompleteTask={onCompleteTask}
                  onDeleteTask={onDeleteTask}
                  showFullDetails={isMaximized}
                  onDragStart={onDragStartTask}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Inline Form to add code */}
      <div className="mt-auto pt-1.5 border-t border-gray-100 dark:border-slate-800/80">
        <InlineAddTask quadrant={quadrant} onAddTask={onAddTask} />
      </div>
    </div>
  );
}
