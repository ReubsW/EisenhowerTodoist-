import React, { useState, useRef, useEffect } from 'react';
import { TodoistTask, QuadrantType, getQuadrantFromTodoistPriority } from '../types';
import { Check, Trash2, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface TaskCardProps {
  task: TodoistTask;
  onUpdateQuadrant: (taskId: string, targetQuadrant: QuadrantType) => void;
  onCompleteTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  showFullDetails?: boolean;
  onDragStart?: () => void;
}

export function TaskCard({ 
  task, 
  onUpdateQuadrant, 
  onCompleteTask, 
  onDeleteTask,
  showFullDetails = false,
  onDragStart
}: TaskCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentQuadrant = getQuadrantFromTodoistPriority(task.priority);

  const handleComplete = async () => {
    setIsCompleting(true);
    setTimeout(() => {
      onCompleteTask(task.id);
    }, 450);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task from Todoist?")) {
      setIsDeleting(true);
      onDeleteTask(task.id);
    }
  };

  return (
    <motion.div
      layout
      layoutId={`task-card-wrapper-${task.id}`}
      id={`task-card-${task.id}`}
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 0.92, 
        x: isCompleting ? 24 : 0, 
        y: isDeleting ? -12 : 12,
        transition: { duration: 0.25, ease: 'easeOut' }
      }}
      transition={{
        layout: { type: 'spring', stiffness: 350, damping: 28 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 }
      }}
    >
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', task.id);
          e.dataTransfer.effectAllowed = 'move';
          if (onDragStart) {
            onDragStart();
          }
          // Delay visual fade slightly so the browser doesn't snapshot a semi-transparent element as the drag image
          const target = e.currentTarget;
          setTimeout(() => {
            target.classList.add('opacity-40');
          }, 0);
        }}
        onDragEnd={(e) => {
          e.currentTarget.classList.remove('opacity-40');
        }}
        className="relative group bg-[#0e111d]/50 hover:bg-[#13182a]/60 border border-[#1e293b]/50 hover:border-[#334155]/60 rounded-md py-1.5 pl-1.5 pr-2 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-150"
      >
      <div className="flex items-center gap-1.5 min-w-0 w-full pr-1">
        {/* Checkbox button */}
        <button
          onClick={handleComplete}
          disabled={isCompleting || isDeleting}
          className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center cursor-pointer transition-all shrink-0 hover:scale-105 active:scale-95 ${
            task.priority === 4 
              ? 'border-rose-500/40 hover:bg-rose-500/10' 
              : task.priority === 3
              ? 'border-amber-500/40 hover:bg-amber-500/10'
              : task.priority === 2
              ? 'border-sky-500/40 hover:bg-sky-500/10'
              : 'border-slate-500/40 hover:bg-slate-500/10'
          }`}
          title="Mark complete"
        >
          <Check className="h-2 w-2 text-emerald-400 opacity-0 group-hover:opacity-30 hover:!opacity-100 transition-opacity" />
        </button>

        {/* Core Content Column */}
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <div className="flex flex-col min-w-0 gap-0.5">
            {task.url ? (
              <a
                href={task.url}
                target="_blank"
                rel="noreferrer"
                className={`block text-[11.5px] sm:text-[12px] font-medium text-slate-100 hover:text-rose-400 hover:underline transition-colors break-words overflow-hidden leading-snug ${
                  showFullDetails ? '' : 'line-clamp-2'
                }`}
                title="Open in Todoist"
              >
                {task.content}
              </a>
            ) : (
              <p
                className={`text-[11.5px] sm:text-[12px] font-medium text-slate-100 break-words overflow-hidden leading-snug ${
                  showFullDetails ? '' : 'line-clamp-2'
                }`}
                title={task.content}
              >
                {task.content}
              </p>
            )}

            {showFullDetails && task.description && (
              <p className="text-[10px] sm:text-[10.5px] text-slate-400 break-words leading-relaxed mt-1 font-light bg-slate-950/40 p-1.5 rounded border border-slate-900/40">
                {task.description}
              </p>
            )}
          </div>

          {/* Sub-line metadata (if they have due date or labels) */}
          {(task.due || (task.labels && task.labels.length > 0)) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 select-none text-[8.5px] leading-none">
              {/* Due date if active */}
              {task.due && (
                <span className={`px-0.5 py-0.2 rounded border font-mono flex items-center gap-0.5 shrink-0 ${
                  new Date(task.due.date) < new Date() && !task.is_completed
                    ? 'text-rose-400 bg-rose-950/20 border-rose-500/30'
                    : 'text-gray-400 bg-slate-800/40 border-slate-700/30'
                }`}>
                  <Calendar className="w-2 h-2 shrink-0 text-gray-500" />
                  <span className="truncate max-w-[70px]">{task.due.string}</span>
                </span>
              )}

              {/* Labels if any */}
              {task.labels && task.labels.slice(0, 2).map((lbl) => (
                <span key={lbl} className="px-0.5 py-0.2 rounded bg-slate-800/20 border border-slate-700/30 text-slate-400 truncate max-w-[45px] shrink-0">
                  #{lbl}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete action overlay on hover (space-efficient, absolute position) */}
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center select-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
        <button
          onClick={handleDelete}
          className="text-slate-400 hover:text-rose-500 p-1 rounded bg-[#0d101a] border border-[#1e293b] shadow-md hover:bg-[#141b2c] transition-all cursor-pointer"
          title="Delete task"
        >
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      </div>
      </div>
    </motion.div>
  );
}
