/**
 * Shared Type Definitions for the Todoist Eisenhower Matrix Manager
 */

export interface TodoistTask {
  id: string;
  content: string;
  description: string;
  is_completed: boolean;
  priority: number; // 1 (lowest) to 4 (highest) in Todoist API
  url: string;
  due?: {
    date: string;
    string: string;
    datetime?: string;
    timezone?: string;
    is_recurring: boolean;
  };
  labels?: string[];
}

export type QuadrantType = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface QuadrantDefinition {
  id: QuadrantType;
  name: string;
  subtitle: string;
  priority: number; // Maps to Todoist API Priority (1-4)
  todoistPriorityLabel: string; // "P1", "P2", "P3", "P4"
  color: string; // Tailwind border/text color representing state
  bgAccent: string; // Tailwind bg color
  hoverAccent: string; // Tailwind hover
  icon: string;
}

// Map from Todoist Backend Priority (API PRIORITY: 1 to 4) to Eisenhower Quadrants
// In Todoist v2 REST API:
// 4 = Red (Urgent & Important) -> Q1
// 3 = Orange (Important & Not Urgent) -> Q2
// 2 = Blue (Urgent & Not Important) -> Q3
// 1 = Light/Grey (Neither) -> Q4
export function getQuadrantFromTodoistPriority(priority: number): QuadrantType {
  switch (priority) {
    case 4:
      return 'Q1';
    case 3:
      return 'Q2';
    case 2:
      return 'Q3';
    case 1:
    default:
      return 'Q4';
  }
}

// Convert from Quadrant to Todoist api priority
export function getTodoistPriorityFromQuadrant(quadrant: QuadrantType): number {
  switch (quadrant) {
    case 'Q1':
      return 4;
    case 'Q2':
      return 3;
    case 'Q3':
      return 2;
    case 'Q4':
    default:
      return 1;
  }
}

export const QUADRANTS: Record<QuadrantType, QuadrantDefinition> = {
  Q1: {
    id: 'Q1',
    name: 'Do First',
    subtitle: 'Urgent & Important',
    priority: 4,
    todoistPriorityLabel: 'Priority 1 (Red)',
    color: 'emerald', // Standard elegant choice, or cherry red: 'rose'
    bgAccent: 'rgba(244, 63, 94, 0.05)',
    hoverAccent: 'rgba(244, 63, 94, 0.1)',
    icon: 'AlertTriangle'
  },
  Q2: {
    id: 'Q2',
    name: 'Schedule',
    subtitle: 'Important, Not Urgent',
    priority: 3,
    todoistPriorityLabel: 'Priority 2 (Orange)',
    color: 'amber',
    bgAccent: 'rgba(245, 158, 11, 0.05)',
    hoverAccent: 'rgba(245, 158, 11, 0.1)',
    icon: 'Calendar'
  },
  Q3: {
    id: 'Q3',
    name: 'Delegate',
    subtitle: 'Urgent, Not Important',
    priority: 2,
    todoistPriorityLabel: 'Priority 3 (Blue)',
    color: 'sky',
    bgAccent: 'rgba(14, 165, 233, 0.05)',
    hoverAccent: 'rgba(14, 165, 233, 0.1)',
    icon: 'Users'
  },
  Q4: {
    id: 'Q4',
    name: 'Eliminate',
    subtitle: 'Neither (Backlog)',
    priority: 1,
    todoistPriorityLabel: 'Priority 4 (Natural)',
    color: 'slate',
    bgAccent: 'rgba(100, 116, 139, 0.05)',
    hoverAccent: 'rgba(100, 116, 139, 0.1)',
    icon: 'Trash2'
  }
};
