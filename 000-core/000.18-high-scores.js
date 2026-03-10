/**
 * Ms. Luminara Quiz - High Scores System
 * Arcade-style leaderboard for "The Luminara Gauntlet"
 */

// ============================================================================
// RANK TITLES
// ============================================================================

const RANK_TITLES = [
  { minScore: 0,      title: 'Study Sprout',        icon: '🌱', color: '#9ca3af' },
  { minScore: 1000,   title: 'Quiz Apprentice',     icon: '📖', color: '#22c55e' },
  { minScore: 2500,   title: 'Knowledge Seeker',    icon: '🔍', color: '#3b82f6' },
  { minScore: 5000,   title: 'Brain Trainee',       icon: '🧠', color: '#8b5cf6' },
  { minScore: 7500,   title: 'Anatomy Adept',       icon: '⚕️', color: '#ec4899' },
  { minScore: 10000,  title: 'Scholar',             icon: '🎓', color: '#f59e0b' },
  { minScore: 15000,  title: 'Master Student',      icon: '📚', color: '#ef4444' },
  { minScore: 20000,  title: 'Grand Scholar',       icon: '🏛️', color: '#14b8a6' },
  { minScore: 30000,  title: 'Professor',           icon: '👨‍🏫', color: '#f97316' },
  { minScore: 50000,  title: 'Anatomy Overlord',    icon: '👑', color: '#eab308' },
  { minScore: 75000,  title: "Luminara's Champion", icon: '🌟', color: '#06b6d4' },
  { minScore: 100000, title: 'Legendary Scholar',   icon: '⭐', color: '#a855f7' }
];

// ============================================================================
// FUN FACTS FOR END OF RUN
// ============================================================================

const FUN_FACTS_POOL = [
  "The human body has 206 bones. You just learned a few more names!",
  "Your brain uses about 20% of your body's energy. Smart moves cost calories!",
  "The average human heart beats about 100,000 times per day.",
  "Your neurons can transmit signals at up to 268 mph!",
  "The smallest bone in your body is in your ear - the stapes.",
  "You have more bacteria in your gut than cells in your body.",
  "The liver can regenerate itself from just 25% of its original tissue.",
  "Your body produces about 25 million new cells each second.",
  "The human nose can detect over 1 trillion different scents.",
  "Nerve impulses to and from the brain travel as fast as 250 mph.",
  "The cornea is the only part of the body with no blood supply.",
  "Your eyes can distinguish about 10 million different colors.",
  "The surface area of a human lung is equal to a tennis court.",
  "Human bone is as strong as granite in supporting weight.",
  "The acid in your stomach is strong enough to dissolve zinc.",
  "Your body contains about 37.2 trillion cells.",
  "The human brain can hold 2.5 petabytes of data.",
  "You produce about a liter of saliva every day.",
  "The largest organ in your body is your skin.",
  "Fingernails grow about 4 times faster than toenails.",
  "The gluteus maximus is the largest muscle in your body.",
  "Your blood makes a complete circuit of your body every 60 seconds.",
  "The tongue is the only muscle attached at one end.",
  "The femur is stronger than concrete.",
  "You blink about 15-20 times per minute without realizing it."
];

// ============================================================================
// ACHIEVEMENTS FOR RUNS
// ============================================================================

const RUN_ACHIEVEMENTS = {
  // Score-based
  FIRST_VICTORY:     { id: 'first_victory', name: 'First Steps', desc: 'Complete your first run', icon: '🎯' },
  SCORE_5K:          { id: 'score_5k', name: 'Getting Serious', desc: 'Score 5,000+ points in a run', icon: '🔥' },
  SCORE_10K:         { id: 'score_10k', name: 'On Fire', desc: 'Score 10,000+ points in a run', icon: '💥' },
  SCORE_25K:         { id: 'score_25k', name: 'Unstoppable', desc: 'Score 25,000+ points in a run', icon: '⚡' },
  SCORE_50K:         { id: 'score_50k', name: 'Legendary Run', desc: 'Score 50,000+ points in a run', icon: '🌟' },

  // Streak-based
  STREAK_5:          { id: 'streak_5', name: 'Warming Up', desc: 'Get a 5-answer streak', icon: '🔗' },
  STREAK_10:         { id: 'streak_10', name: 'On a Roll', desc: 'Get a 10-answer streak', icon: '🎢' },
  STREAK_20:         { id: 'streak_20', name: 'Untouchable', desc: 'Get a 20-answer streak', icon: '👊' },

  // Boss-based
  BOSS_SLAYER:       { id: 'boss_slayer', name: 'Boss Slayer', desc: 'Defeat your first boss', icon: '⚔️' },
  BOSS_HUNTER:       { id: 'boss_hunter', name: 'Boss Hunter', desc: 'Defeat 3 bosses in one run', icon: '🎯' },
  BOSS_MASTER:       { id: 'boss_master', name: 'Boss Master', desc: 'Defeat all regular bosses', icon: '🏆' },
  SECRET_FOUND:      { id: 'secret_found', name: 'Hidden Challenge', desc: 'Discover the secret boss', icon: '🔮' },
  SECRET_SLAIN:      { id: 'secret_slain', name: 'True Champion', desc: 'Defeat the secret boss', icon: '👑' },

  // Performance-based
  PERFECT_WAVE:      { id: 'perfect_wave', name: 'Perfect Wave', desc: 'Complete a wave with all first-try answers', icon: '🌊' },
  FLAWLESS_RUN:      { id: 'flawless_run', name: 'Flawless Victory', desc: 'Complete a run with no wrong answers', icon: '💎' },
  SPEEDRUNNER:       { id: 'speedrunner', name: 'Speedrunner', desc: 'Complete a run in under 5 minutes', icon: '⏱️' },
  SURVIVOR:          { id: 'survivor', name: 'Survivor', desc: 'Win a run with less than 10 HP', icon: '💀' },
  COMEBACK:          { id: 'comeback', name: 'The Comeback', desc: 'Win after dropping below 25 HP', icon: '🔄' },

  // Cumulative
  RUNS_10:           { id: 'runs_10', name: 'Dedicated', desc: 'Complete 10 runs', icon: '📅' },
  RUNS_50:           { id: 'runs_50', name: 'Committed', desc: 'Complete 50 runs', icon: '📆' },
  RUNS_100:          { id: 'runs_100', name: 'Obsessed', desc: 'Complete 100 runs', icon: '🗓️' },
  TOTAL_SCORE_100K:  { id: 'total_100k', name: 'Point Collector', desc: 'Earn 100,000 total points', icon: '💰' },
  TOTAL_SCORE_1M:    { id: 'total_1m', name: 'Point Hoarder', desc: 'Earn 1,000,000 total points', icon: '🏦' }
};

// ============================================================================
// HIGH SCORES MANAGER CLASS
// ============================================================================

class HighScoreManager {
  constructor() {
    this.STORAGE_KEY = 'ms_luminara_highscores';
    this.data = this.loadData();
  }

  loadData() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load high score data:', e);
    }
    return this.getDefaultData();
  }

  getDefaultData() {
    return {
      scores: [],              // Top 10 scores with details
      personalBests: {
        highestScore: 0,
        longestStreak: 0,
        fastestRun: null,      // seconds
        mostBosses: 0,
        perfectWaves: 0
      },
      achievements: [],        // Unlocked achievement IDs
      totalStats: {
        totalScore: 0,
        totalRuns: 0,
        totalVictories: 0,
        totalBossesDefeated: 0,
        totalQuestionsAnswered: 0,
        totalFirstTryCorrect: 0,
        totalTimePlayed: 0     // seconds
      },
      funFactsShown: []        // Track which facts have been shown
    };
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save high score data:', e);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SCORE SUBMISSION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Submit a completed run for high score consideration
   */
  submitRun(runData) {
    const {
      score,
      difficulty,
      wave,
      questionsAnswered,
      correctFirstTry,
      bestStreak,
      bossesDefeated,
      duration,      // seconds
      playerHP,
      victory,
      wrongAnswers
    } = runData;

    // Update total stats
    this.data.totalStats.totalScore += score;
    this.data.totalStats.totalRuns++;
    if (victory) this.data.totalStats.totalVictories++;
    this.data.totalStats.totalBossesDefeated += bossesDefeated;
    this.data.totalStats.totalQuestionsAnswered += questionsAnswered;
    this.data.totalStats.totalFirstTryCorrect += correctFirstTry;
    this.data.totalStats.totalTimePlayed += duration;

    // Update personal bests
    if (score > this.data.personalBests.highestScore) {
      this.data.personalBests.highestScore = score;
    }
    if (bestStreak > this.data.personalBests.longestStreak) {
      this.data.personalBests.longestStreak = bestStreak;
    }
    if (victory && (!this.data.personalBests.fastestRun || duration < this.data.personalBests.fastestRun)) {
      this.data.personalBests.fastestRun = duration;
    }
    if (bossesDefeated > this.data.personalBests.mostBosses) {
      this.data.personalBests.mostBosses = bossesDefeated;
    }

    // Check for high score placement
    const rank = this.getRankForScore(score);
    const isHighScore = rank !== null;

    if (isHighScore) {
      const entry = {
        score,
        difficulty,
        waves: wave,
        questionsAnswered,
        accuracy: questionsAnswered > 0 ? Math.round((correctFirstTry / questionsAnswered) * 100) : 0,
        bestStreak,
        bossesDefeated,
        duration,
        victory,
        date: new Date().toISOString(),
        title: this.getTitleForScore(score)
      };

      this.data.scores.splice(rank, 0, entry);
      this.data.scores = this.data.scores.slice(0, 10); // Keep top 10
    }

    // Check achievements
    const newAchievements = this.checkAchievements(runData);

    // Get a fun fact
    const funFact = this.getRandomFunFact();

    this.save();

    return {
      isHighScore,
      rank: isHighScore ? rank + 1 : null,
      newAchievements,
      funFact,
      title: this.getTitleForScore(score),
      previousBest: this.data.personalBests.highestScore === score ?
        (this.data.scores[1]?.score || 0) : this.data.personalBests.highestScore
    };
  }

  /**
   * Get rank position for a score (0-indexed)
   */
  getRankForScore(score) {
    for (let i = 0; i < this.data.scores.length; i++) {
      if (score > this.data.scores[i].score) {
        return i;
      }
    }

    // Check if there's room in top 10
    if (this.data.scores.length < 10) {
      return this.data.scores.length;
    }

    return null;
  }

  /**
   * Get title for a score
   */
  getTitleForScore(score) {
    let title = RANK_TITLES[0];

    for (const rank of RANK_TITLES) {
      if (score >= rank.minScore) {
        title = rank;
      }
    }

    return title;
  }

  // ═══════════════════════════════════════════════════════════════
  // ACHIEVEMENTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Check for new achievements after a run
   */
  checkAchievements(runData) {
    const newAchievements = [];
    const unlocked = this.data.achievements;

    const check = (id, condition) => {
      if (!unlocked.includes(id) && condition) {
        unlocked.push(id);
        newAchievements.push(RUN_ACHIEVEMENTS[id]);
      }
    };

    // Score-based
    check('FIRST_VICTORY', runData.victory);
    check('SCORE_5K', runData.score >= 5000);
    check('SCORE_10K', runData.score >= 10000);
    check('SCORE_25K', runData.score >= 25000);
    check('SCORE_50K', runData.score >= 50000);

    // Streak-based
    check('STREAK_5', runData.bestStreak >= 5);
    check('STREAK_10', runData.bestStreak >= 10);
    check('STREAK_20', runData.bestStreak >= 20);

    // Boss-based
    check('BOSS_SLAYER', runData.bossesDefeated >= 1);
    check('BOSS_HUNTER', runData.bossesDefeated >= 3);
    check('BOSS_MASTER', runData.allBossesDefeated);
    check('SECRET_FOUND', runData.secretBossEncountered);
    check('SECRET_SLAIN', runData.secretBossDefeated);

    // Performance-based
    check('PERFECT_WAVE', runData.hadPerfectWave);
    check('FLAWLESS_RUN', runData.victory && runData.wrongAnswers === 0);
    check('SPEEDRUNNER', runData.victory && runData.duration < 300);
    check('SURVIVOR', runData.victory && runData.playerHP < 10);
    check('COMEBACK', runData.victory && runData.wentBelowCriticalHP);

    // Cumulative
    const stats = this.data.totalStats;
    check('RUNS_10', stats.totalVictories >= 10);
    check('RUNS_50', stats.totalVictories >= 50);
    check('RUNS_100', stats.totalVictories >= 100);
    check('TOTAL_SCORE_100K', stats.totalScore >= 100000);
    check('TOTAL_SCORE_1M', stats.totalScore >= 1000000);

    return newAchievements;
  }

  /**
   * Get all achievements with unlock status
   */
  getAllAchievements() {
    return Object.values(RUN_ACHIEVEMENTS).map(achievement => ({
      ...achievement,
      unlocked: this.data.achievements.includes(achievement.id)
    }));
  }

  /**
   * Get unlocked achievement count
   */
  getAchievementProgress() {
    return {
      unlocked: this.data.achievements.length,
      total: Object.keys(RUN_ACHIEVEMENTS).length
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // FUN FACTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get a random fun fact (avoid repeats)
   */
  getRandomFunFact() {
    // Reset if we've shown all facts
    if (this.data.funFactsShown.length >= FUN_FACTS_POOL.length) {
      this.data.funFactsShown = [];
    }

    // Find a fact we haven't shown
    const available = FUN_FACTS_POOL.filter((_, i) => !this.data.funFactsShown.includes(i));
    const index = Math.floor(Math.random() * available.length);
    const factIndex = FUN_FACTS_POOL.indexOf(available[index]);

    this.data.funFactsShown.push(factIndex);
    this.save();

    return available[index];
  }

  // ═══════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get top 10 scores
   */
  getHighScores() {
    return this.data.scores.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  }

  /**
   * Get personal bests
   */
  getPersonalBests() {
    return this.data.personalBests;
  }

  /**
   * Get total stats
   */
  getTotalStats() {
    return this.data.totalStats;
  }

  /**
   * Get all rank titles
   */
  getRankTitles() {
    return RANK_TITLES;
  }

  /**
   * Get current player rank title based on highest score
   */
  getCurrentTitle() {
    return this.getTitleForScore(this.data.personalBests.highestScore);
  }

  /**
   * Get next rank title and points needed
   */
  getNextRank() {
    const current = this.data.personalBests.highestScore;
    const currentTitle = this.getTitleForScore(current);

    for (const rank of RANK_TITLES) {
      if (rank.minScore > current) {
        return {
          title: rank,
          pointsNeeded: rank.minScore - current
        };
      }
    }

    return null; // Already at max rank
  }

  /**
   * Format duration as MM:SS
   */
  formatDuration(seconds) {
    if (!seconds && seconds !== 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format score with commas
   */
  formatScore(score) {
    return score.toLocaleString();
  }

  /**
   * Get score breakdown for display
   */
  getScoreBreakdown(runData) {
    const {
      questionsAnswered,
      correctFirstTry,
      bestStreak,
      bossesDefeated,
      duration,
      playerHP,
      difficulty
    } = runData;

    const baseScore = questionsAnswered * 100 + correctFirstTry * 200;
    const streakBonus = bestStreak * 150;
    const bossBonus = bossesDefeated * 1000;
    const timeBonus = Math.max(0, Math.floor((600 - duration) * 2));
    const hpBonus = playerHP * 5;

    const diffMult = {
      easy: 0.5,
      normal: 1.0,
      hard: 1.5,
      nightmare: 2.5
    }[difficulty] || 1;

    const subtotal = baseScore + streakBonus + bossBonus + timeBonus + hpBonus;
    const total = Math.floor(subtotal * diffMult);

    return {
      baseScore,
      streakBonus,
      bossBonus,
      timeBonus,
      hpBonus,
      difficultyMultiplier: diffMult,
      subtotal,
      total
    };
  }
}

// Export singleton
let highScoreManager = null;
