import { appState } from './state.js';
import { initTasks } from './tasks.js';
import { initHabits } from './habits.js';
import { initCalendar } from './calendar.js';
import { initSchedule } from './schedule.js';
import { initNotes } from './notes.js';

// DOM elements
const themeToggle = document.getElementById('theme-toggle');
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view-container');
const timeDisplay = document.getElementById('live-time');
const dateDisplay = document.getElementById('live-date');

// Navigation management
function switchView(viewName) {
  // Update nav menu UI
  navItems.forEach(item => {
    if (item.getAttribute('data-view') === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Toggle visible view container
  views.forEach(view => {
    if (view.id === `view-${viewName}`) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });

  // Custom view trigger events (for views to re-calculate sizes if needed)
  window.dispatchEvent(new CustomEvent('view-switched', { detail: { view: viewName } }));
}

// Set up live clock
function startClock() {
  function updateClock() {
    const now = new Date();
    
    // Time formatting
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    timeDisplay.textContent = now.toLocaleTimeString('en-US', timeOptions);
    
    // Date formatting (Sat, Jun 20)
    const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    dateDisplay.textContent = now.toLocaleDateString('en-US', dateOptions);
  }
  
  updateClock();
  setInterval(updateClock, 1000);
}

// Setup theme switcher
function initTheme(state) {
  const currentTheme = state.theme || 'dark';
  document.body.setAttribute('data-theme', currentTheme);
  themeToggle.checked = currentTheme === 'light';
  
  themeToggle.addEventListener('change', () => {
    const newTheme = themeToggle.checked ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    appState.setTheme(newTheme);
  });
}

// Global modal handling
function initModals() {
  // Find modal open triggers
  document.getElementById('btn-add-task-modal').addEventListener('click', () => {
    openModal('modal-add-task');
  });

  document.getElementById('btn-add-habit-modal').addEventListener('click', () => {
    openModal('modal-add-habit');
  });

  document.getElementById('btn-add-event-modal').addEventListener('click', () => {
    openModal('modal-add-event');
  });

  // Close triggers
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close-modal');
      closeModal(modalId);
    });
  });

  // Close modal when clicking outside contents
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });
}

export function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    
    // Pre-populate input defaults if editing/creating
    if (id === 'modal-add-task') {
      document.getElementById('task-input-date').value = new Date().toISOString().split('T')[0];
    } else if (id === 'modal-add-event') {
      document.getElementById('event-input-date').value = new Date().toISOString().split('T')[0];
    }
  }
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
    
    // Reset forms inside modal
    const form = modal.querySelector('form');
    if (form) form.reset();
  }
}

// Core App Initialization
function init() {
  const state = appState.state;
  
  startClock();
  initTheme(state);
  initModals();
  
  // Set up view controllers
  const tasksController = initTasks();
  const habitsController = initHabits();
  const calendarController = initCalendar();
  const scheduleController = initSchedule();
  const notesController = initNotes();
  
  // Route view clicks
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const viewName = item.getAttribute('data-view');
      switchView(viewName);
    });
  });

  // Listen to state changes to global app updates if any
  appState.subscribe((updatedState) => {
    // If the theme changed from another mechanism (not toggle element directly)
    if (document.body.getAttribute('data-theme') !== updatedState.theme) {
      document.body.setAttribute('data-theme', updatedState.theme);
      themeToggle.checked = updatedState.theme === 'light';
    }
  });

  // Log successfully loaded application
  console.log('DayFlow successfully initialized.');
}

window.addEventListener('DOMContentLoaded', init);
