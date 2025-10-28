import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, ToastController, ActionSheetController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Task, TaskCategory, CategoryInfo } from '../../models/task.model';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  selectedCategory: TaskCategory | null = null;
  taskForm!: FormGroup;
  showAddForm = false;
  private destroy$ = new Subject<void>();

  categories: CategoryInfo[] = [
    { id: TaskCategory.WORK, name: 'Trabajo', color: 'primary', icon: 'briefcase' },
    { id: TaskCategory.PERSONAL, name: 'Personal', color: 'secondary', icon: 'person' },
    { id: TaskCategory.SHOPPING, name: 'Compras', color: 'tertiary', icon: 'cart' },
    { id: TaskCategory.HEALTH, name: 'Salud', color: 'success', icon: 'fitness' },
    { id: TaskCategory.OTHER, name: 'Otros', color: 'medium', icon: 'ellipsis-horizontal' }
  ];

  showCompletedOnly = false;
  showPendingOnly = false;
  currentView: 'list' | 'dashboard' | 'calendar' = 'list';
  
  tasksGroupedByDate: { date: Date; tasks: Task[] }[] = [];
  tasksByCategoryStats: any[] = [];
  mostProductiveDay: { date: Date; tasks: Task[] } | null = null;
  completionTrend = { total: 0, completed: 0, rate: 0 };
  
  currentMonth = new Date();
  calendarDays: { date: Date; tasks: Task[]; isCurrentMonth: boolean }[] = [];
  selectedCalendarDate: Date | null = null;


  constructor(
    private taskService: TaskService,
    private formBuilder: FormBuilder,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {
    this.taskForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      category: [TaskCategory.OTHER, Validators.required]
    });
  }

  ngOnInit() {
    // Subscribe to tasks changes
    this.taskService.tasks$
      .pipe(takeUntil(this.destroy$))
      .subscribe(tasks => {
        this.tasks = tasks;
        this.updateFilteredTasks();
        this.updateDashboardData();
      });

    // Subscribe to category changes
    this.taskService.selectedCategory$
      .pipe(takeUntil(this.destroy$))
      .subscribe(category => {
        this.selectedCategory = category;
        this.updateFilteredTasks();
      });

    // Load tasks
    this.taskService.loadTasks();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

 updateFilteredTasks() {
  if (this.showCompletedOnly) {
    this.filteredTasks = this.tasks.filter(task => task.completed);
  } else if (this.showPendingOnly) {
    this.filteredTasks = this.tasks.filter(task => !task.completed);
  } else if (this.selectedCategory) {
    this.filteredTasks = this.tasks.filter(task => task.category === this.selectedCategory);
  } else {
    this.filteredTasks = [...this.tasks];
  }
}


  toggleCompletedFilter() {
    this.showCompletedOnly = !this.showCompletedOnly;
    this.showPendingOnly = false;
    this.selectedCategory = null;
    this.taskService.setSelectedCategory(null);
    this.updateFilteredTasks();
  }

  filterPendingTasks() {
    this.showPendingOnly = true;
    this.showCompletedOnly = false;
    this.selectedCategory = null;
    this.taskService.setSelectedCategory(null);
    this.updateFilteredTasks();
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.taskForm.reset({ category: TaskCategory.OTHER });
    }
  }

  async addTask() {
    if (this.taskForm.valid) {
      const { title, description, category } = this.taskForm.value;

      try {
        await this.taskService.addTask(title, description, category);
        this.taskForm.reset({ category: TaskCategory.OTHER });
        this.showAddForm = false;
        await this.showToast('Tarea agregada exitosamente', 'success');
      } catch (error) {
        await this.showToast('Error al agregar la tarea', 'danger');
      }
    }
  }

  async toggleTaskCompletion(task: Task) {
    try {
      await this.taskService.toggleTaskCompletion(task.id);
      const message = task.completed ? '   Tarea completada' : 'Tarea marcada como pendiente ';
      await this.showToast(message, 'success');
    } catch (error) {
      await this.showToast('Error al actualizar la tarea', 'danger');
    }
  }

  async deleteTask(task: Task) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar la tarea "${task.title}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.taskService.deleteTask(task.id);
              await this.showToast('Tarea eliminada', 'success');
            } catch (error) {
              await this.showToast('Error al eliminar la tarea', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async editTask(task: Task) {
    const alert = await this.alertController.create({
      header: 'Editar Tarea',
      inputs: [
        {
          name: 'title',
          type: 'text',
          placeholder: 'Título',
          value: task.title
        },
        {
          name: 'description',
          type: 'textarea',
          placeholder: 'Descripción',
          value: task.description || ''
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: async (data) => {
            if (data.title && data.title.trim().length >= 3) {
              try {
                await this.taskService.updateTask(task.id, {
                  title: data.title.trim(),
                  description: data.description?.trim()
                });
                await this.showToast('Tarea actualizada', 'success');
                return true;
              } catch (error) {
                await this.showToast('Error al actualizar la tarea', 'danger');
                return false;
              }
            } else {
              await this.showToast('El título debe tener al menos 3 caracteres', 'warning');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async showTaskOptions(task: Task) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Opciones de Tarea',
      buttons: [
        {
          text: task.completed ? 'Marcar como pendiente' : 'Marcar como completada',
          icon: task.completed ? 'close-circle' : 'checkmark-circle',
          handler: () => {
            this.toggleTaskCompletion(task);
          }
        },
        {
          text: 'Editar',
          icon: 'create',
          handler: () => {
            this.editTask(task);
          }
        },
        {
          text: 'Eliminar',
          icon: 'trash',
          role: 'destructive',
          handler: () => {
            this.deleteTask(task);
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  filterByCategory(category: TaskCategory | null) {
    this.showCompletedOnly = false;
    this.showPendingOnly = false;
    this.selectedCategory = category;
    this.taskService.setSelectedCategory(category);
    this.updateFilteredTasks();
  }

  getCategoryInfo(category: TaskCategory): CategoryInfo {
    return this.categories.find(c => c.id === category) || this.categories[4];
  }

  getTaskStats() {
    return this.taskService.getTaskStats();
  }

  getFilteredStats() {
    const completed = this.filteredTasks.filter(t => t.completed).length;
    const pending = this.filteredTasks.filter(t => !t.completed).length;
    const total = this.filteredTasks.length;
    
    return {
      total,
      completed,
      pending,
      completionRate: total > 0 ? (completed / total) * 100 : 0
    };
  }

  changeView(view: 'list' | 'dashboard' | 'calendar') {
    this.currentView = view;
    if (view === 'dashboard') {
      this.updateDashboardData();
    } else if (view === 'calendar') {
      this.updateDashboardData();
      this.generateCalendar();
    }
  }

  updateDashboardData() {
    // Calcular tareas agrupadas por fecha
    const grouped: { [key: string]: Task[] } = {};
    
    this.tasks.forEach(task => {
      const dateKey = new Date(task.createdAt).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    });
    
    this.tasksGroupedByDate = Object.keys(grouped)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(date => ({
        date: new Date(date),
        tasks: grouped[date]
      }));

    // Calcular estadísticas por categoría
    this.tasksByCategoryStats = this.categories.map(cat => ({
      ...cat,
      count: this.tasks.filter(t => t.category === cat.id).length,
      completed: this.tasks.filter(t => t.category === cat.id && t.completed).length,
      pending: this.tasks.filter(t => t.category === cat.id && !t.completed).length
    })).filter(cat => cat.count > 0);

    // Calcular día más productivo
    if (this.tasksGroupedByDate.length === 0) {
      this.mostProductiveDay = null;
    } else {
      this.mostProductiveDay = this.tasksGroupedByDate.reduce((max, current) => 
        current.tasks.length > max.tasks.length ? current : max
      );
    }

    // Calcular tendencia de completado
    const last7Days = this.tasks.filter(task => {
      const daysDiff = (new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 3600 * 24);
      return daysDiff <= 7;
    });
    
    this.completionTrend = {
      total: last7Days.length,
      completed: last7Days.filter(t => t.completed).length,
      rate: last7Days.length > 0 ? (last7Days.filter(t => t.completed).length / last7Days.length) * 100 : 0
    };
  }

  getTasksGroupedByDate() {
    return this.tasksGroupedByDate;
  }

  getTasksByCategoryStats() {
    return this.tasksByCategoryStats;
  }

  getMostProductiveDay() {
    return this.mostProductiveDay;
  }

  getCompletionTrend() {
    return this.completionTrend;
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color
    });
    await toast.present();
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }

  trackByDate(index: number, item: { date: Date; tasks: Task[] }): string {
    return item.date.toISOString();
  }

  trackByCategoryId(index: number, cat: any): string {
    return cat.id;
  }

  generateCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    this.calendarDays = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dateStr = currentDate.toDateString();
      const dayTasks = this.tasks.filter(task => 
        new Date(task.createdAt).toDateString() === dateStr
      );
      
      this.calendarDays.push({
        date: new Date(currentDate),
        tasks: dayTasks,
        isCurrentMonth: currentDate.getMonth() === month
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  previousMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1);
    this.generateCalendar();
  }

  selectCalendarDate(day: { date: Date; tasks: Task[]; isCurrentMonth: boolean }) {
    if (day.tasks.length > 0) {
      this.selectedCalendarDate = day.date;
    }
  }

  closeTaskDetails() {
    this.selectedCalendarDate = null;
  }

  getSelectedDateTasks(): Task[] {
    if (!this.selectedCalendarDate) return [];
    const dateStr = this.selectedCalendarDate.toDateString();
    return this.tasks.filter(task => 
      new Date(task.createdAt).toDateString() === dateStr
    );
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  trackByCalendarDay(index: number, day: { date: Date; tasks: Task[]; isCurrentMonth: boolean }): string {
    return day.date.toISOString();
  }
}
