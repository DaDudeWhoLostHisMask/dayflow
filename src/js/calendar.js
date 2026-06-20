import { appState } from './state.js';

export function initCalendar() {
  const gridContainer = document.getElementById('calendar-days-grid');
  const monthYearTitle = document.getElementById('calendar-month-year');
  const prevMonthBtn = document.getElementById('calendar-prev-month');
  const nextMonthBtn = document.getElementById('calendar-next-month');
  
  const activeDateTitle = document.getElementById('calendar-active-date');
  const activeSummary = document.getElementById('calendar-active-summary');
  const dayTasksList = document.getElementById('calendar-day-tasks-list');

  const today = new Date();
  let currentMonth = today.getMonth(); // 0-11
  let currentYear = today.getFullYear();
  let selectedDateStr = today.toISOString().split('T')[0];

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function render() {
    const state = appState.state;
    const tasks = state.tasks;

    // Set month/year header text
    const dateObj = new Date(currentYear, currentMonth);
    monthYearTitle.textContent = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Clear grid
    gridContainer.innerHTML = '';

    // Render weekday headers
    weekdayNames.forEach(day => {
      const headerCell = document.createElement('div');
      headerCell.className = 'calendar-weekday';
      headerCell.textContent = day;
      gridContainer.appendChild(headerCell);
    });

    // Calculate calendar grid metrics
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // Day of week (0-6)
    const numDays = new Date(currentYear, currentMonth + 1, 0).getDate(); // Days in current month
    const numDaysPrev = new Date(currentYear, currentMonth, 0).getDate(); // Days in prev month
    
    // Total cells in grid: firstDayIndex + numDays + trailing days to fill multiples of 7 (usually 35 or 42 cells)
    const totalCells = Math.ceil((firstDayIndex + numDays) / 7) * 7;

    // Render cells
    for (let i = 0; i < totalCells; i++) {
      const dayCell = document.createElement('div');
      dayCell.className = 'calendar-day-cell';

      let dayNum;
      let cellDateStr;
      let isOutside = false;

      if (i < firstDayIndex) {
        // Prev month days
        dayNum = numDaysPrev - firstDayIndex + 1 + i;
        isOutside = true;
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        cellDateStr = formatDateStr(prevYear, prevMonth, dayNum);
      } else if (i < firstDayIndex + numDays) {
        // Current month days
        dayNum = i - firstDayIndex + 1;
        cellDateStr = formatDateStr(currentYear, currentMonth, dayNum);
        
        // Highlight today
        const cellDate = new Date(currentYear, currentMonth, dayNum);
        if (cellDate.toDateString() === today.toDateString()) {
          dayCell.classList.add('today');
        }
      } else {
        // Next month days
        dayNum = i - firstDayIndex - numDays + 1;
        isOutside = true;
        const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        cellDateStr = formatDateStr(nextYear, nextMonth, dayNum);
      }

      if (isOutside) {
        dayCell.classList.add('outside');
      }

      if (cellDateStr === selectedDateStr) {
        dayCell.classList.add('active-day');
      }

      dayCell.setAttribute('data-date', cellDateStr);

      // Render Day Number
      const numLabel = document.createElement('span');
      numLabel.className = 'calendar-day-num';
      numLabel.textContent = dayNum;
      dayCell.appendChild(numLabel);

      // Synced Tasks Dots
      const dayTasks = tasks.filter(t => t.date === cellDateStr);
      if (dayTasks.length > 0) {
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'calendar-day-dots';
        
        // Render category dots (limit to 4 dots for layout safety)
        dayTasks.slice(0, 4).forEach(t => {
          const dot = document.createElement('div');
          dot.className = `calendar-day-dot ${t.category}`;
          dot.title = t.title;
          dotsContainer.appendChild(dot);
        });
        
        if (dayTasks.length > 4) {
          const plusIndicator = document.createElement('span');
          plusIndicator.style.fontSize = '0.65rem';
          plusIndicator.style.fontWeight = '700';
          plusIndicator.style.color = 'var(--text-muted)';
          plusIndicator.textContent = `+${dayTasks.length - 4}`;
          dotsContainer.appendChild(plusIndicator);
        }
        
        dayCell.appendChild(dotsContainer);
      }

      // Add click listener
      dayCell.addEventListener('click', () => {
        selectedDateStr = cellDateStr;
        render(); // Re-render to update selected highlights and sidebar
      });

      gridContainer.appendChild(dayCell);
    }

    // Render the right-side task list sidebar for the selected date
    renderSidebar(selectedDateStr, tasks);
  }

  function renderSidebar(dateStr, tasks) {
    const dayTasks = tasks.filter(t => t.date === dateStr);
    
    // Format title date
    const d = new Date(dateStr + 'T00:00:00'); // Prevent timezone shift
    activeDateTitle.textContent = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    activeSummary.textContent = `${dayTasks.length} Task${dayTasks.length === 1 ? '' : 's'} scheduled`;

    if (dayTasks.length === 0) {
      dayTasksList.innerHTML = `
        <div class="empty-state" style="padding: 20px; font-size: 0.85rem;">
          <svg viewBox="0 0 24 24" style="width:32px; height:32px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p>No tasks scheduled for this day.</p>
        </div>
      `;
      return;
    }

    dayTasksList.innerHTML = dayTasks.map(task => {
      return `
        <div class="task-card ${task.completed ? 'completed' : ''}" data-id="${task.id}" style="padding: 12px 14px; border-radius: 12px; gap: 8px;">
          <div class="task-card-left">
            <div class="checkbox-custom btn-toggle-calendar-task" style="width: 18px; height: 18px; border-radius: 4px;">
              <svg viewBox="0 0 24 24" style="width: 10px; height: 10px;"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="task-details" style="gap: 2px;">
              <span class="task-title" style="font-size: 0.85rem;">${escapeHTML(task.title)}</span>
              <div class="task-meta">
                <span class="badge badge-${task.category}" style="font-size: 0.65rem; padding: 1px 6px;">${task.category}</span>
              </div>
            </div>
          </div>
          <div class="task-card-right">
            <button class="task-action-btn delete btn-delete-calendar-task" style="padding: 4px;" title="Delete Task">
              <svg viewBox="0 0 24 24" style="width: 14px; height: 14px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach checkbox events
    dayTasksList.querySelectorAll('.btn-toggle-calendar-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('.task-card').getAttribute('data-id');
        appState.toggleTask(id);
      });
    });

    // Attach delete events
    dayTasksList.querySelectorAll('.btn-delete-calendar-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('.task-card').getAttribute('data-id');
        appState.deleteTask(id);
      });
    });
  }

  // Navigation handlers
  prevMonthBtn.addEventListener('click', () => {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth--;
    }
    render();
  });

  nextMonthBtn.addEventListener('click', () => {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth++;
    }
    render();
  });

  // Helper: Format string as YYYY-MM-DD
  function formatDateStr(year, month, day) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }

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
