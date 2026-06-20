import { appState } from './state.js';
import { closeModal, openModal } from './app.js';

export function initTasks() {
  const listContainer = document.getElementById('tasks-list');
  const searchInput = document.getElementById('task-search');
  const sortSelect = document.getElementById('task-sort');
  const statusFilter = document.getElementById('task-filter-status');
  const categoryFilters = document.querySelectorAll('[data-filter-type="category"]');
  const form = document.getElementById('form-add-task');
  
  let editingTaskId = null;
  
  // Stats selectors
  const pctDisplay = document.getElementById('task-completion-pct');
  const fillBar = document.getElementById('task-progress-fill');
  const completedCount = document.getElementById('task-completed-count');
  const pendingCount = document.getElementById('task-pending-count');

  let activeCategoryFilter = 'all';

  // Render list based on filters
  function render() {
    const state = appState.state;
    const tasks = state.tasks;
    
    // 1. Calculate statistics
    updateStatistics(tasks);

    // 2. Filter tasks
    const query = searchInput.value.toLowerCase().trim();
    const statusVal = statusFilter.value; // 'all', 'active', 'completed'
    
    let filteredTasks = tasks.filter(task => {
      // Search query filter
      const matchesSearch = task.title.toLowerCase().includes(query);
      
      // Status filter
      const matchesStatus = statusVal === 'all' 
        ? true 
        : (statusVal === 'completed' ? task.completed : !task.completed);
        
      // Category filter
      const matchesCategory = activeCategoryFilter === 'all'
        ? true
        : task.category === activeCategoryFilter;
        
      return matchesSearch && matchesStatus && matchesCategory;
    });

    // 3. Sort tasks
    const sortVal = sortSelect.value;
    filteredTasks.sort((a, b) => {
      if (sortVal === 'date') {
        return new Date(a.date) - new Date(b.date);
      } else if (sortVal === 'difficulty') {
        const diffWeight = { hard: 3, medium: 2, easy: 1 };
        return diffWeight[b.difficulty] - diffWeight[a.difficulty]; // hard first
      } else if (sortVal === 'category') {
        return a.category.localeCompare(b.category);
      } else if (sortVal === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    // 4. Render HTML
    if (filteredTasks.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state glass-panel">
          <svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <h3>No tasks found</h3>
          <p>Create a task or change your active filters to see tasks here.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filteredTasks.map(task => {
      const formattedDate = formatDateString(task.date);
      return `
        <div class="task-card ${task.completed ? 'completed' : ''}" data-id="${task.id}">
          <div class="task-card-left">
            <div class="checkbox-custom btn-toggle-task">
              <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="task-details">
              <span class="task-title">${escapeHTML(task.title)}</span>
              <div class="task-meta">
                <span class="task-date-tag">
                  <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  ${formattedDate}
                </span>
                <span class="badge badge-${task.category}">${task.category}</span>
                <span class="badge badge-${task.difficulty}">${task.difficulty}</span>
              </div>
            </div>
          </div>
          <div class="task-card-right">
            <button class="task-action-btn edit btn-edit-task" title="Edit Task">
              <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="task-action-btn delete btn-delete-task" title="Delete Task">
              <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Bind event listeners to dynamic list items
    listContainer.querySelectorAll('.btn-toggle-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.task-card');
        const id = card.getAttribute('data-id');
        appState.toggleTask(id);
      });
    });

    listContainer.querySelectorAll('.btn-edit-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.task-card');
        const id = card.getAttribute('data-id');
        startEditTask(id);
      });
    });

    listContainer.querySelectorAll('.btn-delete-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.task-card');
        const id = card.getAttribute('data-id');
        appState.deleteTask(id);
      });
    });
  }

  function updateStatistics(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

    // Update statistics numbers
    completedCount.textContent = completed;
    pendingCount.textContent = pending;
    pctDisplay.textContent = `${pct}%`;
    fillBar.style.width = `${pct}%`;

    // Update category badge counts on filters
    const counts = { all: total, work: 0, personal: 0, health: 0, finance: 0, other: 0 };
    tasks.forEach(t => {
      if (counts[t.category] !== undefined) {
        counts[t.category]++;
      }
    });

    Object.keys(counts).forEach(cat => {
      const counterEl = document.getElementById(`count-cat-${cat}`);
      if (counterEl) counterEl.textContent = counts[cat];
    });
  }

  // Setup view actions
  searchInput.addEventListener('input', render);
  sortSelect.addEventListener('change', render);
  statusFilter.addEventListener('change', render);

  // Setup sidebar category filters
  categoryFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategoryFilter = btn.getAttribute('data-filter-val');
      render();
    });
  });

  // Reset modal styling when opening to create a new task
  document.getElementById('btn-add-task-modal').addEventListener('click', () => {
    editingTaskId = null;
    document.querySelector('#modal-add-task .modal-title').textContent = 'Create Task';
    document.querySelector('#modal-add-task button[type="submit"]').textContent = 'Create Task';
  });

  function startEditTask(id) {
    const task = appState.state.tasks.find(t => t.id === id);
    if (!task) return;

    editingTaskId = id;

    // Load values into modal inputs
    document.getElementById('task-input-title').value = task.title;
    document.getElementById('task-input-date').value = task.date;
    document.getElementById('task-input-category').value = task.category;
    document.getElementById('task-input-difficulty').value = task.difficulty;

    // Adjust modal text
    document.querySelector('#modal-add-task .modal-title').textContent = 'Edit Task';
    document.querySelector('#modal-add-task button[type="submit"]').textContent = 'Save Changes';

    openModal('modal-add-task');
  }

  // Handle Form Submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('task-input-title').value.trim();
    const date = document.getElementById('task-input-date').value;
    const category = document.getElementById('task-input-category').value;
    const difficulty = document.getElementById('task-input-difficulty').value;

    if (!title || !date) return;

    if (editingTaskId) {
      appState.updateTask(editingTaskId, { title, date, category, difficulty });
      editingTaskId = null;
    } else {
      appState.addTask({ title, date, category, difficulty });
    }
    
    closeModal('modal-add-task');
  });

  // Subscribe to updates
  appState.subscribe(() => {
    render();
  });

  // Run initial render
  render();

  return { render };
}

// Helpers
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

function formatDateString(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  // Format as short month + day (e.g. Jun 20)
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  
  if (d.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (d.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
