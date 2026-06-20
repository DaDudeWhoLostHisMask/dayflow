import { appState } from './state.js';

export function initNotes() {
  const notesList = document.getElementById('notes-list');
  const searchInput = document.getElementById('note-search');
  const btnNewNote = document.getElementById('btn-new-note');
  
  // Editor panel elements
  const editorPanel = document.getElementById('note-editor');
  const emptyState = document.getElementById('note-empty-state');
  const titleField = document.getElementById('note-title-field');
  const contentField = document.getElementById('note-content-field');
  const categoryField = document.getElementById('note-category-field');
  const deleteBtn = document.getElementById('btn-delete-note');
  
  // Indicators
  const wordCountDisplay = document.getElementById('note-word-count');
  const saveStatusText = document.getElementById('save-status-text');
  const saveStatusIcon = document.querySelector('.notes-editor-save-indicator svg');

  let activeNoteId = null;
  let saveDebounceTimeout = null;

  function renderList() {
    const state = appState.state;
    const notes = state.notes;
    const query = searchInput.value.toLowerCase().trim();

    // Filter notes
    const filteredNotes = notes.filter(note => {
      return note.title.toLowerCase().includes(query) || 
             note.content.toLowerCase().includes(query);
    });

    if (filteredNotes.length === 0) {
      notesList.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-dimmed); font-size: 0.85rem;">
          No notes match your search.
        </div>
      `;
      return;
    }

    notesList.innerHTML = filteredNotes.map(note => {
      const isSelected = note.id === activeNoteId;
      const previewText = note.content 
        ? escapeHTML(note.content) 
        : '<em style="color: var(--text-dimmed)">No content yet</em>';
      const formattedDate = new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return `
        <div class="note-item ${isSelected ? 'active' : ''}" data-id="${note.id}">
          <div class="note-item-header">
            <span class="note-item-title">${escapeHTML(note.title || 'Untitled Note')}</span>
            <span class="badge badge-${note.category}" style="font-size: 0.65rem; padding: 1px 6px;">${note.category}</span>
          </div>
          <p class="note-item-preview">${previewText}</p>
          <div class="note-item-meta">
            <span class="note-item-date">${formattedDate}</span>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to items
    notesList.querySelectorAll('.note-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        selectNote(id);
      });
    });
  }

  function selectNote(id) {
    activeNoteId = id;
    const notes = appState.state.notes;
    const note = notes.find(n => n.id === id);

    if (note) {
      // Show editor, hide empty state
      editorPanel.style.display = 'flex';
      emptyState.style.display = 'none';

      // Load values (temporarily detach listeners to prevent saving on loading)
      titleField.value = note.title;
      contentField.value = note.content;
      categoryField.value = note.category;

      updateWordCount(note.content);
      showSavedStatus();
      renderList();
    } else {
      activeNoteId = null;
      editorPanel.style.display = 'none';
      emptyState.style.display = 'flex';
      renderList();
    }
  }

  // Trigger Save on changes (debounce to prevent constant re-writing)
  function triggerAutoSave() {
    if (!activeNoteId) return;
    
    // Update status UI
    saveStatusText.textContent = 'Saving...';
    saveStatusIcon.style.stroke = 'var(--text-dimmed)';

    clearTimeout(saveDebounceTimeout);
    saveDebounceTimeout = setTimeout(() => {
      const title = titleField.value;
      const content = contentField.value;
      const category = categoryField.value;

      appState.updateNote(activeNoteId, { title, content, category });
      updateWordCount(content);
      showSavedStatus();
    }, 600); // 600ms debounce
  }

  function showSavedStatus() {
    saveStatusText.textContent = 'Saved';
    saveStatusIcon.style.stroke = 'var(--color-health)';
  }

  function updateWordCount(text) {
    const cleanText = text.trim();
    const words = cleanText === '' ? 0 : cleanText.split(/\s+/).length;
    wordCountDisplay.textContent = `${words} word${words === 1 ? '' : 's'}`;
  }

  // Event Listeners
  titleField.addEventListener('input', triggerAutoSave);
  contentField.addEventListener('input', triggerAutoSave);
  categoryField.addEventListener('change', triggerAutoSave);

  // New Note
  btnNewNote.addEventListener('click', () => {
    const newNote = appState.addNote();
    selectNote(newNote.id);
  });

  // Delete Note
  deleteBtn.addEventListener('click', () => {
    if (activeNoteId && confirm('Are you sure you want to delete this note?')) {
      const idToDelete = activeNoteId;
      selectNote(null); // Clear selected note
      appState.deleteNote(idToDelete);
    }
  });

  // Search filter
  searchInput.addEventListener('input', renderList);

  // Subscribe to updates (re-render sidebar if notes change elsewhere)
  appState.subscribe((updatedState) => {
    // Only re-render list sidebar, editor values are self-contained
    renderList();
  });

  // Render initial sidebar
  renderList();

  return { 
    render: () => {
      renderList();
    } 
  };
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
