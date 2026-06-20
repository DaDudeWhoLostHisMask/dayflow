import { appState, getRelativeDate } from './state.js';
import { closeModal, openModal } from './app.js';

export function initSchedule() {
  const gridContainer = document.getElementById('schedule-grid-container');
  const eventsOverlay = document.getElementById('schedule-events-overlay');
  
  const dateDisplay = document.getElementById('schedule-date-text');
  const prevDayBtn = document.getElementById('schedule-prev-day');
  const nextDayBtn = document.getElementById('schedule-next-day');
  const todayBtn = document.getElementById('schedule-today-btn');
  
  const form = document.getElementById('form-add-event');
  const startSelect = document.getElementById('event-input-start');
  const endSelect = document.getElementById('event-input-end');
  const colorOptions = document.querySelectorAll('#event-color-picker .color-option');

  // Timeline configuration
  const START_HOUR = 7; // 7 AM
  const END_HOUR = 22;  // 10 PM
  const ROW_HEIGHT = 60; // 60px per hour row

  let selectedDate = new Date(); // Javascript Date Object
  let selectedColor = '#6366f1'; // Indigo default

  // Populate time dropdowns (06:00 to 23:30, 30 min intervals)
  function populateTimeSelectors() {
    startSelect.innerHTML = '';
    endSelect.innerHTML = '';
    
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
      ['00', '30'].forEach(min => {
        const timeStr = `${String(hour).padStart(2, '0')}:${min}`;
        
        const optionStart = document.createElement('option');
        optionStart.value = timeStr;
        optionStart.textContent = timeStr;
        startSelect.appendChild(optionStart);

        const optionEnd = document.createElement('option');
        optionEnd.value = timeStr;
        optionEnd.textContent = timeStr;
        endSelect.appendChild(optionEnd);
      });
    }
    
    // Add final end hour option (e.g. 23:00)
    const finalTimeStr = `${String(END_HOUR + 1).padStart(2, '0')}:00`;
    const optionEnd = document.createElement('option');
    optionEnd.value = finalTimeStr;
    optionEnd.textContent = finalTimeStr;
    endSelect.appendChild(optionEnd);

    // Set defaults
    startSelect.value = '09:00';
    endSelect.value = '10:00';
  }

  // Convert "HH:MM" to decimal hours (e.g., "09:30" -> 9.5)
  function timeToDecimal(timeStr) {
    const [hrs, mins] = timeStr.split(':').map(Number);
    return hrs + (mins / 60);
  }

  function render() {
    const state = appState.state;
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
    // 1. Update date title
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    dateDisplay.textContent = selectedDate.toLocaleDateString('en-US', options);

    // 2. Clear old cells and overlay content
    // Keep overlay, remove old hour rows
    const oldRows = gridContainer.querySelectorAll('.schedule-hour-row');
    oldRows.forEach(r => r.remove());
    eventsOverlay.innerHTML = '';

    // 3. Render hour rows
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
      const row = document.createElement('div');
      row.className = 'schedule-hour-row';
      row.setAttribute('data-time', `${String(hour).padStart(2, '0')}:00`);
      
      const timeCol = document.createElement('div');
      timeCol.className = 'schedule-hour-time';
      
      // Format to 12 hour or simple 24 hour: Let's do elegant 12-hour (e.g., "08:00 AM")
      const suffix = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
      timeCol.textContent = `${String(displayHour).padStart(2, '0')}:00 ${suffix}`;
      
      const cellCol = document.createElement('div');
      cellCol.className = 'schedule-hour-cell';

      row.appendChild(timeCol);
      row.appendChild(cellCol);

      // Clicking an empty hour row opens modal pre-filled with that hour
      row.addEventListener('click', (e) => {
        // Prevent trigger if clicking on an event block
        if (e.target.closest('.schedule-event-block')) return;

        const clickedHourStr = `${String(hour).padStart(2, '0')}:00`;
        const nextHourStr = `${String(hour + 1).padStart(2, '0')}:00`;
        
        openModal('modal-add-event');
        document.getElementById('event-input-date').value = selectedDateStr;
        startSelect.value = clickedHourStr;
        endSelect.value = nextHourStr;
      });

      gridContainer.insertBefore(row, eventsOverlay);
    }

    // 4. Render event blocks on overlay
    const dayEvents = state.schedule.filter(e => e.date === selectedDateStr);

    dayEvents.forEach(event => {
      const startDec = timeToDecimal(event.startTime);
      const endDec = timeToDecimal(event.endTime);

      // Boundaries checking
      if (startDec >= START_HOUR && startDec <= END_HOUR + 1) {
        const topPos = (startDec - START_HOUR) * ROW_HEIGHT;
        const blockHeight = (endDec - startDec) * ROW_HEIGHT;

        const block = document.createElement('div');
        block.className = 'schedule-event-block';
        block.style.top = `${topPos}px`;
        block.style.height = `${blockHeight}px`;
        block.style.backgroundColor = event.color;
        block.style.boxShadow = `0 4px 12px ${event.color}40`; // Soft matching glow
        block.setAttribute('data-id', event.id);

        block.innerHTML = `
          <span class="schedule-event-title">${escapeHTML(event.title)}</span>
          <div style="display: flex; justify-content: space-between; align-items: flex-end; width:100%;">
            <span class="schedule-event-time">${event.startTime} - ${event.endTime}</span>
            <button class="task-action-btn btn-delete-event" style="padding: 2px; color: white;" title="Delete Activity">
              <svg viewBox="0 0 24 24" style="width: 12px; height: 12px; stroke: currentColor;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
            </button>
          </div>
        `;

        // Bind delete action
        block.querySelector('.btn-delete-event').addEventListener('click', (e) => {
          e.stopPropagation(); // Avoid cell click triggers
          appState.deleteScheduleEvent(event.id);
        });

        eventsOverlay.appendChild(block);
      }
    });
  }

  // Color picker handling
  colorOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      colorOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedColor = opt.getAttribute('data-color');
    });
  });

  // Date Navigation
  prevDayBtn.addEventListener('click', () => {
    selectedDate.setDate(selectedDate.getDate() - 1);
    render();
  });

  nextDayBtn.addEventListener('click', () => {
    selectedDate.setDate(selectedDate.getDate() + 1);
    render();
  });

  todayBtn.addEventListener('click', () => {
    selectedDate = new Date();
    render();
  });

  // Handle Form Submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('event-input-title').value.trim();
    const date = document.getElementById('event-input-date').value;
    const start = startSelect.value;
    const end = endSelect.value;

    if (!title || !date) return;

    // Time order validation
    const startDec = timeToDecimal(start);
    const endDec = timeToDecimal(end);
    
    if (endDec <= startDec) {
      alert('Error: End time must be strictly after the start time.');
      return;
    }

    appState.addScheduleEvent({
      title,
      date,
      startTime: start,
      endTime: end,
      color: selectedColor
    });

    closeModal('modal-add-event');
  });

  // Subscribe to updates
  appState.subscribe(() => {
    render();
  });

  // Init dropdown contents
  populateTimeSelectors();
  
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
