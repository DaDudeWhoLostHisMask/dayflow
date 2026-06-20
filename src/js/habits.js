import { appState, getRelativeDate } from './state.js';
import { closeModal } from './app.js';

export function initHabits() {
  const listContainer = document.getElementById('habits-list');
  const form = document.getElementById('form-add-habit');

  // Generate last 7 days array chronologically (6 days ago -> today)
  function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        dateStr: d.toISOString().split('T')[0],
        dayNum: d.getDate(),
        dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: i === 0
      });
    }
    return days;
  }

  function render() {
    const state = appState.state;
    const habits = state.habits;
    const last7Days = getLast7Days();
    const todayStr = getRelativeDate(0);

    if (habits.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state glass-panel">
          <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          <h3>No habits being tracked</h3>
          <p>Create a habit to start tracking your daily routines and streaks.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = habits.map(habit => {
      // Calculate current streak
      const streak = appState.calculateStreak(habit, todayStr);
      const isStreakActive = streak > 0;

      // Render week grid checkmarks
      const gridHTML = last7Days.map(day => {
        const isChecked = habit.completedDays && habit.completedDays[day.dateStr];
        return `
          <div class="habit-day-col">
            <span class="habit-day-label" style="${day.isToday ? 'color: var(--accent-primary); font-weight: 700;' : ''}">${day.dayLabel.substr(0, 3)}<br>${day.dayNum}</span>
            <div class="habit-checkbox ${isChecked ? 'checked' : ''} ${day.isToday ? 'today' : ''}" 
                 data-habit-id="${habit.id}" 
                 data-date="${day.dateStr}">
              <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="habit-card glass-panel" data-id="${habit.id}">
          <div class="habit-info">
            <span class="habit-name">${escapeHTML(habit.name)}</span>
            <span class="badge badge-${habit.category}" style="align-self: flex-start;">${habit.category}</span>
          </div>
          
          <div class="habit-week-grid">
            ${gridHTML}
          </div>
          
          <div class="habit-stats">
            <div class="streak-badge ${isStreakActive ? 'active-streak' : ''}" title="Current Streak">
              <svg viewBox="0 0 24 24">
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"/>
                <path d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
              </svg>
              <span>${streak} Day${streak === 1 ? '' : 's'}</span>
            </div>
            
            <button class="task-action-btn delete btn-delete-habit" title="Delete Habit">
              <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Bind event listeners to checkbox triggers
    listContainer.querySelectorAll('.habit-checkbox').forEach(box => {
      box.addEventListener('click', () => {
        const id = box.getAttribute('data-habit-id');
        const dateStr = box.getAttribute('data-date');
        appState.toggleHabit(id, dateStr);
      });
    });

    // Bind delete event listeners
    listContainer.querySelectorAll('.btn-delete-habit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.habit-card');
        const id = card.getAttribute('data-id');
        appState.deleteHabit(id);
      });
    });
  }

  // Handle Form Submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('habit-input-name').value.trim();
    const category = document.getElementById('habit-input-category').value;

    if (!name) return;

    appState.addHabit({ name, category });
    closeModal('modal-add-habit');
  });

  // Subscribe to state updates
  appState.subscribe(() => {
    render();
  });

  // Run initial render
  render();

  return { render };
}

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
