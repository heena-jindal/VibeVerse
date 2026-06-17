document.addEventListener('DOMContentLoaded', function() {
  const journalContent = document.getElementById('journalContent');
  const charCounter = document.getElementById('charCounter');
  const saveBtn = document.getElementById('saveBtn');
  const writeMessage = document.getElementById('writeMessage');
  const moodPills = document.querySelectorAll('.journal-mood-pills .pill');
  const loadingState = document.getElementById('loadingState');
  const entriesList = document.getElementById('entriesList');
  const emptyState = document.getElementById('emptyState');
  const entryCount = document.getElementById('entryCount');
  const deleteDialog = document.getElementById('deleteDialog');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  let selectedMood = null;
  let entryToDelete = null;
  let entries = [];

  // Mood pill selection
  moodPills.forEach(pill => {
    pill.addEventListener('click', function() {
      moodPills.forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      selectedMood = this.dataset.mood;
    });
  });

  // Character counter
  journalContent.addEventListener('input', function() {
    const count = this.value.length;
    charCounter.textContent = count + '/2000';
    
    if (count >= 1900) {
      charCounter.className = 'char-counter danger';
    } else if (count >= 1500) {
      charCounter.className = 'char-counter warning';
    } else {
      charCounter.className = 'char-counter';
    }
  });

  // Ctrl+Enter to save
  journalContent.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
      saveEntry();
    }
  });

  // Show message
  function showMessage(message, isError = true) {
    writeMessage.textContent = message;
    writeMessage.className = 'message show mt-3 ' + (isError ? 'message-error' : 'message-success');
    setTimeout(() => {
      writeMessage.className = 'message mt-3';
    }, 3000);
  }

  // Load entries
  async function loadEntries() {
    try {
      const response = await fetch('/api/journal');
      
      if (response.redirected) {
        window.location.href = '/login';
        return;
      }

      const data = await response.json();
      entries = data.entries || [];
      
      updateEntryCount();
      renderEntries();
    } catch (error) {
      loadingState.style.display = 'none';
      emptyState.style.display = 'block';
    }
  }

  // Update entry count
  function updateEntryCount() {
    const count = entries.length;
    entryCount.textContent = count + ' ' + (count === 1 ? 'entry' : 'entries');
  }

  // Render entries
  function renderEntries() {
    loadingState.style.display = 'none';

    if (entries.length === 0) {
      entriesList.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    entriesList.style.display = 'flex';

    entriesList.innerHTML = entries.map(entry => {
      const moodClass = getMoodClass(entry.mood_tag);
      const formattedDate = formatDate(entry.timestamp || entry.created_at);
      
      return '<div class="journal-entry card" data-id="' + entry.id + '">' +
        '<div class="journal-entry-header">' +
          '<div class="journal-entry-meta">' +
            '<span class="badge ' + moodClass + '">' + escapeHtml(entry.mood_tag) + '</span>' +
            '<span class="journal-entry-date">' + formattedDate + '</span>' +
          '</div>' +
          '<button class="journal-entry-delete" data-id="' + entry.id + '" aria-label="Delete entry">&times;</button>' +
        '</div>' +
        '<div class="journal-entry-content">' + escapeHtml(entry.content) + '</div>' +
      '</div>';
    }).join('');

    // Add delete event listeners
    document.querySelectorAll('.journal-entry-delete').forEach(btn => {
      btn.addEventListener('click', function() {
        entryToDelete = parseInt(this.dataset.id);
        showDeleteDialog();
      });
    });
  }

  // Get mood badge class
  function getMoodClass(mood) {
    if (!mood) return 'badge-primary';
    const moodLower = mood.toLowerCase();
    const moodMap = {
      'reflective': 'badge-reflective',
      'happy': 'badge-happy',
      'nervous': 'badge-nervous',
      'sad': 'badge-sad',
      'proud': 'badge-proud',
      'confused': 'badge-confused'
    };
    return moodMap[moodLower] || 'badge-primary';
  }

  // Format date
  function formatDate(dateString) {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
  }

  // Escape HTML
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Save entry
  async function saveEntry() {
    const content = journalContent.value.trim();

    if (!content) {
      showMessage('Please write something before saving.');
      return;
    }

    if (!selectedMood) {
      showMessage('Please select a mood.');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          mood_tag: selectedMood
        }),
      });

      const data = await response.json();

      if (data.success) {
        showMessage('Entry saved successfully!', false);
        
        // Reset form
        journalContent.value = '';
        charCounter.textContent = '0/2000';
        charCounter.className = 'char-counter';
        moodPills.forEach(p => p.classList.remove('active'));
        selectedMood = null;

        // Reload entries
        loadEntries();
      } else {
        showMessage(data.message || 'Failed to save entry.');
      }
    } catch (error) {
      showMessage('An error occurred. Please try again.');
    }

    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Entry';
  }

  // Show delete dialog
  function showDeleteDialog() {
    deleteDialog.classList.add('show');
  }

  // Hide delete dialog
  function hideDeleteDialog() {
    deleteDialog.classList.remove('show');
    entryToDelete = null;
  }

  // Delete entry
  async function deleteEntry() {
    if (!entryToDelete) return;

    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = 'Deleting...';

    try {
      const response = await fetch('/api/journal/' + entryToDelete, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Animate removal
        const entryElement = document.querySelector('.journal-entry[data-id="' + entryToDelete + '"]');
        if (entryElement) {
          entryElement.classList.add('removing');
          setTimeout(() => {
            entries = entries.filter(e => e.id !== entryToDelete);
            updateEntryCount();
            renderEntries();
          }, 300);
        } else {
          entries = entries.filter(e => e.id !== entryToDelete);
          updateEntryCount();
          renderEntries();
        }
      } else {
        alert(data.message || 'Failed to delete entry.');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    }

    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.textContent = 'Delete';
    hideDeleteDialog();
  }

  // Event listeners
  saveBtn.addEventListener('click', saveEntry);
  cancelDeleteBtn.addEventListener('click', hideDeleteDialog);
  confirmDeleteBtn.addEventListener('click', deleteEntry);

  // Close dialog on overlay click
  deleteDialog.addEventListener('click', function(e) {
    if (e.target === deleteDialog) {
      hideDeleteDialog();
    }
  });

  // Logout
  logoutBtn.addEventListener('click', async function() {
    try {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      window.location.href = '/login';
    }
  });

  // Load entries on page load
  loadEntries();
});
