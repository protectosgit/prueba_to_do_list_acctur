import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Task, TaskCategory } from '../models/task.model';
import { StorageService } from './storage.service';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly TASKS_KEY = 'tasks';
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$: Observable<Task[]> = this.tasksSubject.asObservable();
  
  private selectedCategorySubject = new BehaviorSubject<TaskCategory | null>(null);
  public selectedCategory$: Observable<TaskCategory | null> = this.selectedCategorySubject.asObservable();

  private enableCategories = true;

  constructor(
    private storageService: StorageService,
    private firebaseService: FirebaseService
  ) {
    this.initializeService();
  }

  private async initializeService() {
    // Initialize Firebase and get feature flags
    await this.firebaseService.initialize();
    this.enableCategories = await this.firebaseService.getFeatureFlag('enable_categories');
    
    // Load tasks from storage
    await this.loadTasks();
  }

  async loadTasks(): Promise<void> {
    try {
      const tasks = await this.storageService.get(this.TASKS_KEY);
      if (tasks && Array.isArray(tasks)) {
        // Convert date strings back to Date objects
        const parsedTasks = tasks.map(task => ({
          ...task,
          createdAt: new Date(task.createdAt),
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined
        }));
        this.tasksSubject.next(parsedTasks);
      } else {
        this.tasksSubject.next([]);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      this.tasksSubject.next([]);
    }
  }

  private async saveTasks(tasks: Task[]): Promise<void> {
    try {
      await this.storageService.set(this.TASKS_KEY, tasks);
      this.tasksSubject.next(tasks);
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  }

  getTasks(): Task[] {
    return this.tasksSubject.value;
  }

  getFilteredTasks(): Task[] {
    const tasks = this.getTasks();
    const selectedCategory = this.selectedCategorySubject.value;
    
    if (!selectedCategory) {
      return tasks;
    }
    
    return tasks.filter(task => task.category === selectedCategory);
  }

  async addTask(title: string, description: string, category: TaskCategory): Promise<Task> {
    const newTask: Task = {
      id: this.generateId(),
      title,
      description,
      completed: false,
      category,
      createdAt: new Date()
    };

    const tasks = [...this.getTasks(), newTask];
    await this.saveTasks(tasks);
    return newTask;
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates };
      await this.saveTasks(tasks);
    }
  }

  async toggleTaskCompletion(taskId: string): Promise<void> {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date() : undefined;
      await this.saveTasks(tasks);
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    const tasks = this.getTasks().filter(t => t.id !== taskId);
    await this.saveTasks(tasks);
  }

  async clearCompletedTasks(): Promise<void> {
    const tasks = this.getTasks().filter(t => !t.completed);
    await this.saveTasks(tasks);
  }

  setSelectedCategory(category: TaskCategory | null): void {
    this.selectedCategorySubject.next(category);
  }

  getSelectedCategory(): TaskCategory | null {
    return this.selectedCategorySubject.value;
  }

  getTaskStats() {
    const tasks = this.getTasks();
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.filter(t => !t.completed).length;
    
    return {
      total: tasks.length,
      completed,
      pending,
      completionRate: tasks.length > 0 ? (completed / tasks.length) * 100 : 0
    };
  }

  getTasksByCategory(category: TaskCategory): Task[] {
    return this.getTasks().filter(t => t.category === category);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  areCategoriesEnabled(): boolean {
    return this.enableCategories;
  }
}
