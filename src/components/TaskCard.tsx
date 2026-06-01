import React, { useState, useRef, useEffect } from 'react';
import { TodoistTask, QuadrantType, getQuadrantFromTodoistPriority } from '../types';
import { Check, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { useDraggable } from '@dnd-kit/core';

function isOverdue(dateString: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to local midnight
  const [yyyy, mm, dd] = dateString.split('T')[0].split('-');
  if (!yyyy || !mm || !dd) return false;
  const taskDate = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd), 0, 0, 0, 0);
  return taskDate < today;
}

function formatDueDate(dateString: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const [yyyy, mm, dd] = dateString.split('T')[0].split('-');
  if (!yyyy || !mm || !dd) return dateString;
  const taskDate = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd), 0, 0, 0, 0);

  if (taskDate.getTime() === today.getTime()) return "Today";
  if (taskDate.getTime() === tomorrow.getTime()) return "Tomorrow";
  if (taskDate.getTime() === yesterday.getTime()) return "Yesterday";

  return taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface TaskCardProps {
  task: TodoistTask;
  onUpdateQuadrant: (taskId: string, targetQuadrant: QuadrantType) => void;
  onCompleteTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  showFullDetails?: boolean;
  onDragStart?: () => void;
}

const quadrantsList: { key: QuadrantType; label: string; icon: string }[] = [
  { key: 'Q1', label: 'Do First (Q1)', icon: '⚡' },
  { key: 'Q2', label: 'Schedule (Q2)', icon: '⏳' },
  { key: 'Q3', label: 'Delegate (Q3)', icon: '☁️' },
  { key: 'Q4', label: 'Eliminate (Q4)', icon: '📥' },
];

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
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : undefined,
  } : undefined;

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
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={`relative group bg-white dark:bg-[#0e111d]/50 hover:bg-gray-50 dark:hover:bg-[#13182a]/60 border border-gray-200 dark:border-[#1e293b]/50 hover:border-gray-300 dark:hover:border-[#334155]/60 rounded-md py-1.5 pl-1.5 pr-2 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-150 ${
          isDragging ? 'opacity-40' : ''
        }`}
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
            {task.id ? (
              <a
                href={`https://app.todoist.com/app/task/${task.id}`}
                target="_blank"
                rel="noreferrer"
                className={`block text-[11.5px] sm:text-[12px] font-medium text-gray-900 dark:text-slate-100 hover:text-rose-500 dark:hover:text-rose-400 hover:underline transition-colors break-words overflow-hidden leading-snug ${
                  showFullDetails ? '' : 'line-clamp-2'
                }`}
                title="Open in Todoist"
              >
                {task.content}
              </a>
            ) : (
              <p
                className={`text-[11.5px] sm:text-[12px] font-medium text-gray-900 dark:text-slate-100 break-words overflow-hidden leading-snug ${
                  showFullDetails ? '' : 'line-clamp-2'
                }`}
                title={task.content}
              >
                {task.content}
              </p>
            )}

            {showFullDetails && task.description && (
              <p className="text-[10px] sm:text-[10.5px] text-gray-500 dark:text-slate-400 break-words leading-relaxed mt-1 font-light bg-gray-50 dark:bg-slate-950/40 p-1.5 rounded border border-gray-100 dark:border-slate-900/40">
                {task.description}
              </p>
            )}
          </div>

          {/* Sub-line metadata (if they have due date or labels) */}
          {(task.due || (task.labels && task.labels.length > 0)) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 select-none text-[8.5px] leading-none">
              {/* Due date if active */}
              {task.due && (
                <span className={`px-0.5 py-0.2 rounded border font-mono flex items-center gap-0.5 shrink-0 transition-colors ${
                  isOverdue(task.due.date) && !task.is_completed
                    ? 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/20 dark:border-rose-500/30 font-medium'
                    : 'text-gray-500 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-slate-800/40 dark:border-slate-700/30'
                }`}>
                  <Calendar className={`w-2 h-2 shrink-0 ${isOverdue(task.due.date) && !task.is_completed ? 'text-rose-500/70 dark:text-rose-500/70' : 'text-gray-400 dark:text-gray-500'}`} />
                  <span className="truncate max-w-[80px]">{formatDueDate(task.due.date)}</span>
                </span>
              )}

              {/* Labels if any */}
              {task.labels && task.labels.slice(0, 2).map((lbl) => (
                <span key={lbl} className="px-0.5 py-0.2 rounded bg-gray-100 bg-opacity-50 dark:bg-slate-800/20 border border-gray-200 dark:border-slate-700/30 text-gray-500 dark:text-slate-400 truncate max-w-[45px] shrink-0">
                  #{lbl}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </motion.div>
  );
}
