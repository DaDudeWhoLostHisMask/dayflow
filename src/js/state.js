// Centralized State Management with localStorage persistence

const STORAGE_KEY = 'dayflow_state';

// Helper to get formatted dates relative to today
const getRelativeDate = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const defaultState = {
  theme: 'dark',
  tasks: [
    {
      id: 'task-1',
      title: 'Design DayFlow Brand Identity & Icons',
      date: getRelativeDate(-1),
      category: 'work',
      difficulty: 'hard',
      completed: true
    },
    {
      id: 'task-2',
      title: 'Review monthly budget and investment portfolio',
      date: getRelativeDate(0),
      category: 'finance',
      difficulty: 'medium',
      completed: false
    },
    {
      id: 'task-3',
      title: 'Prepare healthy weekly meal prep plan',
      date: getRelativeDate(0),
      category: 'health',
      difficulty: 'easy',
      completed: false
    },
    {
      id: 'task-4',
      title: 'Evening 30-minute mindfulness & yoga session',
      date: getRelativeDate(0),
      category: 'health',
      difficulty: 'easy',
      completed: true
    },
    {
      id: 'task-5',
      title: 'Draft presentation for team project kickoff',
      date: getRelativeDate(1),
      category: 'work',
      difficulty: 'medium',
      completed: false
    },
    {
      id: 'task-6',
      title: 'Read chapter 4 of Refactoring UI design book',
      date: getRelativeDate(0),
      category: 'personal',
      difficulty: 'easy',
      completed: false
    }
  ],
  habits: [
    {
      id: 'habit-1',
      name: 'Hydrate (Drink 3L Water)',
      category: 'health',
      completedDays: {
        [getRelativeDate(0)]: true,
        [getRelativeDate(-1)]: true,
        [getRelativeDate(-2)]: true,
        [getRelativeDate(-3)]: true,
        [getRelativeDate(-4)]: false,
        [getRelativeDate(-5)]: true
      }
    },
    {
      id: 'habit-2',
      name: 'Morning Meditative Breathing',
      category: 'personal',
      completedDays: {
        [getRelativeDate(0)]: true,
        [getRelativeDate(-1)]: true,
        [getRelativeDate(-2)]: false,
        [getRelativeDate(-3)]: true,
        [getRelativeDate(-4)]: true
      }
    },
    {
      id: 'habit-3',
      name: 'Write clean code (90m Deep Work)',
      category: 'work',
      completedDays: {
        [getRelativeDate(0)]: false,
        [getRelativeDate(-1)]: true,
        [getRelativeDate(-2)]: true,
        [getRelativeDate(-3)]: true,
        [getRelativeDate(-4)]: true,
        [getRelativeDate(-5)]: true
      }
    }
  ],
  schedule: [
    {
      id: 'event-1',
      title: '☕ Morning Routine & Review',
      date: getRelativeDate(0),
      startTime: '08:00',
      endTime: '09:00',
      color: '#6366f1' // Indigo
    },
    {
      id: 'event-2',
      title: '⚡ DayFlow Core Architecture Sync',
      date: getRelativeDate(0),
      startTime: '09:30',
      endTime: '11:00',
      color: '#8b5cf6' // Violet
    },
    {
      id: 'event-3',
      title: '🥗 Lunch & Screen Break',
      date: getRelativeDate(0),
      startTime: '12:30',
      endTime: '13:30',
      color: '#10b981' // Emerald
    },
    {
      id: 'event-4',
      title: '📊 Marketing Strategy Session',
      date: getRelativeDate(0),
      startTime: '14:30',
      endTime: '16:00',
      color: '#06b6d4' // Cyan
    },
    {
      id: 'event-5',
      title: '🏋️ gym Workout Session',
      date: getRelativeDate(0),
      startTime: '17:30',
      endTime: '19:00',
      color: '#ec4899' // Pink
    }
  ],
  notes: [
    {
      id: 'note-1',
      title: 'DayFlow Project Vision',
      content: `DayFlow aims to combine productivity features into a fluid, responsive single-page web app.
      
Core values:
- Hyper-clean visual design (Glassmorphism + Dark Mode default).
- Zero friction between task planning, calendar tracking, and daily schedule blockings.
- Local-first architecture (fast, responsive, privacy-preserving).
- Clear, visual representations of habits and progress.`,
      category: 'work',
      updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
    },
    {
      id: 'note-2',
      title: 'Shopping List & Meal Ideas',
      content: `- Fresh organic spinach
- Avocados (x3)
- Blueberry & raspberry mix
- Grass-fed butter / Ghee
- Sourdough loaf
- Wild-caught salmon
- Almond milk (unsweetened)`,
      category: 'personal',
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    }
  ]
};

class StateManager {
  constructor() {
    this.listeners = [];
    this.loadState();
  }

  loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.state = JSON.parse(stored);
        
        // Ensure defaults are populated if any section is missing
        Object.keys(defaultState).forEach(key => {
          if (this.state[key] === undefined) {
            this.state[key] = defaultState[key];
          }
        });
      } else {
        this.state = JSON.parse(JSON.stringify(defaultState)); // Deep clone
        this.saveState();
      }
    } catch (e) {
      console.error('Failed to load state from localStorage', e);
      this.state = JSON.parse(JSON.stringify(defaultState));
    }
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (e) {
        console.error('Error in state listener:', e);
      }
    });
  }

  // --- Theme actions ---
  setTheme(theme) {
    this.state.theme = theme;
    this.saveState();
  }

  // --- Task actions ---
  addTask({ title, date, category, difficulty }) {
    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      date,
      category,
      difficulty,
      completed: false
    };
    this.state.tasks.push(newTask);
    this.saveState();
    return newTask;
  }

  toggleTask(id) {
    const task = this.state.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveState();
    }
  }

  deleteTask(id) {
    this.state.tasks = this.state.tasks.filter(t => t.id !== id);
    this.saveState();
  }

  updateTask(id, { title, date, category, difficulty }) {
    const task = this.state.tasks.find(t => t.id === id);
    if (task) {
      if (title !== undefined) task.title = title;
      if (date !== undefined) task.date = date;
      if (category !== undefined) task.category = category;
      if (difficulty !== undefined) task.difficulty = difficulty;
      this.saveState();
    }
  }

  // --- Habit actions ---
  addHabit({ name, category }) {
    const newHabit = {
      id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      category,
      completedDays: {}
    };
    this.state.habits.push(newHabit);
    this.saveState();
    return newHabit;
  }

  toggleHabit(id, dateStr) {
    const habit = this.state.habits.find(h => h.id === id);
    if (habit) {
      if (!habit.completedDays) habit.completedDays = {};
      habit.completedDays[dateStr] = !habit.completedDays[dateStr];
      this.saveState();
    }
  }

  deleteHabit(id) {
    this.state.habits = this.state.habits.filter(h => h.id !== id);
    this.saveState();
  }

  // Calculate habit streak starting from a specific day going backwards
  calculateStreak(habit, startFromDateStr) {
    if (!habit.completedDays) return 0;
    
    let streak = 0;
    let checkDate = new Date(startFromDateStr);
    
    // Check if checkDate is today, and if it's NOT completed today, we also allow checking starting from yesterday.
    const todayStr = getRelativeDate(0);
    const yesterdayStr = getRelativeDate(-1);
    
    if (checkDate.toISOString().split('T')[0] === todayStr && !habit.completedDays[todayStr]) {
      // If today is not checked, start checking from yesterday.
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (habit.completedDays[dateStr]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
      
      // Safety bounds to prevent infinite loops (max 365 days streak check)
      if (streak >= 365) break;
    }
    
    return streak;
  }

  // --- Schedule actions ---
  addScheduleEvent({ title, date, startTime, endTime, color }) {
    const newEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      date,
      startTime,
      endTime,
      color
    };
    this.state.schedule.push(newEvent);
    this.saveState();
    return newEvent;
  }

  deleteScheduleEvent(id) {
    this.state.schedule = this.state.schedule.filter(e => e.id !== id);
    this.saveState();
  }

  // --- Note actions ---
  addNote() {
    const newNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: 'Untitled Note',
      content: '',
      category: 'personal',
      updatedAt: new Date().toISOString()
    };
    this.state.notes.unshift(newNote);
    this.saveState();
    return newNote;
  }

  updateNote(id, { title, content, category }) {
    const note = this.state.notes.find(n => n.id === id);
    if (note) {
      if (title !== undefined) note.title = title;
      if (content !== undefined) note.content = content;
      if (category !== undefined) note.category = category;
      note.updatedAt = new Date().toISOString();
      this.saveState();
    }
  }

  deleteNote(id) {
    this.state.notes = this.state.notes.filter(n => n.id !== id);
    this.saveState();
  }
}

export const appState = new StateManager();
export { getRelativeDate };
