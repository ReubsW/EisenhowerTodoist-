import React, { useState, useEffect } from 'react';
import { TodoistTask, QuadrantType, getQuadrantFromTodoistPriority, getTodoistPriorityFromQuadrant, QUADRANTS } from './types';
import { QuadrantBox } from './components/QuadrantBox';
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { 
  CheckCircle, 
  RefreshCw, 
  HelpCircle, 
  LayoutGrid, 
  Settings, 
  Sparkles, 
  AlertCircle, 
  Info, 
  Check, 
  ExternalLink,
  Github,
  Award
} from 'lucide-react';

const MOCK_TASKS: TodoistTask[] = [
  {
    id: "mock-1",
    content: "Deploy hotfix for JWT session token crash",
    description: "Urgent fix for auth cookie parsing on node backend endpoint.",
    is_completed: false,
    priority: 4, // Q1
    url: "https://todoist.com"
  },
  {
    id: "mock-2",
    content: "Submit department quarterly roadmap & budget review slides",
    description: "Align with stakeholders on database server allocations.",
    is_completed: false,
    priority: 4, // Q1
    url: "https://todoist.com"
  },
  {
    id: "mock-3",
    content: "Design schema and Compound Indexes for client search speed",
    description: "Add index on (user_id, status, created_at) to speed up explorer query.",
    is_completed: false,
    priority: 3, // Q2
    url: "https://todoist.com"
  },
  {
    id: "mock-4",
    content: "Refactor frontend matrix viewport layout",
    description: "Switch panels to native CSS Grid columns to prevent reflow flickering.",
    is_completed: false,
    priority: 3, // Q2
    url: "https://todoist.com"
  },
  {
    id: "mock-5",
    content: "Respond to prospective contractor email inquiry",
    description: "Confirm initial technical vetting schedule and screening criteria.",
    is_completed: false,
    priority: 2, // Q3
    url: "https://todoist.com"
  },
  {
    id: "mock-6",
    content: "Cancel outdated developer playground sandboxes",
    description: "Prevent upcoming auto-renewals for secondary telemetry tools.",
    is_completed: false,
    priority: 2, // Q3
    url: "https://todoist.com"
  },
  {
    id: "mock-7",
    content: "Prune cluttered desktop folder screenshots",
    description: "Archive random screenshots taken over the previous quarter.",
    is_completed: false,
    priority: 1, // Q4
    url: "https://todoist.com"
  },
  {
    id: "mock-8",
    content: "Check early-bird registration discounts for conference",
    description: "Review whether our training budget covers individual seats.",
    is_completed: false,
    priority: 1, // Q4
    url: "https://todoist.com"
  }
];

export default function App() {
  const [tasks, setTasks] = useState<TodoistTask[]>([]);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | null }>({ message: '', type: null });
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [maximizedQuadrant, setMaximizedQuadrant] = useState<QuadrantType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active) {
      const taskId = String(active.id);
      const targetQuadrant = over.id as QuadrantType;
      
      if (['Q1', 'Q2', 'Q3', 'Q4'].includes(targetQuadrant)) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          const currentQuadrant = getQuadrantFromTodoistPriority(task.priority);
          if (currentQuadrant !== targetQuadrant) {
            handleUpdateQuadrant(taskId, targetQuadrant);
          }
        }
      }
    }
  };

  const handleToggleMaximize = (quadrant: QuadrantType) => {
    setMaximizedQuadrant(prev => prev === quadrant ? null : quadrant);
  };

  const handleDragStartTask = () => {
    setMaximizedQuadrant(null);
  };

  // Set up auto-fading notifications
  const triggerNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => prev.message === message ? { message: '', type: null } : prev);
    }, 4500);
  };

  // Check backend config on mount
  useEffect(() => {
    checkBackendConfig();
  }, []);

  const checkBackendConfig = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/config-status');
      if (res.ok) {
        const data = await res.json();
        setIsConfigured(data.configured);
        if (data.configured) {
          setIsLiveMode(true);
          await fetchLiveTasks();
        } else {
          // Fallback to local mock data
          setIsLiveMode(false);
          setTasks(MOCK_TASKS);
          triggerNotification("Todoist API Key absent. Running in Sandbox Demo Mode.", "info");
        }
      } else {
        setIsLiveMode(false);
        setTasks(MOCK_TASKS);
      }
    } catch (err) {
      console.error("Failed to connect to backend configuration endpoint:", err);
      setIsLiveMode(false);
      setTasks(MOCK_TASKS);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLiveTasks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/get-tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
        triggerNotification("Successfully synchronized live tasks from Todoist.", "success");
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to fetch tasks from server.");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification(err.message || "Network error loading Todoist tasks.", "error");
      // Fallback to mock so user profile doesn't show blank page
      if (tasks.length === 0) {
        setTasks(MOCK_TASKS);
        setIsLiveMode(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Add Task handler
  const handleAddTask = async (content: string, description: string, quadrant: QuadrantType): Promise<boolean> => {
    const apiPriority = getTodoistPriorityFromQuadrant(quadrant);
    
    if (!isLiveMode) {
      // Offline local creation
      const newMockTask: TodoistTask = {
        id: `local-mock-${Date.now()}`,
        content,
        description,
        is_completed: false,
        priority: apiPriority,
        url: "https://todoist.com"
      };
      setTasks(prev => [newMockTask, ...prev]);
      triggerNotification(`Created "${content}" inside ${quadrant} locally.`, "success");
      return true;
    }

    // Live backend creation
    try {
      const response = await fetch('/api/create-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, description, priority: apiPriority })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error creating task on backend.");
      }

      const createdTask = await response.json();
      setTasks(prev => [createdTask, ...prev]);
      triggerNotification(`Successfully created "${content}" on Todoist!`, "success");
      return true;
    } catch (err: any) {
      console.error(err);
      triggerNotification(err.message || "Could not save task to Todoist.", "error");
      return false;
    }
  };

  // Optimistic Quadrant updating
  const handleUpdateQuadrant = async (taskId: string, targetQuadrant: QuadrantType) => {
    const originalTaskList = [...tasks];
    const targetTaskIndex = tasks.findIndex(t => t.id === taskId);
    if (targetTaskIndex === -1) return;

    const targetTask = tasks[targetTaskIndex];
    const previousPriority = targetTask.priority;
    const newPriority = getTodoistPriorityFromQuadrant(targetQuadrant);

    // OPTIMISTIC UPDATE: Instant local UI update
    const updatedTasks = [...tasks];
    updatedTasks[targetTaskIndex] = {
      ...targetTask,
      priority: newPriority
    };
    setTasks(updatedTasks);
    triggerNotification(`Moved task to ${targetQuadrant} (${QUADRANTS[targetQuadrant].name})`, "success");

    if (!isLiveMode) {
      // Local mode does not require actual fetch
      return;
    }

    // Dispatch live request
    try {
      const response = await fetch('/api/update-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, priority: newPriority })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server returned error: ${errText}`);
      }
    } catch (err: any) {
      console.error("Failed to sync quadrant transfer with Todoist:", err);
      triggerNotification("Failed to synchronize change with Todoist API. Rolling back...", "error");
      // Rollback to original state
      setTasks(originalTaskList);
    }
  };

  // Complete/Close task
  const handleCompleteTask = async (taskId: string) => {
    const originalTaskList = [...tasks];
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    
    // Optimistic UI complete
    setTasks(updatedTasks);
    triggerNotification("Completed task!", "success");

    if (!isLiveMode) return;

    try {
      const response = await fetch('/api/complete-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }
    } catch (err) {
      console.error("Failed to complete task on Todoist:", err);
      triggerNotification("Failed to finalize complete on Todoist. Retrying...", "error");
      setTasks(originalTaskList);
    }
  };

  // Delete task completely
  const handleDeleteTask = async (taskId: string) => {
    const originalTaskList = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== taskId));
    triggerNotification("Deleted task.", "info");

    if (!isLiveMode) return;

    try {
      const response = await fetch('/api/delete-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId })
      });

      if (!response.ok) {
        throw new Error("Deletion failed on Todoist server.");
      }
    } catch (err: any) {
      console.error("Delete failure:", err);
      triggerNotification(err.message || "Failed to remove task from Todoist.", "error");
      setTasks(originalTaskList);
    }
  };

  // Separate tasks into relevant quadrants
  const getTasksByQuadrant = (quad: QuadrantType) => {
    return tasks.filter(task => getQuadrantFromTodoistPriority(task.priority) === quad);
  };

  // Calculation parameters for matrix statistics
  const q1Count = getTasksByQuadrant('Q1').length;
  const q2Count = getTasksByQuadrant('Q2').length;
  const q3Count = getTasksByQuadrant('Q3').length;
  const q4Count = getTasksByQuadrant('Q4').length;
  const totalTasks = tasks.length;

  const getPercentage = (count: number) => {
    if (totalTasks === 0) return 0;
    return Math.round((count / totalTasks) * 100);
  };

  return (
    <div className="min-h-screen bg-[#060814] text-gray-100 flex flex-col p-3 sm:p-4.5 lg:p-5 selection:bg-rose-500/30 selection:text-white">
      {/* Background radial accent flare */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[180px] bg-gradient-to-b from-rose-500/5 to-transparent blur-[120px] pointer-events-none -z-10" />

      {/* Main Container constraint */}
      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col space-y-4">
        
        {/* Navigation / Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="bg-rose-500/15 p-1.5 rounded-lg border border-rose-500/20 shadow-inner">
                <LayoutGrid className="w-5 h-5 text-rose-500" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight text-white flex items-center gap-1.5 leading-none">
                Eisenhower Matrix
                <span className="text-gray-500 font-light font-sans text-lg hidden sm:inline">|</span>
                <span className="text-sm font-sans font-medium text-gray-400 bg-slate-900 border border-slate-800 rounded-md px-2 py-0.5 mt-0.5">Todoist Engine</span>
              </h1>
            </div>
            <p className="text-xs text-gray-400 font-light">
              Organize tasks seamlessly inside the 2x2 priority matrix synced securely with Todoist.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Guide Accordion toggle */}
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-800 bg-[#0d1222] hover:bg-slate-900 text-xs font-semibold text-gray-300 flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-gray-400" />
              <span>{showGuide ? "Hide Matrix Guide" : "How it Works"}</span>
            </button>

            {/* Mode Indicators & Selectors */}
            <div className="bg-slate-950 p-1 rounded-lg border border-slate-900 flex items-center gap-1">
              <button
                onClick={() => {
                  if (isConfigured) {
                    setIsLiveMode(true);
                    fetchLiveTasks();
                  } else {
                    triggerNotification("Cannot activate live sync: provide TODOIST_API_TOKEN in Secrets.", "error");
                  }
                }}
                disabled={!isConfigured}
                className={`px-3 py-1 text-xs rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isLiveMode 
                    ? 'bg-rose-500 text-white shadow' 
                    : 'text-gray-400 hover:text-gray-200 disabled:opacity-30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? 'bg-white animate-pulse' : 'bg-gray-500'}`} />
                <span>Live Sync</span>
              </button>
              <button
                onClick={() => {
                  setIsLiveMode(false);
                  setTasks(MOCK_TASKS);
                  triggerNotification("Switched to Offline Sandbox Demo Mode.", "info");
                }}
                className={`px-3 py-1 text-xs rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  !isLiveMode 
                    ? 'bg-slate-800 text-white shadow' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Demo Mode</span>
              </button>
            </div>

            {/* Refresh/Sync button */}
            <button
              onClick={() => {
                if (isLiveMode) {
                  fetchLiveTasks();
                } else {
                  setTasks(MOCK_TASKS);
                  triggerNotification("Restored default mock template tasks.", "success");
                }
              }}
              disabled={isLoading}
              className="p-2 rounded-lg bg-[#0d1222] hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-gray-400 hover:text-white transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center shrink-0"
              title={isLiveMode ? "Synchronize with Todoist" : "Reset Demo tasks"}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-rose-500' : ''}`} />
            </button>
          </div>
        </header>

        {/* Dynamic global Notification Toast */}
        {notification.message && (
          <div className={`p-3.5 border rounded-lg flex items-center gap-3 shadow-lg max-w-2xl mx-auto w-full transition-all duration-300 font-mono text-xs ${
            notification.type === 'success' 
              ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300' 
              : notification.type === 'error'
              ? 'bg-rose-950/20 border-rose-500/20 text-rose-300'
              : 'bg-slate-900 border-slate-700 text-slate-300'
          }`}>
            <AlertCircle className={`w-4 h-4 shrink-0 ${notification.type === 'error' ? 'text-rose-400' : notification.type === 'success' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <div className="flex-1 text-[11px] leading-relaxed">{notification.message}</div>
          </div>
        )}

        {/* Setup Assistant Banner if not configured */}
        {!isConfigured && (
          <div className="bg-gradient-to-r from-[#171317] to-[#121223] border border-amber-900/40 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border-b border-amber-950/40 pb-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span className="text-xs uppercase font-bold tracking-wider text-amber-400 font-mono">Integration Pending Setup</span>
                </div>
                <h2 className="text-sm font-semibold text-white">How to connect your Todoist account?</h2>
                <p className="text-xs text-gray-400 leading-relaxed font-light">
                  To sync your real tasks, you need to configure the correct secret variable. If you created a Todoist "App Integration" in the developer portal, you will see several credentials. Here is exactly what to do with each of them:
                </p>
              </div>
              <button
                onClick={() => {
                  setIsLiveMode(false);
                  setTasks(MOCK_TASKS);
                  triggerNotification("Interactive mock playground prepared below.", "success");
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-gray-200 hover:text-white rounded-lg font-medium shadow shrink-0 self-stretch md:self-auto flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Explore Interactive Demo</span>
              </button>
            </div>

            {/* Explanatory breakdown column cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-emerald-900/30 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] uppercase border border-emerald-500/15">Use This</span>
                  <span>1. API Token</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-normal font-light">
                  <strong>Personal Token</strong>: Found in Todoist <strong className="text-gray-300">Settings → Integrations → Developer API Token</strong>, or the <strong className="text-gray-300">"Test Token"</strong> at the bottom of your App console.
                </p>
                <div className="pt-1 text-[10px] font-mono text-emerald-300/90 leading-tight">
                  Add to AI Studio Secrets as <code className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-[9px] text-rose-300">TODOIST_API_TOKEN</code>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/30 border border-slate-800/60 space-y-1.5 opacity-70">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-400 text-[9px] uppercase border border-gray-500/15">Not Needed</span>
                  <span>2. Client ID</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-normal font-light">
                  Required only for building multi-user OAuth web flows where external users click a "Log in with Todoist" button. <strong>Ignore this value for your personal matrix dashboard.</strong>
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/30 border border-slate-800/60 space-y-1.5 opacity-70">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-400 text-[9px] uppercase border border-gray-500/15">Not Needed</span>
                  <span>3. Client Secret</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-normal font-light">
                  Used together with Client ID on backend servers during the OAuth authorization code exchange process. <strong>Never expose this or save it in client-facing variables.</strong>
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/30 border border-slate-800/60 space-y-1.5 opacity-70">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-400 text-[9px] uppercase border border-gray-500/15">Not Needed</span>
                  <span>4. Webhook Token</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-normal font-light">
                  A verification handshake token used to cryptographically validate incoming Todoist webhooks. Since this app pulls tasks directly via REST API, <strong>you do not need webhooks.</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Explanatory Guide Box */}
        {showGuide && (
          <div className="bg-[#0b0e1a] border border-slate-800 rounded-xl p-5 text-xs text-gray-300 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-3 duration-200">
            <h3 className="font-bold text-white text-sm font-display flex items-center gap-1.5">
              <Info className="w-4 h-4 text-rose-500" />
              Understanding the Eisenhower Decision Matrix
            </h3>
            <p className="leading-relaxed font-light">
              The Eisenhower Matrix (sometimes called Urgent-Important Matrix) helps you prioritize tasks based on urgency and importance, allowing you to categorize work to protect your scheduling density:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
              <div className="p-3 bg-[#130d12] border border-rose-950/40 rounded-lg space-y-1">
                <span className="font-bold text-rose-400 font-mono text-[10px] uppercase">Q1 · DO FIRST</span>
                <p className="text-slate-200 font-semibold text-[11px]">Urgent & Important</p>
                <p className="text-[11px] text-gray-400 leading-snug font-light">Crises, deadlined projects, and critical breakdowns. Handle these immediately to avoid business impact.</p>
              </div>
              <div className="p-3 bg-[#13110d] border border-amber-950/40 rounded-lg space-y-1">
                <span className="font-bold text-amber-400 font-mono text-[10px] uppercase">Q2 · SCHEDULE</span>
                <p className="text-slate-200 font-semibold text-[11px]">Important, Not Urgent</p>
                <p className="text-[11px] text-gray-400 leading-snug font-light">Strategic growth, learning, product refactoring, relationships. High-performers target spending 70% of time here.</p>
              </div>
              <div className="p-3 bg-[#0d121b] border border-sky-950/40 rounded-lg space-y-1">
                <span className="font-bold text-sky-400 font-mono text-[10px] uppercase">Q3 · DELEGATE</span>
                <p className="text-slate-200 font-semibold text-[11px]">Urgent, Not Important</p>
                <p className="text-[11px] text-gray-400 leading-snug font-light">Interruptive emails, meeting schedules, minor requests. Hand off or batch processing these to free up focus.</p>
              </div>
              <div className="p-3 bg-[#0d0f17] border border-slate-900 rounded-lg space-y-1">
                <span className="font-bold text-slate-400 font-mono text-[10px] uppercase">Q4 · ELIMINATE</span>
                <p className="text-slate-200 font-semibold text-[11px]">Neither (Backlog)</p>
                <p className="text-[11px] text-gray-400 leading-snug font-light">Busywork, trivial browsing, outdated checklists. Archive or eliminate to avoid cognitive fatigue.</p>
              </div>
            </div>
          </div>
        )}

        {/* 2X2 EISENHOWER GRID VIEW */}
        <div className="flex-1 w-full mx-auto">
          {isLoading && tasks.length === 0 ? (
            <div className="col-span-full h-80 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
              <p className="text-sm font-mono text-gray-400">Communicating with backend services...</p>
            </div>
          ) : (
            <DndContext sensors={sensors} onDragStart={handleDragStartTask} onDragEnd={handleDragEnd}>
              <div className={maximizedQuadrant ? "w-full pb-2 animate-in fade-in zoom-in-95 duration-200" : "grid grid-cols-2 lg:grid-cols-[36px_1fr_1fr] gap-2 sm:gap-3.5 pb-2"}>
                {/* Row 0: Column Labels (Only visible on lg screens and when not maximized) */}
                {!maximizedQuadrant && (
                  <>
                    <div className="hidden lg:block"></div> {/* Spacer for the left-row label */}
                    
                    <div className="hidden lg:block text-center py-1.5 rounded-lg bg-gradient-to-r from-rose-950/10 to-rose-950/5 border border-rose-500/10 select-none shadow-sm">
                      <span className="text-[11px] font-bold font-mono tracking-widest text-rose-400">⚡ URGENT</span>
                    </div>
                    
                    <div className="hidden lg:block text-center py-1.5 rounded-lg bg-gradient-to-r from-amber-950/10 to-amber-950/5 border border-amber-500/10 select-none shadow-sm">
                      <span className="text-[11px] font-bold font-mono tracking-widest text-amber-400">⏳ NOT URGENT</span>
                    </div>
                  </>
                )}

                {/* Row 1: IMPORTANT (Q1 & Q2) */}
                {!maximizedQuadrant && (
                  <div className="hidden lg:flex items-center justify-center py-2">
                    <div className="font-mono text-[9px] font-black tracking-[0.2em] text-emerald-400 uppercase [writing-mode:vertical-lr] rotate-180 transform origin-center select-none whitespace-nowrap">
                      ⭐ IMPORTANT
                    </div>
                  </div>
                )}
                
                {/* Quadrant 1 - Urgent & Important */}
                <QuadrantBox
                  quadrant="Q1"
                  tasks={getTasksByQuadrant('Q1')}
                  onUpdateQuadrant={handleUpdateQuadrant}
                  onCompleteTask={handleCompleteTask}
                  onDeleteTask={handleDeleteTask}
                  onAddTask={handleAddTask}
                  isMaximized={maximizedQuadrant === 'Q1'}
                  onToggleMaximize={() => handleToggleMaximize('Q1')}
                  onDragStartTask={handleDragStartTask}
                  isHidden={maximizedQuadrant !== null && maximizedQuadrant !== 'Q1'}
                />

                {/* Quadrant 2 - Important, Not Urgent */}
                <QuadrantBox
                  quadrant="Q2"
                  tasks={getTasksByQuadrant('Q2')}
                  onUpdateQuadrant={handleUpdateQuadrant}
                  onCompleteTask={handleCompleteTask}
                  onDeleteTask={handleDeleteTask}
                  onAddTask={handleAddTask}
                  isMaximized={maximizedQuadrant === 'Q2'}
                  onToggleMaximize={() => handleToggleMaximize('Q2')}
                  onDragStartTask={handleDragStartTask}
                  isHidden={maximizedQuadrant !== null && maximizedQuadrant !== 'Q2'}
                />

                {/* Row 2: NOT IMPORTANT (Q3 & Q4) */}
                {!maximizedQuadrant && (
                  <div className="hidden lg:flex items-center justify-center py-2">
                    <div className="font-mono text-[9px] font-black tracking-[0.2em] text-sky-400 uppercase [writing-mode:vertical-lr] rotate-180 transform origin-center select-none whitespace-nowrap">
                      ☁️ UNIMPORTANT
                    </div>
                  </div>
                )}

                {/* Quadrant 3 - Urgent, Not Important */}
                <QuadrantBox
                  quadrant="Q3"
                  tasks={getTasksByQuadrant('Q3')}
                  onUpdateQuadrant={handleUpdateQuadrant}
                  onCompleteTask={handleCompleteTask}
                  onDeleteTask={handleDeleteTask}
                  onAddTask={handleAddTask}
                  isMaximized={maximizedQuadrant === 'Q3'}
                  onToggleMaximize={() => handleToggleMaximize('Q3')}
                  onDragStartTask={handleDragStartTask}
                  isHidden={maximizedQuadrant !== null && maximizedQuadrant !== 'Q3'}
                />

                {/* Quadrant 4 - Neither (Backlog) */}
                <QuadrantBox
                  quadrant="Q4"
                  tasks={getTasksByQuadrant('Q4')}
                  onUpdateQuadrant={handleUpdateQuadrant}
                  onCompleteTask={handleCompleteTask}
                  onDeleteTask={handleDeleteTask}
                  onAddTask={handleAddTask}
                  isMaximized={maximizedQuadrant === 'Q4'}
                  onToggleMaximize={() => handleToggleMaximize('Q4')}
                  onDragStartTask={handleDragStartTask}
                  isHidden={maximizedQuadrant !== null && maximizedQuadrant !== 'Q4'}
                />
              </div>
            </DndContext>
          )}
        </div>

        {/* Matrix Analytics Dashboard Widget */}
        <section className="bg-[#0b0e1a] border border-slate-800/80 rounded-xl p-4 md:p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">Focus Distribution Metrics</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Distribution audit of active workload state inside your Todoist matrices.</p>
            </div>
            {totalTasks > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-900 font-mono text-xs">
                <span className="text-gray-500">Todoist Active Tasks count:</span>
                <strong className="text-white font-bold">{totalTasks}</strong>
              </div>
            )}
          </div>

          {totalTasks === 0 ? (
            <div className="py-2 text-center text-xs text-gray-500 font-mono tracking-wide">NO LIVE TASKS PRESET. CREATE A TASK IN ANY QUADRANT BELOW TO INITIATE THE METRICS.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Q1 Metric */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-rose-300 font-semibold">Q1 Do First</span>
                  <span className="text-xs font-mono font-bold text-gray-200">{q1Count} tasks</span>
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${getPercentage(q1Count)}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                    <span>Target: &lt;15%</span>
                    <span className={getPercentage(q1Count) > 20 ? 'text-rose-400' : 'text-gray-500'}>{getPercentage(q1Count)}% Actual</span>
                  </div>
                </div>
              </div>

              {/* Q2 Metric */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-300 font-semibold">Q2 Schedule</span>
                  <span className="text-xs font-mono font-bold text-gray-200">{q2Count} tasks</span>
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${getPercentage(q2Count)}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                    <span>Target: 60-80%</span>
                    <span className={getPercentage(q2Count) < 50 ? 'text-amber-400' : 'text-emerald-400'}>{getPercentage(q2Count)}% Actual</span>
                  </div>
                </div>
              </div>

              {/* Q3 Metric */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-sky-300 font-semibold">Q3 Delegate</span>
                  <span className="text-xs font-mono font-bold text-gray-200">{q3Count} tasks</span>
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${getPercentage(q3Count)}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                    <span>Target: Minimal</span>
                    <span className="text-gray-500">{getPercentage(q3Count)}% Actual</span>
                  </div>
                </div>
              </div>

              {/* Q4 Metric */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold">Q4 Eliminate</span>
                  <span className="text-xs font-mono font-bold text-gray-200">{q4Count} tasks</span>
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-500 transition-all duration-300" style={{ width: `${getPercentage(q4Count)}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                    <span>Target: ~0%</span>
                    <span className={q4Count > 0 ? 'text-gray-400' : 'text-emerald-500'}>{getPercentage(q4Count)}% Actual</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Custom footer info */}
        <footer className="pt-6 border-t border-slate-800/50 pb-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-light font-mono">
          <div>
            <span>Status: </span>
            {isLiveMode ? (
              <span className="text-emerald-400 font-bold">● ONLINE SYNC ACTIVE</span>
            ) : (
              <span className="text-amber-500 font-semibold">○ OFFLINE PLAYGROUND</span>
            )}
          </div>
          <div>
            <span>Developed inside AI Studio Project Applet</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
