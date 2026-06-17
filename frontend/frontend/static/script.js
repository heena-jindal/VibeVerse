document.addEventListener('DOMContentLoaded', function() {
  const loadingState = document.getElementById('loadingState');
  const historyContent = document.getElementById('historyContent');
  const emptyState = document.getElementById('emptyState');
  const moodSummary = document.getElementById('moodSummary');
  const historyList = document.getElementById('historyList');
  const logoutBtn = document.getElementById('logoutBtn');

  // Situation label mapping
  const situationLabels = {
    'in_class': 'In Class',
    'canteen': 'Canteen',
    'first_day': 'First Day',
    'group_project': 'Group Project',
    'presentation': 'Presentation'
  };

  // Load history
  async function loadHistory() {
    try {
      const response = await fetch('/api/history');
      
      if (response.redirected) {
        window.location.href = '/login';
        return;
      }

      const data = await response.json();
      
      if (data.chats && data.chats.length > 0) {
        renderMoodSummary(data.counts || []);
        renderHistory(data.chats);
        loadingState.style.display = 'none';
        historyContent.style.display = 'block';
      } else {
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
      }
    } catch (error) {
      loadingState.style.display = 'none';
      emptyState.style.display = 'block';
    }
  }

  // Render mood summary cards
  function renderMoodSummary(counts) {
    if (!counts || counts.length === 0) {
      moodSummary.style.display = 'none';
      return;
    }

    moodSummary.innerHTML = counts.map(item => {
      return '<div class="mood-summary-card card">' +
        '<div class="mood-summary-count">' + item.count + '</div>' +
        '<div class="mood-summary-label">' + escapeHtml(item.mood) + '</div>' +
      '</div>';
    }).join('');
  }

  // Render history list
  function renderHistory(chats) {
    historyList.innerHTML = chats.map(chat => {
      const moodClass = getMoodClass(chat.mood);
      const situationLabel = situationLabels[chat.situation] || chat.situation;
      const formattedDate = formatDate(chat.timestamp);

      return '<div class="history-card card">' +
        '<div class="history-header">' +
          '<span class="badge ' + moodClass + '">' + escapeHtml(chat.mood) + '</span>' +
          '<span class="badge badge-situation">' + escapeHtml(situationLabel) + '</span>' +
          '<span class="history-timestamp">' + formattedDate + '</span>' +
        '</div>' +
        '<div class="history-user-message">' + escapeHtml(chat.user_message) + '</div>' +
        '<div class="history-bot-reply">' + escapeHtml(chat.bot_reply) + '</div>' +
      '</div>';
    }).join('');
  }

  // Get mood badge class
  function getMoodClass(mood) {
    if (!mood) return 'badge-nervous';
    const moodLower = mood.toLowerCase().replace(' ', '-');
    const moodMap = {
      'very-anxious': 'badge-anxious',
      'very anxious': 'badge-anxious',
      'anxious': 'badge-anxious',
      'nervous': 'badge-nervous',
      'confused': 'badge-confused',
      'okay': 'badge-okay',
      'confident': 'badge-confident'
    };
    return moodMap[moodLower] || 'badge-nervous';
  }

  // Format date
  function formatDate(dateString) {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return diffMins + ' min' + (diffMins === 1 ? '' : 's') + ' ago';
    if (diffHours < 24) return diffHours + ' hour' + (diffHours === 1 ? '' : 's') + ' ago';
    if (diffDays < 7) return diffDays + ' day' + (diffDays === 1 ? '' : 's') + ' ago';
    
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Logout
  logoutBtn.addEventListener('click', async function() {
    try {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      window.location.href = '/login';
    }
  });

  // Load history on page load
  loadHistory();
});
