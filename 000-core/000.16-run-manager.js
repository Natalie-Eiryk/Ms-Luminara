/**
 * Ms. Luminara Quiz - Run Manager
 * Roguelike run state management for "The Luminara Gauntlet"
 */

class RunManager {
  constructor() {
    this.STORAGE_KEY = 'ms_luminara_runs';
    this.data = this.loadData();
    this.activeRun = null;
  }

  loadData() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load run data:', e);
    }
    return this.getDefaultData();
  }

  getDefaultData() {
    return {
      totalRuns: 0,
      completedRuns: 0,
      abandonedRuns: 0,
      highScores: [], // Top 10
      bestRunStreak: 0,
      currentRunStreak: 0,
      totalQuestionsInRuns: 0,
      totalBossesDefeatedInRuns: 0,
      arcadeTokens: 0,
      unlockedDifficulties: ['easy', 'normal'],
      runHistory: [] // Last 20 runs
    };
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save run data:', e);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // RUN LIFECYCLE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Start a new roguelike run
   */
  startRun(difficulty = 'normal', categoryId = null) {
    this.data.totalRuns++;

    this.activeRun = {
      id: this.generateRunId(),
      startTime: Date.now(),
      difficulty,
      categoryId, // null = mixed categories

      // Wave tracking
      wave: 1,
      waveProgress: 0,
      questionsPerWave: this.getQuestionsPerWave(difficulty),

      // Score components
      score: 0,
      questionsAnswered: 0,
      correctFirstTry: 0,
      wrongAnswers: 0,

      // Streak tracking
      currentStreak: 0,
      bestStreakThisRun: 0,

      // Combat
      bossesDefeated: [],
      bossesAttempted: 0,
      totalDamageDealt: 0,
      totalDamageTaken: 0,

      // Resources
      playerHP: 100,
      powerUpsUsed: [],
      activePowerUps: [],
      lootCollected: [],

      // Modifiers
      xpMultiplier: this.getDifficultyXPMultiplier(difficulty),
      damageMultiplier: 1,

      // State
      phase: 'questions', // 'questions', 'shop', 'boss', 'victory', 'defeat'
      completed: false,
      victory: false
    };

    this.save();
    return this.activeRun;
  }

  /**
   * Generate unique run ID
   */
  generateRunId() {
    return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get questions per wave based on difficulty
   */
  getQuestionsPerWave(difficulty) {
    const waveSizes = {
      easy: 3,
      normal: 5,
      hard: 7,
      nightmare: 10
    };
    return waveSizes[difficulty] || 5;
  }

  /**
   * Get difficulty XP multiplier
   */
  getDifficultyXPMultiplier(difficulty) {
    const multipliers = {
      easy: 0.5,
      normal: 1.0,
      hard: 1.5,
      nightmare: 2.5
    };
    return multipliers[difficulty] || 1.0;
  }

  // ═══════════════════════════════════════════════════════════════
  // IN-RUN UPDATES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Record a question answer during run
   */
  recordAnswer(wasCorrect, wasFirstTry) {
    if (!this.activeRun) return null;

    this.activeRun.questionsAnswered++;
    this.activeRun.waveProgress++;

    if (wasCorrect) {
      if (wasFirstTry) {
        this.activeRun.correctFirstTry++;
        this.activeRun.currentStreak++;
        this.activeRun.bestStreakThisRun = Math.max(
          this.activeRun.bestStreakThisRun,
          this.activeRun.currentStreak
        );
      }
    } else {
      this.activeRun.wrongAnswers++;
      this.activeRun.currentStreak = 0;
    }

    // Check wave completion
    const waveComplete = this.activeRun.waveProgress >= this.activeRun.questionsPerWave;

    this.save();

    return {
      waveComplete,
      waveProgress: this.activeRun.waveProgress,
      questionsRemaining: this.activeRun.questionsPerWave - this.activeRun.waveProgress,
      currentStreak: this.activeRun.currentStreak
    };
  }

  /**
   * Complete current wave
   */
  completeWave() {
    if (!this.activeRun) return null;

    const waveNumber = this.activeRun.wave;
    this.activeRun.wave++;
    this.activeRun.waveProgress = 0;

    // Every 2nd wave is a boss
    const triggersBoss = waveNumber % 2 === 0;

    // Award wave completion bonus
    const waveBonus = 100 * waveNumber;
    this.activeRun.score += waveBonus;

    this.save();

    return {
      waveNumber,
      newWave: this.activeRun.wave,
      triggersBoss,
      waveBonus
    };
  }

  /**
   * Record boss damage dealt
   */
  recordBossDamage(amount, fromPlayer = true) {
    if (!this.activeRun) return;

    if (fromPlayer) {
      this.activeRun.totalDamageDealt += amount;
    } else {
      this.activeRun.totalDamageTaken += amount;
      this.activeRun.playerHP = Math.max(0, this.activeRun.playerHP - amount);
    }

    this.save();
  }

  /**
   * Record boss defeat
   */
  recordBossDefeat(bossId, battleData) {
    if (!this.activeRun) return null;

    this.activeRun.bossesDefeated.push({
      bossId,
      wave: this.activeRun.wave,
      battleTime: battleData.battleTime,
      damageDealt: battleData.playerDamageDealt
    });

    // Boss defeat bonus
    const bossBonus = 1000;
    this.activeRun.score += bossBonus;

    this.save();

    return { bossBonus };
  }

  /**
   * Use a power-up
   */
  usePowerUp(powerUpId) {
    if (!this.activeRun) return false;

    this.activeRun.powerUpsUsed.push({
      id: powerUpId,
      wave: this.activeRun.wave,
      timestamp: Date.now()
    });

    this.save();
    return true;
  }

  /**
   * Heal player HP
   */
  healPlayer(amount) {
    if (!this.activeRun) return 0;

    const before = this.activeRun.playerHP;
    this.activeRun.playerHP = Math.min(100, this.activeRun.playerHP + amount);
    const healed = this.activeRun.playerHP - before;

    this.save();
    return healed;
  }

  /**
   * Update run phase
   */
  setPhase(phase) {
    if (!this.activeRun) return;
    this.activeRun.phase = phase;
    this.save();
  }

  // ═══════════════════════════════════════════════════════════════
  // RUN COMPLETION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Calculate final run score
   */
  calculateFinalScore() {
    if (!this.activeRun) return 0;

    const run = this.activeRun;

    // Base score from questions
    let score = run.questionsAnswered * 100;
    score += run.correctFirstTry * 200;

    // Streak bonus
    score += run.bestStreakThisRun * 150;

    // Boss bonuses
    score += run.bossesDefeated.length * 1000;

    // Time bonus (under 10 minutes = bonus)
    const minutes = (Date.now() - run.startTime) / 60000;
    if (minutes < 10) {
      score += Math.floor((10 - minutes) * 50);
    }

    // HP survival bonus
    score += run.playerHP * 5;

    // Power-up penalty (small)
    score -= run.powerUpsUsed.length * 25;

    // Difficulty multiplier
    const diffMult = {
      easy: 0.5,
      normal: 1.0,
      hard: 1.5,
      nightmare: 2.5
    };
    score = Math.floor(score * (diffMult[run.difficulty] || 1));

    return Math.max(0, score);
  }

  /**
   * Complete run (victory or defeat)
   */
  completeRun(victory = true) {
    if (!this.activeRun) return null;

    this.activeRun.completed = true;
    this.activeRun.victory = victory;
    this.activeRun.endTime = Date.now();
    this.activeRun.score = this.calculateFinalScore();

    // Calculate arcade tokens earned
    const tokensEarned = Math.floor(this.activeRun.score / 500);
    this.data.arcadeTokens += tokensEarned;

    // Update stats
    if (victory) {
      this.data.completedRuns++;
      this.data.currentRunStreak++;
      this.data.bestRunStreak = Math.max(this.data.bestRunStreak, this.data.currentRunStreak);
    } else {
      this.data.currentRunStreak = 0;
    }

    this.data.totalQuestionsInRuns += this.activeRun.questionsAnswered;
    this.data.totalBossesDefeatedInRuns += this.activeRun.bossesDefeated.length;

    // Check for high score
    const isHighScore = this.checkHighScore(this.activeRun);

    // Add to history
    this.addToHistory(this.activeRun);

    // Check difficulty unlocks
    this.checkDifficultyUnlocks();

    const summary = this.getRunSummary();

    // Clear active run
    const completedRun = this.activeRun;
    this.activeRun = null;

    this.save();

    return {
      ...summary,
      tokensEarned,
      isHighScore,
      completedRun
    };
  }

  /**
   * Abandon current run
   */
  abandonRun() {
    if (!this.activeRun) return;

    this.data.abandonedRuns++;
    this.data.currentRunStreak = 0;
    this.activeRun = null;

    this.save();
  }

  /**
   * Check if score qualifies for high scores
   */
  checkHighScore(run) {
    const score = run.score;

    // Get existing scores
    const scores = [...this.data.highScores];

    // Check if qualifies (top 10)
    if (scores.length < 10 || score > scores[scores.length - 1].score) {
      scores.push({
        score,
        date: new Date().toISOString(),
        difficulty: run.difficulty,
        waves: run.wave,
        bossesDefeated: run.bossesDefeated.length,
        bestStreak: run.bestStreakThisRun,
        runTime: Math.floor((run.endTime - run.startTime) / 1000)
      });

      // Sort and keep top 10
      scores.sort((a, b) => b.score - a.score);
      this.data.highScores = scores.slice(0, 10);

      return true;
    }

    return false;
  }

  /**
   * Add run to history
   */
  addToHistory(run) {
    this.data.runHistory.unshift({
      id: run.id,
      date: new Date().toISOString(),
      score: run.score,
      victory: run.victory,
      difficulty: run.difficulty,
      waves: run.wave,
      bossesDefeated: run.bossesDefeated.length
    });

    // Keep last 20
    if (this.data.runHistory.length > 20) {
      this.data.runHistory = this.data.runHistory.slice(0, 20);
    }
  }

  /**
   * Check for difficulty unlocks
   */
  checkDifficultyUnlocks() {
    // Unlock hard after 3 completed runs
    if (this.data.completedRuns >= 3 && !this.data.unlockedDifficulties.includes('hard')) {
      this.data.unlockedDifficulties.push('hard');
    }

    // Unlock nightmare after completing hard
    const hardVictory = this.data.runHistory.some(r => r.victory && r.difficulty === 'hard');
    if (hardVictory && !this.data.unlockedDifficulties.includes('nightmare')) {
      this.data.unlockedDifficulties.push('nightmare');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get current run summary
   */
  getRunSummary() {
    if (!this.activeRun) return null;

    const run = this.activeRun;
    const duration = Math.floor((Date.now() - run.startTime) / 1000);

    return {
      runId: run.id,
      difficulty: run.difficulty,
      wave: run.wave,
      waveProgress: run.waveProgress,
      questionsPerWave: run.questionsPerWave,
      score: this.calculateFinalScore(),
      questionsAnswered: run.questionsAnswered,
      correctFirstTry: run.correctFirstTry,
      accuracy: run.questionsAnswered > 0 ?
        Math.round((run.correctFirstTry / run.questionsAnswered) * 100) : 0,
      currentStreak: run.currentStreak,
      bestStreak: run.bestStreakThisRun,
      bossesDefeated: run.bossesDefeated.length,
      playerHP: run.playerHP,
      duration,
      phase: run.phase
    };
  }

  /**
   * Get active run state
   */
  getActiveRun() {
    return this.activeRun;
  }

  /**
   * Check if run is active
   */
  isRunActive() {
    return this.activeRun !== null && !this.activeRun.completed;
  }

  /**
   * Get high scores
   */
  getHighScores() {
    return this.data.highScores;
  }

  /**
   * Get all stats
   */
  getAllStats() {
    return {
      totalRuns: this.data.totalRuns,
      completedRuns: this.data.completedRuns,
      completionRate: this.data.totalRuns > 0 ?
        Math.round((this.data.completedRuns / this.data.totalRuns) * 100) : 0,
      bestRunStreak: this.data.bestRunStreak,
      arcadeTokens: this.data.arcadeTokens,
      unlockedDifficulties: this.data.unlockedDifficulties,
      totalQuestionsInRuns: this.data.totalQuestionsInRuns,
      totalBossesDefeatedInRuns: this.data.totalBossesDefeatedInRuns
    };
  }

  /**
   * Check if difficulty is unlocked
   */
  isDifficultyUnlocked(difficulty) {
    return this.data.unlockedDifficulties.includes(difficulty);
  }

  /**
   * Spend arcade tokens
   */
  spendTokens(amount) {
    if (this.data.arcadeTokens >= amount) {
      this.data.arcadeTokens -= amount;
      this.save();
      return true;
    }
    return false;
  }
}

// Export singleton
let runManager = null;
