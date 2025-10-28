export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  category: TaskCategory;
  createdAt: Date;
  completedAt?: Date;
}

export enum TaskCategory {
  WORK = 'work',
  PERSONAL = 'personal',
  SHOPPING = 'shopping',
  HEALTH = 'health',
  OTHER = 'other'
}

export interface CategoryInfo {
  id: TaskCategory;
  name: string;
  color: string;
  icon: string;
}
