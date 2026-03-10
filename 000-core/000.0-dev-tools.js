/**
 * Ms. Luminara Quiz - Dev Tools
 * Toggle dev panel with Ctrl+D
 */

// Dev panel state
let devPanelVisible = false;

// Initialize dev tools
document.addEventListener('DOMContentLoaded', () => {
  // Check if running on localhost (dev mode)
  const isDevMode = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    window.location.protocol === 'file:';

  if (isDevMode) {
    createDevModeIndicator();
    updateDevInfo();
  }
});

// Keyboard shortcut: Ctrl+D to toggle dev panel
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'd') {
    e.preventDefault();
    toggleDevPanel();
  }
  // Ctrl+R to reload (already native, but let's make sure CSS reloads too)
  if (e.ctrlKey && e.key === 'r') {
    // Let native reload happen
  }
});

// Toggle dev panel visibility
function toggleDevPanel() {
  const panel = document.getElementById('devPanel');
  if (panel) {
    devPanelVisible = !devPanelVisible;
    panel.classList.toggle('hidden', !devPanelVisible);
    if (devPanelVisible) {
      updateDevInfo();
    }
  }
}

// Create dev mode indicator badge
function createDevModeIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'dev-mode-indicator';
  indicator.innerHTML = 'DEV MODE (Ctrl+D)';
  indicator.onclick = toggleDevPanel;
  document.body.appendChild(indicator);
}

// Show toast notification
function showDevToast(message) {
  const toast = document.createElement('div');
  toast.className = 'dev-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// Reload CSS without full page refresh
function reloadStyles() {
  const links = document.querySelectorAll('link[rel="stylesheet"]');
  links.forEach(link => {
    const href = link.href.split('?')[0];
    link.href = href + '?v=' + Date.now();
  });
  showDevToast('CSS reloaded!');
}

// Reload questions (if quiz object exists)
function reloadQuestions() {
  if (typeof quiz !== 'undefined' && quiz.loadRegistry) {
    quiz.loadRegistry().then(() => {
      showDevToast('Questions reloaded!');
    });
  } else {
    location.reload();
  }
}

// Update CSS custom property
function updateCSSVar(varName, value) {
  document.documentElement.style.setProperty(varName, value);
  showDevToast(`Updated ${varName}`);
}

// Update dev info panel
function updateDevInfo() {
  const infoDiv = document.getElementById('devInfo');
  if (!infoDiv) return;

  // Count questions if quiz is loaded
  let questionCount = '...';
  let categoryCount = '...';

  if (typeof quiz !== 'undefined' && quiz.registry) {
    categoryCount = quiz.registry.categories?.length || 0;
    questionCount = quiz.registry.categories?.reduce((sum, cat) => {
      return sum + (cat.banks?.reduce((s, b) => s + (b.questionCount || 0), 0) || 0);
    }, 0) || '...';
  }

  infoDiv.innerHTML = `
    <strong>Server:</strong> ${window.location.host}<br>
    <strong>Categories:</strong> ${categoryCount}<br>
    <strong>Questions:</strong> ${questionCount}<br>
    <strong>Last refresh:</strong> ${new Date().toLocaleTimeString()}<br>
    <br>
    <strong>Keyboard:</strong><br>
    Ctrl+D: Toggle this panel<br>
    Ctrl+R: Reload page<br>
    F5: Refresh
  `;
}

// Auto-refresh dev info every 5 seconds when panel is open
setInterval(() => {
  if (devPanelVisible) {
    updateDevInfo();
  }
}, 5000);

// Expose functions globally
window.toggleDevPanel = toggleDevPanel;
window.reloadStyles = reloadStyles;
window.reloadQuestions = reloadQuestions;
window.updateCSSVar = updateCSSVar;
window.showDevToast = showDevToast;

console.log('%c Ms. Luminara Dev Tools Loaded ', 'background: #8b5cf6; color: white; padding: 4px 8px; border-radius: 4px;');
console.log('Press Ctrl+D to open dev panel');
