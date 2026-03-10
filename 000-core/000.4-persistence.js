/**
 * Ms. Luminara Quiz - Persistence Layer
 * Manages localStorage for player progress, achievements, and question history
 */

class PersistenceManager {
  constructor() {
    this.STORAGE_KEY = 'ms_luminara_quiz_data';
    this.data = this.load();
  }

  getDefaultData() {
    return {
      player: {
        totalXP: 0,
        level: 1,
        currentStreak: 0,
        bestStreak: 0,
        totalAnswered: 0,
        totalCorrectFirstTry: 0,
        achievements: [],
        lastSession: null,
        sessionsCompleted: 0,
        // HP System
        hp: 100,
        maxHP: 100,
        knockouts: 0
      },
      categories: {},
      questionHistory: {},
      session: {
        startTime: null,
        xpEarned: 0,
        questionsAnswered: 0,
        correctFirstTry: 0,
        achievementsUnlocked: [],
        streakAtStart: 0
      }
    };
  }

  load() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle schema updates
        return this.mergeWithDefaults(parsed);
      }
    } catch (e) {
      console.warn('Failed to load saved data, starting fresh:', e);
    }
    return this.getDefaultData();
  }

  mergeWithDefaults(saved) {
    const defaults = this.getDefaultData();
    return {
      player: { ...defaults.player, ...saved.player },
      categories: { ...defaults.categories, ...saved.categories },
      questionHistory: { ...defaults.questionHistory, ...saved.questionHistory },
      session: { ...defaults.session }
    };
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }

  // Session Management
  startSession() {
    this.data.session = {
      startTime: new Date().toISOString(),
      xpEarned: 0,
      questionsAnswered: 0,
      correctFirstTry: 0,
      achievementsUnlocked: [],
      streakAtStart: this.data.player.currentStreak
    };
    this.save();
  }

  endSession() {
    this.data.player.lastSession = new Date().toISOString();
    this.data.player.sessionsCompleted++;
    this.save();
    return this.getSessionSummary();
  }

  getSessionSummary() {
    const session = this.data.session;
    const player = this.data.player;
    return {
      duration: session.startTime ?
        Math.round((Date.now() - new Date(session.startTime).getTime()) / 60000) : 0,
      xpEarned: session.xpEarned,
      questionsAnswered: session.questionsAnswered,
      correctFirstTry: session.correctFirstTry,
      accuracy: session.questionsAnswered > 0 ?
        Math.round((session.correctFirstTry / session.questionsAnswered) * 100) : 0,
      achievementsUnlocked: session.achievementsUnlocked,
      streakChange: player.currentStreak - session.streakAtStart,
      bestStreak: player.bestStreak,
      totalXP: player.totalXP,
      level: player.level
    };
  }

  // Player Stats
  addXP(amount) {
    this.data.player.totalXP += amount;
    this.data.session.xpEarned += amount;
    this.updateLevel();
    this.save();
    return this.data.player.totalXP;
  }

  updateLevel() {
    // Exponential level curve: 500, 1200, 2500, 4500, 7500, etc.
    const xp = this.data.player.totalXP;
    let level = 1;
    let threshold = 500;
    let increment = 700;

    while (xp >= threshold) {
      level++;
      threshold += increment;
      increment += 500;
    }

    const oldLevel = this.data.player.level;
    this.data.player.level = level;
    return level > oldLevel ? level : null; // Returns new level if leveled up
  }

  getLevelProgress() {
    const xp = this.data.player.totalXP;
    let currentThreshold = 0;
    let nextThreshold = 500;
    let increment = 700;

    while (xp >= nextThreshold) {
      currentThreshold = nextThreshold;
      nextThreshold += increment;
      increment += 500;
    }

    return {
      current: xp - currentThreshold,
      needed: nextThreshold - currentThreshold,
      percentage: Math.round(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    };
  }

  // Streak Management
  incrementStreak() {
    this.data.player.currentStreak++;
    if (this.data.player.currentStreak > this.data.player.bestStreak) {
      this.data.player.bestStreak = this.data.player.currentStreak;
    }
    this.save();
    return this.data.player.currentStreak;
  }

  breakStreak() {
    const broken = this.data.player.currentStreak;
    this.data.player.currentStreak = 0;
    this.save();
    return broken;
  }

  getStreak() {
    return this.data.player.currentStreak;
  }

  // Question History
  recordQuestion(questionId, wasCorrectFirstTry) {
    const history = this.data.questionHistory[questionId] || {
      attempts: 0,
      correctFirstTry: false,
      timesCorrect: 0,
      lastSeen: null
    };

    history.attempts++;
    history.lastSeen = new Date().toISOString();

    if (wasCorrectFirstTry && history.attempts === 1) {
      history.correctFirstTry = true;
    }
    if (wasCorrectFirstTry) {
      history.timesCorrect++;
    }

    this.data.questionHistory[questionId] = history;
    this.data.player.totalAnswered++;
    this.data.session.questionsAnswered++;

    if (wasCorrectFirstTry) {
      this.data.player.totalCorrectFirstTry++;
      this.data.session.correctFirstTry++;
    }

    this.save();
    return history;
  }

  getQuestionHistory(questionId) {
    return this.data.questionHistory[questionId] || null;
  }

  wasQuestionPreviouslyWrong(questionId) {
    const history = this.data.questionHistory[questionId];
    return history && !history.correctFirstTry && history.attempts > 0;
  }

  // Category Progress
  updateCategoryProgress(categoryKey, totalQuestions) {
    const history = this.data.questionHistory;
    let answered = 0;
    let correct = 0;

    // Count questions in this category
    // Convert category key (e.g., "100-1") to question prefix (e.g., "100.1")
    const questionPrefix = categoryKey.replace(/-/g, '.');
    for (const [qId, qData] of Object.entries(history)) {
      if (qId.startsWith(questionPrefix)) {
        answered++;
        if (qData.correctFirstTry) correct++;
      }
    }

    this.data.categories[categoryKey] = {
      answered,
      correct,
      total: totalQuestions,
      mastery: totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0
    };

    this.save();
    return this.data.categories[categoryKey];
  }

  getCategoryProgress(categoryKey) {
    return this.data.categories[categoryKey] || { answered: 0, correct: 0, total: 0, mastery: 0 };
  }

  getAllCategoryProgress() {
    return this.data.categories;
  }

  // Achievement Management
  unlockAchievement(achievementId) {
    if (!this.data.player.achievements.includes(achievementId)) {
      this.data.player.achievements.push(achievementId);
      this.data.session.achievementsUnlocked.push(achievementId);
      this.save();
      return true;
    }
    return false;
  }

  hasAchievement(achievementId) {
    return this.data.player.achievements.includes(achievementId);
  }

  getAchievements() {
    return this.data.player.achievements;
  }

  // Utility
  getPlayer() {
    return this.data.player;
  }

  getSession() {
    return this.data.session;
  }

  getCurrentHour() {
    return new Date().getHours();
  }

  resetProgress() {
    this.data = this.getDefaultData();
    this.save();
  }

  /**
   * Export progress data for backup
   */
  exportData() {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: this.data
    };
  }

  /**
   * Import progress data from backup
   */
  importData(importedData) {
    if (!importedData || !importedData.data) {
      throw new Error('Invalid backup file format');
    }
    this.data = this.mergeWithDefaults(importedData.data);
    this.save();
    return true;
  }
}

// Export singleton
const persistence = new PersistenceManager();

// Global progress control functions
function exportProgress() {
  const exportData = persistence.exportData();
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `luminara-progress-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Show feedback
  alert('Progress exported! Check your downloads folder.');
}

function importProgress(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);
      persistence.importData(importedData);

      alert('Progress imported successfully! Refreshing...');
      location.reload();
    } catch (err) {
      alert('Failed to import: ' + err.message);
    }
  };
  reader.readAsText(file);

  // Reset the input so the same file can be selected again
  input.value = '';
}

function confirmResetProgress() {
  const confirmed = confirm(
    'Are you sure you want to reset ALL progress?\n\n' +
    'This will delete:\n' +
    '• Your XP and level\n' +
    '• All achievements\n' +
    '• Question history\n' +
    '• Category mastery\n\n' +
    'This cannot be undone!'
  );

  if (confirmed) {
    const doubleConfirm = confirm('Really? This is permanent. Last chance to cancel.');
    if (doubleConfirm) {
      persistence.resetProgress();
      alert('Progress reset. Refreshing...');
      location.reload();
    }
  }
}
