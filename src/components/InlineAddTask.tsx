import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { QuadrantType } from '../types';

interface InlineAddTaskProps {
  quadrant: QuadrantType;
  onAddTask: (content: string, description: string, quadrant: QuadrantType) => Promise<boolean>;
}

export function InlineAddTask({ quadrant, onAddTask }: InlineAddTaskProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    const success = await onAddTask(content.trim(), description.trim(), quadrant);
    setIsSubmitting(false);

    if (success) {
      setContent('');
      setDescription('');
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="w-full text-left py-2 px-3 border border-dashed border-slate-800 hover:border-slate-700/80 rounded-md bg-slate-900/40 text-gray-400 hover:text-gray-300 transition-all font-medium text-xs flex items-center gap-1.5 cursor-pointer hover:bg-slate-900/70"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add a task here...</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#12182b] border border-slate-800 rounded-md p-3 space-y-2.5 shadow-md">
      <div>
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          placeholder="What needs to be done?"
          className="w-full bg-[#0d1222] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50 transition-colors"
          required
        />
      </div>
      <div>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          placeholder="Description (optional)"
          className="w-full bg-[#0d1222] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50 transition-colors"
        />
      </div>

      <div className="flex items-center gap-2 justify-end pt-1">
        <button
          type="button"
          onClick={() => {
            setContent('');
            setDescription('');
            setIsEditing(false);
          }}
          disabled={isSubmitting}
          className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded bg-slate-900/60 transition-colors disabled:opacity-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="text-xs bg-rose-500 hover:bg-rose-600 font-medium text-white px-3 py-1 rounded transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Add Task</span>
          )}
        </button>
      </div>
    </form>
  );
}
